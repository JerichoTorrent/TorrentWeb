import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const statsPool = mysql.createPool({
  host: process.env.TORRENTSTATS_DB_HOST,
  user: process.env.TORRENTSTATS_DB_USER,
  password: process.env.TORRENTSTATS_DB_PASS,
  database: process.env.TORRENTSTATS_DB_NAME,
  port: process.env.TORRENTSTATS_DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

const getRichestPlayer = async () => {
  const [rows] = await statsPool.query(
    `SELECT uuid, username, SUM(balance) AS total_balance
     FROM player_stats
     WHERE server IN (?)
     GROUP BY uuid, username
     ORDER BY total_balance DESC
     LIMIT 1`,
    [process.env.STATS_SERVERS.split(",")]
  );
  return rows[0] || null;
};

const getTopPlayer = async () => {
  const [rows] = await statsPool.query(
    `SELECT uuid, username, SUM(player_kills) AS value
     FROM player_stats
     WHERE server IN (?)
     GROUP BY uuid, username
     ORDER BY value DESC
     LIMIT 1`,
    [process.env.STATS_SERVERS.split(",")]
  );
  return rows[0] || null;
};

router.get("/api/stats/showcase", async (req, res) => {
  try {
    const showcases = [];

    // Manual highlight
    showcases.push({
      name: process.env.BUILDER_OF_THE_MONTH_NAME || "Unknown",
      uuid: process.env.BUILDER_OF_THE_MONTH_UUID || "00000000-0000-0000-0000-000000000000",
      type: "builder",
      description:
        process.env.BUILDER_OF_THE_MONTH_DESC || "No description available.",
    });

    const richest = await getRichestPlayer();
    if (richest) {
      showcases.push({
        name: richest.username,
        uuid: richest.uuid,
        type: "richest",
        description: `The current richest player with $${Number(
          richest.total_balance
        ).toLocaleString()}.`,
      });
    }

    const killer = await getTopPlayer();
    if (killer) {
      showcases.push({
        name: killer.username,
        uuid: killer.uuid,
        type: "killer",
        description: `This player has ${Number(killer.value).toLocaleString()} player kills.`,
      });
    }

    res.json(showcases);
  } catch (err) {
    console.error("Failed to load top showcase players:", err);
    res.status(500).json({ error: "Failed to fetch showcase data." });
  }
});

export default router;
