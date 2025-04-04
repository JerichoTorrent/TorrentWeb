import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { dirname } from "path";

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

    return res.json({ url: fileUrl });
  } catch (err) {
    console.error("Moderation error:", err);
    fs.unlinkSync(req.file.path);
    return res.status(500).json({ error: "Image moderation failed." });
  }
});

export default router;
