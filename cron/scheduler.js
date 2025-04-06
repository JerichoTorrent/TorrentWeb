import cron from "node-cron";
import runCleanup from "./deleteUnlinkedImages.js";

cron.schedule("*/15 * * * *", () => {
  console.log("⏰ Running forum image cleanup...");
  runCleanup();
});
