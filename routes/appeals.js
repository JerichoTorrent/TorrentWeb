import express from "express";
import OpenAI from "openai";
import multer from "multer";
import mysql from "mysql2/promise";
import { extractTextFromDocx } from "../utils/docx.js";
import { scanBufferWithClamAV } from "../utils/scanFile.js";
import { sendAppealPanel, checkDiscordPunishment } from "../utils/discord.js";
import db from "../utils/db.js";
import requireAuth from "../middleware/authMiddleware.js";
import rateLimiter from "../utils/rateLimiter.js";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

const VALID_TYPES = ["minecraft-ban", "minecraft-mute", "discord"];
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const litebans = mysql.createPool({
  host: process.env.LITEBANS_DB_HOST,
  user: process.env.LITEBANS_DB_USER,
  password: process.env.LITEBANS_DB_PASS,
  database: process.env.LITEBANS_DB_NAME,
  port: process.env.LITEBANS_DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

// --- Check eligibility ---
router.use("/check-eligibility", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("Content-Type", "application/json");
  next();
});

router.get("/check-eligibility", requireAuth, async (req, res) => {
  const { type } = req.query;
  const user = req.user;

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: "Invalid appeal type." });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM appeals WHERE uuid = ? AND type = ? AND created_at > NOW() - INTERVAL 30 DAY LIMIT 1",
      [user.uuid, type]
    );

    if (rows.length > 0) {
      const last = new Date(rows[0].created_at);
      const now = new Date();
      const secondsRemaining = Math.max(0, 2592000 - Math.floor((now - last) / 1000));
      return res.status(200).json({ eligible: false, cooldown: secondsRemaining });
    }

    const eligible = await checkActivePunishment(user.uuid, user.username, type, user.discordId);
    return res.status(200).json({ eligible });
  } catch (err) {
    console.error("❌ [Appeals] Eligibility check failed:", err);
    res.status(500).json({ error: "Failed to check eligibility." });
  }
});

// --- Check active punishments ---
async function checkActivePunishment(uuid, username, type, discordId = null) {
  if (type === "discord") {
    if (!discordId) return false;
    try {
      const result = await checkDiscordPunishment(discordId);
      return result?.active === true;
    } catch {
      return false;
    }
  }

  const table = type === "minecraft-ban" ? "litebans_bans" : "litebans_mutes";

  try {
    const [uuidMatch] = await litebans.query(
      `SELECT 1 FROM ${table} WHERE uuid = ? AND active = 1 LIMIT 1`,
      [uuid]
    );
    if (uuidMatch.length) return true;

    const [history] = await litebans.query(
      `SELECT name FROM litebans_history WHERE uuid = ? ORDER BY date DESC LIMIT 1`,
      [uuid]
    );
    if (!history[0]?.name) return false;

    const [offlineMatch] = await litebans.query(
      `SELECT 1 FROM ${table} WHERE uuid = '#offline#' AND active = 1 LIMIT 1`
    );
    return offlineMatch.length > 0;
  } catch {
    return false;
  }
}

// --- Submit appeal ---
router.post(
  "/submit",
  rateLimiter(60, 3, "Too many appeal attempts from this IP. Please wait 1 hour."),
  requireAuth,
  upload.array("files"),
  async (req, res) => {
    const { R2Upload } = await import("../utils/r2.js");
    const { type, message } = req.body;
    const user = req.user;

    if (!VALID_TYPES.includes(type) || !message?.trim()) {
      return res.status(400).json({ error: "Missing or invalid fields." });
    }

    const [recentRows] = await db.query(
      "SELECT * FROM appeals WHERE uuid = ? AND type = ? AND created_at > NOW() - INTERVAL 30 DAY LIMIT 1",
      [user.uuid, type]
    );
    if (recentRows.length) {
      return res.status(429).json({ error: "You can only submit one appeal per type per month." });
    }

    // Validate file count
    if (req.files.length > 5) {
      return res.status(400).json({ error: "You can only upload up to 5 files." });
    }

    const inputs = [{ type: "text", text: message }];
    const fileLinks = [];

    for (const file of req.files) {
      const ext = file.originalname.split(".").pop()?.toLowerCase();
      const sizeLimit = 10 * 1024 * 1024;
    
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(400).json({ error: `Unsupported file type: ${file.originalname}` });
      }
      if (!["png", "jpg", "jpeg", "docx"].includes(ext)) {
        return res.status(400).json({ error: `File extension not allowed: ${file.originalname}` });
      }
      if (file.size > sizeLimit) {
        return res.status(400).json({ error: `File too large: ${file.originalname}` });
      }
    
      // 🧼 Only scan non-image files for viruses
      if (!file.mimetype.startsWith("image/")) {
        try {
          await scanBufferWithClamAV(file.buffer, file.originalname);
        } catch (err) {
          return res.status(400).json({ error: `File "${file.originalname}" failed virus scan.` });
        }
      }
    
      if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const text = await extractTextFromDocx(file.buffer);
        inputs.push({ type: "text", text });
      } else if (file.mimetype.startsWith("image/")) {
        const fileUrl = await R2Upload(file);
        inputs.push({
          type: "image_url",
          image_url: { url: fileUrl }
        });
        fileLinks.push(fileUrl);
        continue;
      }
    
      const fileUrl = await R2Upload(file);
      fileLinks.push(fileUrl);
    }    

    // --- Run OpenAI moderation (only block if category "sexual" is true)
    try {
      const moderation = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: inputs
      });

      const result = moderation.results[0];
      console.log("🔍 Moderation result:", JSON.stringify(result, null, 2));

      const isSexual = result.categories?.sexual === true;
      if (isSexual) {
        return res.status(403).json({
          error: "Your appeal was flagged for containing sexual content. Please revise and try again."
        });
      }
    } catch (err) {
      console.error("❌ OpenAI moderation error:", err);
      return res.status(500).json({ error: "Failed to moderate content. Please try again later." });
    }

    const [result] = await db.query(
      "INSERT INTO appeals (uuid, username, discord_id, type, message, files, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        user.uuid,
        user.username,
        user.discordId || null,
        type,
        message,
        JSON.stringify(fileLinks),
        new Date()
      ]
    );

    await sendAppealPanel({
      id: result.insertId,
      type,
      username: user.username,
      uuid: user.uuid,
      message,
      files: fileLinks
    });

    res.json({ success: true, appealId: result.insertId });
  }
);

// --- View current user's appeals ---
router.get("/my", requireAuth, async (req, res) => {
  try {
    console.log("👤 Fetching appeals for UUID:", req.user.uuid);
    const [rows] = await db.query(
      "SELECT * FROM appeals WHERE uuid = ? ORDER BY created_at DESC",
      [req.user.uuid]
    );
    console.log("📦 Appeals returned:", rows.length);
    if (rows.length === 0) {
      const [debug] = await db.query("SELECT uuid FROM appeals");
      console.log("📋 All UUIDs in appeals table:", debug.map(r => r.uuid));
    }

    const formatted = rows.map((appeal) => ({
      id: appeal.id,
      type: appeal.type,
      message: appeal.message,
      files: (() => {
        try {
          const parsed = JSON.parse(appeal.files);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return appeal.files ? [appeal.files] : [];
        }
      })(),
      status: appeal.status || "pending",
      verdict_message: appeal.verdict_message || null,
      decided_at: appeal.decided_at || null,
      created_at: appeal.created_at
    }));

    res.json({ appeals: formatted });
  } catch (err) {
    console.error("❌ Failed to fetch appeals:", err);
    res.status(500).json({ error: "Something went wrong fetching appeals." });
  }
});

export default router;
