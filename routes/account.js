import express from "express";
import multer from "multer";
import sharp from "sharp";
import forumUpload from "./forumUpload.js";
import { filterBadWords } from "../utils/filterBadWords.js";
import db from "../utils/db.js";
import authenticate from "../middleware/authMiddleware.js";
import fs from "fs";
import path from "path";

const router = express.Router();
const moderateImage = forumUpload;

const upload = multer({
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/png"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG and PNG files are allowed"));
    }
  },
});

router.patch("/profile-settings", authenticate, upload.single("cover"), async (req, res) => {
  const { about, status, chosen_badge } = req.body;
  const userUUID = req.user.uuid;

  const filteredAbout = filterBadWords(about || "").slice(0, 1500);
  const trimmedStatus = (status || "").trim().slice(0, 100);

  let coverUrl = null;

  try {
    if (req.file) {
      const webpPath = `/uploads/covers/${req.user.uuid}.webp`;
      const fullOutputPath = path.join(__dirname, "../public", webpPath);

      const buffer = await sharp(req.file.buffer)
        .resize({ width: 1920 })
        .webp()
        .toBuffer();

      const passedModeration = await moderateImage(buffer);
      if (!passedModeration) {
        return res.status(400).json({ error: "Image failed moderation." });
      }

      fs.writeFileSync(fullOutputPath, buffer);
      coverUrl = webpPath;
    }

    await db.query(
      `UPDATE users SET about = ?, status = ?, chosen_badge = ?, coverUrl = COALESCE(?, coverUrl) WHERE uuid = ?`,
      [filteredAbout, trimmedStatus, chosen_badge, coverUrl, userUUID]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Server error." });
  }
});

export default router;