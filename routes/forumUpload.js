import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { dirname } from "path";
import jwt from "jsonwebtoken";
import db from "../utils/db.js";
import { jwtDecode } from "jwt-decode";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, "../uploads/forum_images");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, [".png", ".jpg", ".jpeg"].includes(ext));
  },
});

// Middleware to validate tokens
router.use("/api/forums/upload-image", (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const uploadToken = req.headers["x-upload-token"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid auth token" });
  }

  if (!uploadToken || typeof uploadToken !== "string" || uploadToken.length < 10) {
    return res.status(403).json({ error: "Missing or invalid upload token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET); // just verifies it's a real user
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
});

// Static route to serve uploaded images
router.use("/uploads/forum_images", express.static(UPLOAD_DIR));

// Upload endpoint
router.post("/api/forums/upload-image", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded." });

  const fileUrl = `${process.env.BACKEND_URL}/uploads/forum_images/${req.file.filename}`;

  try {
    const modRes = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ input: fileUrl }),
    });

    const result = await modRes.json();
    const categories = result?.results?.[0]?.categories;

    if (categories?.sexual || categories?.violence || categories?.["violence/graphic"]) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Image failed moderation check." });
    }

    const authToken = req.headers["authorization"]?.split(" ")[1];
    const decoded = jwtDecode(authToken);
    const userId = decoded.uuid;

    await db.query(
      `INSERT INTO forum_uploads (user_id, image_url, upload_time, last_accessed),
      VALUES (?, ?, NOW(), NOW())`,
      [userId, fileUrl]
    );

    return res.json({ url: fileUrl });
  } catch (err) {
    console.error("Moderation error:", err);
    fs.unlinkSync(req.file.path);
    return res.status(500).json({ error: "Image moderation failed." });
  }
});

// Ping route for checking activity of user upload process
router.post("/api/forums/uploads/ping", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const uuid = decoded.uuid;

    await db.query(
      `UPDATE forum_uploads
       SET last_accessed = NOW()
       WHERE user_id = ? AND thread_id IS NULL`,
      [uuid]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("Ping error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
});

export default router;
