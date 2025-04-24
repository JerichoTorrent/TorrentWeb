import cron from "node-cron";
import runCleanup from "./deleteUnlinkedImages.js";
import generateSitemap from "./generate-sitemap.js";

cron.schedule("*/15 * * * *", () => {
  console.log("⏰ Running forum image cleanup...");
  runCleanup();
});

cron.schedule("0 3 * * *", async () => {
  console.log("🗺️ Generating daily sitemap...");
  try {
    await generateSitemap();
  } catch (err) {
    console.error("❌ Sitemap generation failed:", err);
  }
});