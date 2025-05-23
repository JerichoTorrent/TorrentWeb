import express from "express";
import db from "../utils/db.js";
import mysql from "mysql2/promise";
import authMiddleware from "../middleware/authMiddleware.js";

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
      `SELECT uuid, username, level, total_xp, xp_this_week, chosen_badge, status, about FROM users WHERE username = ?`,
      [username]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];

    const [badges] = await db.query(
      `SELECT b.id, b.label
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.uuid = ?
       ORDER BY ub.earned_at ASC`,
      [user.uuid]
    );

    res.json({
      ...user,
      badge: user.chosen_badge,
      badges,
    });
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
      `SELECT uuid, username, created_at, last_login, reputation, status, about, chosen_badge, coverUrl FROM users WHERE username = ?`,
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
      icon_url: `${process.env.FRONTEND_URL || ""}${b.icon_url}`,
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
                items_crafted, fly_cm
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
      badge: user.chosen_badge || null,
      stats: gamemodeStats,
      status: user.status,
      about: user.about,
      coverUrl: user.coverUrl || null,
    };

    res.json(response);
  } catch (err) {
    console.error("Error loading public profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:uuid/follow", authMiddleware, async (req, res) => {
  const follower = req.user.uuid;
  const followed = req.params.uuid;

  if (follower === followed) return res.status(400).json({ error: "You can't follow yourself." });

  try {
    await db.query(
      "INSERT IGNORE INTO user_follows (follower_uuid, followed_uuid) VALUES (?, ?)",
      [follower, followed]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to follow user." });
  }
});

router.delete("/:uuid/unfollow", authMiddleware, async (req, res) => {
  const follower = req.user.uuid;
  const followed = req.params.uuid;

  try {
    await db.query(
      "DELETE FROM user_follows WHERE follower_uuid = ? AND followed_uuid = ?",
      [follower, followed]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to unfollow user." });
  }
});

router.get("/:uuid/is-following", authMiddleware, async (req, res) => {
  const follower = req.user.uuid;
  const followed = req.params.uuid;

  const [rows] = await db.query(
    "SELECT 1 FROM user_follows WHERE follower_uuid = ? AND followed_uuid = ? LIMIT 1",
    [follower, followed]
  );

  res.json({ following: rows.length > 0 });
});

router.get("/:uuid/following-threads", authMiddleware, async (req, res) => {
  const { uuid } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [threads] = await db.query(
      `SELECT t.* FROM forum_threads t
       JOIN user_follows f ON f.followed_uuid = t.user_id
       WHERE f.follower_uuid = ?
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [uuid, limit, offset]
    );

    const [count] = await db.query(
      `SELECT COUNT(*) AS total
       FROM forum_threads t
       JOIN user_follows f ON f.followed_uuid = t.user_id
       WHERE f.follower_uuid = ?`,
      [uuid]
    );

    res.json({ threads, total: count[0].total });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch threads." });
  }
});

router.get("/:uuid/followers", async (req, res) => {
  const { uuid } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT u.uuid, u.username
       FROM user_follows f
       JOIN users u ON u.uuid = f.follower_uuid
       WHERE f.followed_uuid = ?`,
      [uuid]
    );

    res.json({ followers: rows });
  } catch (err) {
    console.error("Error fetching followers:", err);
    res.status(500).json({ error: "Failed to fetch followers." });
  }
});

router.get("/:uuid/following", async (req, res) => {
  const { uuid } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT u.uuid, u.username
       FROM user_follows f
       JOIN users u ON u.uuid = f.followed_uuid
       WHERE f.follower_uuid = ?`,
      [uuid]
    );

    res.json({ following: rows });
  } catch (err) {
    console.error("Error fetching following:", err);
    res.status(500).json({ error: "Failed to fetch following list." });
  }
});

export default router;