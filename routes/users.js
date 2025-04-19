import express from "express";
import db from "../utils/db.js";
import mysql from "mysql2/promise";

const statsPool = mysql.createPool({
  host: process.env.TORRENTSTATS_DB_HOST,
  user: process.env.TORRENTSTATS_DB_USER,
  password: process.env.TORRENTSTATS_DB_PASS,
  database: process.env.TORRENTSTATS_DB_NAME,
  port: process.env.TORRENTSTATS_DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

const router = express.Router();

router.get("/suggest", async (req, res) => {
  const rawQuery = req.query.q;
  const q = typeof rawQuery === "string" ? rawQuery.replace(/^@/, "") : "";

  if (!q) return res.json([]);

  try {
    const [rows] = await db.query(
      "SELECT username FROM users WHERE username LIKE ? COLLATE utf8mb4_general_ci ORDER BY username ASC LIMIT 10",
      [`${q}%`]
    );

    const suggestions = rows.map((row) => ({
      id: row.username,
      display: row.username,
    }));

    res.json(suggestions);
  } catch (err) {
    console.error("Error fetching username suggestions:", err);
    res.status(500).json([]);
  }
});
router.get("/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT uuid, username, level, total_xp FROM users WHERE username = ?",
      [username]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching user info:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Public profiles
router.get("/public/:username", async (req, res) => {
  const { username } = req.params;
  const requestingUser = req.user?.uuid || null;

  try {
    const [users] = await db.query(
      `SELECT uuid, username, created_at, last_login, reputation FROM users WHERE username = ?`,
      [username]
    );

    if (!users.length) return res.status(404).json({ error: "User not found" });
    const user = users[0];

    if (requestingUser) {
      const [blocked] = await db.query(
        `SELECT 1 FROM user_blocks WHERE blocker_uuid = ? AND blocked_uuid = ?`,
        [requestingUser, user.uuid]
      );
      if (blocked.length) return res.json({ blocked: true });
    }

    const [[{ followers }]] = await db.query(
      `SELECT COUNT(*) AS followers FROM user_follows WHERE followed_uuid = ?`,
      [user.uuid]
    );

    const [[{ threads }]] = await db.query(
      `SELECT COUNT(*) AS threads FROM forum_threads WHERE user_id = ?`,
      [user.uuid]
    );

    const [badges] = await db.query(
      `SELECT b.id, b.label, b.description, b.icon_url, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.uuid = ?
       ORDER BY ub.earned_at ASC`,
      [user.uuid]
    );

    const badgeList = badges.map((b) => ({
      ...b,
      icon_url: `${process.env.FRONTEND_URL || ""}/icons/badges/${b.id}.png`,
    }));

    const [serverRows] = await statsPool.query(
      "SELECT DISTINCT server FROM player_stats WHERE username = ?",
      [user.username]
    );

    const gamemodeStats = [];

    for (const row of serverRows) {
      const server = row.server;
      const [coreStats] = await statsPool.query(
        `SELECT player_kills, deaths, ticks_played, mob_kills, quests_completed,
                dungeons_completed, blocks_mined, balance, ez_shops, ez_profits,
                total_xp_bottled, legendary_fish_caught, largest_fish, plots_owned,
                plots_merged, mcmmo_power_level, animals_bred, aviate_cm, climb_cm,
                fall_cm, jumps, raid_wins, swim_cm, villager_trades, walk_cm,
                items_crafted
         FROM player_stats
         WHERE username = ? AND server = ?
         LIMIT 1`,
        [user.username, server]
      );

      const [jobs] = await statsPool.query(
        `SELECT job_name, level, xp
         FROM player_jobs
         WHERE username = ? AND server = ?`,
        [user.username, server]
      );

      const [skills] = await statsPool.query(
        `SELECT skill_name, level
         FROM player_skills
         WHERE uuid = ? AND server = ?`,
        [user.uuid, server]
      );

      const [teamStats] = await statsPool.query(
        `SELECT team_name, team_level, team_members, team_balance
         FROM player_team_stats
         WHERE username = ? AND server = ?`,
        [user.username, server]
      );

      gamemodeStats.push({
        name: server,
        data: {
          ...coreStats[0],
          jobs,
          skills: Object.fromEntries(skills.map(s => [s.skill_name.toLowerCase(), s.level])),
          team: teamStats[0] || null,
        },
      });
    }

    const response = {
      uuid: user.uuid,
      username: user.username,
      joined: new Date(user.created_at).toLocaleDateString(),
      lastSeen: user.last_login ? new Date(user.last_login).toLocaleString() : "Unknown",
      followers,
      threadCount: threads,
      reputation: user.reputation || 0,
      badges: badgeList,
      stats: gamemodeStats,
    };

    res.json(response);
  } catch (err) {
    console.error("Error loading public profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;