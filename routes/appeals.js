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

router.use("/check-eligibility", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("Content-Type", "application/json");
  next();
});

router.get("/check-eligibility", requireAuth, async (req, res) => {
  const { type } = req.query;
  const user = req.user;

  console.log("✅ [Appeals] Checking eligibility for:", type, "User:", user?.uuid, "Discord ID:", user.discordId);

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
      const secondsRemaining = Math.max(
        0,
        2592000 - Math.floor((now.getTime() - last.getTime()) / 1000)
      );
      return res.status(200).json({ eligible: false, cooldown: secondsRemaining });
    }

    const hasActivePunishment = await checkActivePunishment(user.uuid, user.username, type, user.discordId);
    return res.status(200).json({ eligible: hasActivePunishment });
  } catch (err) {
    console.error("❌ [Appeals] Eligibility check failed:", err);
    return res.status(500).json({ error: "Failed to check eligibility." });
  }
});

// --- Active punishment checker ---
async function checkActivePunishment(uuid, username, type, discordId = null) {
  console.log("🔍 Checking active punishment for UUID:", uuid, "Type:", type, "Discord ID:", discordId);

  if (type === "discord") {
    if (!discordId) {
      console.warn("⚠ No Discord ID provided.");
      return false;
    }

    try {
      const result = await checkDiscordPunishment(discordId);
      console.log("✅ Discord punishment result:", result);
      return result?.active === true;
    } catch (err) {
      console.error("❌ Discord punishment check error:", err);
      return false;
    }
  }

  const table = type === "minecraft-ban" ? "litebans_bans" : "litebans_mutes";

  try {
    const [uuidRows] = await litebans.query(
      `SELECT 1 FROM ${table} WHERE uuid = ? AND active = 1 LIMIT 1`,
      [uuid]
    );

    if (uuidRows.length > 0) {
      console.log("✅ Active punishment found via UUID");
      return true;
    }

    const [history] = await litebans.query(
      `SELECT name FROM litebans_history WHERE uuid = ? ORDER BY date DESC LIMIT 1`,
      [uuid]
    );

    const name = history[0]?.name;
    if (!name) {
      console.warn("⚠ No player name found in history for UUID:", uuid);
      return false;
    }

    const [offlineRows] = await litebans.query(
      `SELECT 1 FROM ${table} WHERE uuid = '#offline#' AND active = 1 LIMIT 1`,
    );

    if (offlineRows.length > 0) {
      console.log("✅ Active punishment found via fallback (#offline#)");
      return true;
    }

    console.log("❌ No active punishment found.");
    return false;
  } catch (err) {
    console.error(`❌ Failed to query ${table}:`, err);
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

    const moderation = await openai.moderations.create({
      model: "text-moderation-latest",
      input: message
    });

    if (moderation.results[0]?.flagged) {
      return res.status(403).json({ error: "Appeal message flagged by moderation." });
    }

    const fileLinks = [];
    if (req.files.length > 5) {
      return res.status(400).json({ error: "You can only upload up to 5 files." });
    }

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

      try {
        await scanBufferWithClamAV(file.buffer, file.originalname);
      } catch (err) {
        console.error("❌ Virus scan failed:", err.message);
        return res.status(400).json({ error: `File "${file.originalname}" failed virus scan.` });
      }

      const inputText = file.mimetype.includes("document")
        ? await extractTextFromDocx(file.buffer)
        : file.buffer.toString("base64");

      const modResult = await openai.moderations.create({
        model: "text-moderation-latest",
        input: inputText
      });

      if (modResult.results[0]?.flagged) {
        return res.status(403).json({ error: `File "${file.originalname}" was flagged by moderation.` });
      }

      const fileUrl = await R2Upload(file);
      fileLinks.push(fileUrl);
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

// --- Get current user's appeals ---
router.get("/my", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM appeals WHERE uuid = ? ORDER BY created_at DESC",
      [req.user.uuid]
    );

    const formatted = rows.map((appeal) => ({
      id: appeal.id,
      type: appeal.type,
      message: appeal.message,
      files: appeal.files ? JSON.parse(appeal.files) : [],
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
