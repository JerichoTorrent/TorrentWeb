import db from "../utils/db.js";
import fetch from "node-fetch"; // If needed for remote deletions (e.g., R2)
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const deleteLocalFile = (url) => {
  const filename = url.split("/").pop();
  const filePath = path.resolve("uploads/forum_images", filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🗑️ Deleted ${filePath}`);
  } else {
    console.log(`⚠️ File not found: ${filePath}`);
  }
};

const runCleanup = async () => {
  try {
    const [rows] = await db.query(
      `SELECT id, image_url FROM forum_uploads
       WHERE thread_id IS NULL
         AND last_accessed < NOW() - INTERVAL 45 MINUTE`
    );

    if (rows.length === 0) {
      console.log("✅ No orphaned uploads to delete.");
      return;
    }

    for (const row of rows) {
      deleteLocalFile(row.image_url); // 🔁 If using Cloudflare R2, replace this with API deletion
      await db.query("DELETE FROM forum_uploads WHERE id = ?", [row.id]);
    }

    console.log(`✅ Cleaned up ${rows.length} orphaned images.`);
  } catch (err) {
    console.error("❌ Cleanup error:", err);
  }
};

export default runCleanup;