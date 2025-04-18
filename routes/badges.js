import express from "express";
import db from "../utils/db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Map since some levels earn multiple badges
const levelBadges = {
  5: ["mob"],
  10: ["tinkerer", "experienced", "torrenter"],
  25: ["artorian", "slateborn", "malfeasance", "uncommon"],
  50: ["shadow", "exalted", "cryptid", "rare"],
  75: ["general", "ender_dragon", "admiral", "captain", "royal", "epic"],
  100: ["remnant", "hero", "legend"],
  150: ["ascendant", "mythic"],
  200: ["traxis", "astral"],
  250: ["overpowered"],
  500: ["lord"]
};

// If user doesn't have, give badge
async function grantBadge(uuid, badge_id) {
  const [rows] = await db.query(
    "SELECT 1 FROM user_badges WHERE uuid = ? AND badge_id = ?",
    [uuid, badge_id]
  );
  if (!rows.length) {
    await db.query(
      "INSERT INTO user_badges (uuid, badge_id) VALUES (?, ?)",
      [uuid, badge_id]
    );
  }
}

// POST /api/badges/check-level
router.post("/check-level", authMiddleware, async (req, res) => {
  const { user } = req;

  try {
    const [rows] = await db.query("SELECT level FROM users WHERE uuid = ?", [user.uuid]);
    if (!rows.length) return res.status(404).json({ error: "User not found" });

    const level = rows[0].level;

    for (const threshold of Object.keys(levelBadges)) {
      if (level >= parseInt(threshold)) {
        for (const badge of levelBadges[threshold]) {
          await grantBadge(user.uuid, badge);
        }
      }
    }

    res.json({ message: "Badge check complete." });
  } catch (err) {
    console.error("Badge level check error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/badges/mine
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.id, b.label, b.description, b.icon_url, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.uuid = ?
       ORDER BY ub.earned_at ASC`,
      [req.user.uuid]
    );
    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch user badges:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;