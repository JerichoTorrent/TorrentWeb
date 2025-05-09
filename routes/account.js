import express from "express";
import multer from "multer";
import sharp from "sharp";
import { filterBadWords } from "../utils/filterBadWords.js";
import db from "../utils/db.js";
import authenticate from "../middleware/authMiddleware.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import moderateImage from "../utils/moderateImage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

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
  console.log("✅ Request from account settings");
  const { about, status, chosen_badge } = req.body;
  const userUUID = req.user.uuid;

  const filteredAbout = filterBadWords(about || "").slice(0, 1500);
  const trimmedStatus = (status || "").trim().slice(0, 100);

  let coverUrl = null;

  try {
    if (req.file && req.file.buffer) {
      const webpPath = `/covers/${req.user.uuid}.webp`;
      const fullOutputPath = path.join(__dirname, "../frontend/public", webpPath);
      fs.mkdirSync(path.dirname(fullOutputPath), { recursive: true });

      let buffer;
      try {
        buffer = await sharp(req.file.buffer)
          .resize({
            width: 1920,
            withoutEnlargement: true,
            fit: "cover",
          })
          .toFormat("webp")
          .toBuffer();
      } catch (err) {
        console.error("❌ Sharp failed:", err);
        return res.status(400).json({ error: "Invalid image file." });
      }

      const passedModeration = await moderateImage(buffer);
      if (!passedModeration) {
        return res.status(400).json({ error: "Image failed moderation." });
      }

      try {
        fs.writeFileSync(fullOutputPath, buffer);
        console.log("✅ File saved");
        coverUrl = webpPath;
      } catch (err) {
        console.error("❌ Failed to write file:", err);
        return res.status(500).json({ error: "Failed to save image." });
      }
    }

    await db.query(
      `UPDATE users SET about = ?, status = ?, chosen_badge = ?, coverUrl = COALESCE(?, coverUrl) WHERE uuid = ?`,
      [filteredAbout, trimmedStatus, chosen_badge, coverUrl, userUUID]
    );

    res.json({ success: true, coverUrl });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Server error." });
  }
});

export default router;