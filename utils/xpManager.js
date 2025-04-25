import db from "./db.js";
import fetch from "node-fetch";

const XP_WEIGHTS = {
  thread: 25,
  reply: 10,
  edit: 5,
  reaction_received: 3,
  post_reaction: 2,
};

function getRepWeight(reputation) {
  if (reputation > 0) return 1.25;
  if (reputation < 0) return 0.75;
  return 1.0;
}

function calculateLevel(xp) {
  return Math.floor(0.1 * Math.sqrt(xp));
}

export async function awardXp(db, userId, baseType) {
  const baseXp = XP_WEIGHTS[baseType];
  if (!baseXp) {
    console.warn(`Invalid XP type "${baseType}"`);
    return;
  }

  const [rows] = await db.query(
    "SELECT total_xp, level, xp_this_week, reputation FROM users WHERE uuid = ?",
    [userId]
  );
  if (!rows.length) return;

  const { total_xp = 0, level: currentLevel = 0, xp_this_week = 0, reputation = 0 } = rows[0];

  const weight = getRepWeight(reputation);
  const weightedXp = Math.round(baseXp * weight);
  const newTotalXp = total_xp + weightedXp;
  const newLevel = calculateLevel(newTotalXp);
  const newXpThisWeek = xp_this_week + weightedXp;

  if (newLevel > currentLevel) {
    console.log(`🎉 User ${userId} leveled up! ${currentLevel} → ${newLevel}`);
  }

  await db.query(
    "UPDATE users SET total_xp = ?, level = ?, last_xp_gain = NOW(), xp_this_week = ? WHERE uuid = ?",
    [newTotalXp, newLevel, newXpThisWeek, userId]
  );

  await fetch(`${process.env.BACKEND_URL}/api/badges/check-level`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer system:${userId}`
    }
  });
}
