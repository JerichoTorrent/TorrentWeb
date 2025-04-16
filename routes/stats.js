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

router.get("/api/stats/gamemodes", async (req, res) => {
  try {
    const [rows] = await statsPool.query(
      `SELECT server AS id, COUNT(DISTINCT uuid) AS playerCount
       FROM player_stats
       GROUP BY server`
    );

    const results = rows.map((row) => {
      const id = row.id;
      const name = {
        lifesteal: "Lifesteal",
        survival: "Survival",
        skyfactions: "SkyFactions",
        creative: "Creative",
      }[id] || id.charAt(0).toUpperCase() + id.slice(1);

      return {
        id,
        name,
        playerCount: row.playerCount,
        extraInfo: "",
      };
    });

    res.json(results);
  } catch (err) {
    console.error("Failed to fetch gamemodes:", err);
    res.status(500).json({ error: "Failed to fetch gamemodes." });
  }
});

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

router.get("/api/stats/:server", async (req, res) => {
  const { server } = req.params;
  const category = req.query.category || "main";
  const search = req.query.search || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    let rows = [];
    let total = 0;
    const wildcard = `%${search}%`;

    const baseWhere = `WHERE server = ? AND username LIKE ?`;

    if (category === "main") {
      [rows] = await statsPool.query(
        `SELECT username, player_kills, deaths, ticks_played, mob_kills, animals_bred,
                aviate_cm, climb_cm, fall_cm, fly_cm, swim_cm, walk_cm,
                villager_trades, dungeons_completed, items_crafted, beds_slept,
                quests_completed, total_elytras, mcmmo_power_level, blocks_mined,
                jumps
         FROM player_stats
         ${baseWhere}
         ORDER BY player_kills DESC
         LIMIT ? OFFSET ?`,
        [server, wildcard, limit, offset]
      );

      [[{ total }]] = await statsPool.query(
        `SELECT COUNT(*) as total FROM player_stats ${baseWhere}`,
        [server, wildcard]
      );
    }

    else if (category === "balance") {
      [rows] = await statsPool.query(
        `SELECT username, balance
         FROM player_stats
         ${baseWhere}
         ORDER BY balance DESC
         LIMIT ? OFFSET ?`,
        [server, wildcard, limit, offset]
      );

      [[{ total }]] = await statsPool.query(
        `SELECT COUNT(*) as total FROM player_stats ${baseWhere}`,
        [server, wildcard]
      );
    }

    else if (category === "team") {
      [rows] = await statsPool.query(
        `SELECT username, team_name, team_level, team_members
         FROM player_team_stats
         ${baseWhere}
         ORDER BY team_level DESC
         LIMIT ? OFFSET ?`,
        [server, wildcard, limit, offset]
      );

      [[{ total }]] = await statsPool.query(
        `SELECT COUNT(*) as total FROM player_team_stats ${baseWhere}`,
        [server, wildcard]
      );
    }

    else if (category === "jobs") {
      [rows] = await statsPool.query(
        `SELECT username, job_name, level, xp
         FROM player_jobs
         ${baseWhere}
         ORDER BY level DESC
         LIMIT ? OFFSET ?`,
        [server, wildcard, limit, offset]
      );

      [[{ total }]] = await statsPool.query(
        `SELECT COUNT(DISTINCT CONCAT(uuid, '-', job_name)) AS total
         FROM player_jobs ${baseWhere}`,
        [server, wildcard]
      );
    }

    else if (category === "skills") {
      [rows] = await statsPool.query(
        `SELECT ps.username, ps.uuid,
                MAX(CASE WHEN s.skill_name = 'acrobatics' THEN s.level ELSE 0 END) AS acrobatics,
                MAX(CASE WHEN s.skill_name = 'alchemy' THEN s.level ELSE 0 END) AS alchemy,
                MAX(CASE WHEN s.skill_name = 'archery' THEN s.level ELSE 0 END) AS archery,
                MAX(CASE WHEN s.skill_name = 'axes' THEN s.level ELSE 0 END) AS axes,
                MAX(CASE WHEN s.skill_name = 'crossbows' THEN s.level ELSE 0 END) AS crossbows,
                MAX(CASE WHEN s.skill_name = 'excavation' THEN s.level ELSE 0 END) AS excavation,
                MAX(CASE WHEN s.skill_name = 'fishing' THEN s.level ELSE 0 END) AS fishing,
                MAX(CASE WHEN s.skill_name = 'herbalism' THEN s.level ELSE 0 END) AS herbalism,
                MAX(CASE WHEN s.skill_name = 'mining' THEN s.level ELSE 0 END) AS mining,
                MAX(CASE WHEN s.skill_name = 'repair' THEN s.level ELSE 0 END) AS repair,
                MAX(CASE WHEN s.skill_name = 'salvage' THEN s.level ELSE 0 END) AS salvage,
                MAX(CASE WHEN s.skill_name = 'swords' THEN s.level ELSE 0 END) AS swords,
                MAX(CASE WHEN s.skill_name = 'taming' THEN s.level ELSE 0 END) AS taming,
                MAX(CASE WHEN s.skill_name = 'unarmed' THEN s.level ELSE 0 END) AS unarmed,
                MAX(CASE WHEN s.skill_name = 'woodcutting' THEN s.level ELSE 0 END) AS woodcutting,
                MAX(CASE WHEN s.skill_name = 'maces' THEN s.level ELSE 0 END) AS maces,
                MAX(CASE WHEN s.skill_name = 'tridents' THEN s.level ELSE 0 END) AS tridents,
                SUM(s.level) AS power_level
         FROM player_skills s
         JOIN player_stats ps ON s.uuid = ps.uuid AND s.server = ps.server
         WHERE s.server = ? AND ps.username LIKE ?
         GROUP BY ps.username, ps.uuid
         ORDER BY power_level DESC
         LIMIT ? OFFSET ?`,
        [server, wildcard, limit, offset]
      );
    
      [[{ total }]] = await statsPool.query(
        `SELECT COUNT(DISTINCT s.uuid)
         FROM player_skills s
         JOIN player_stats ps ON s.uuid = ps.uuid AND s.server = ps.server
         WHERE s.server = ? AND ps.username LIKE ?`,
        [server, wildcard]
      );
    }    

    else if (category === "xp") {
      [rows] = await statsPool.query(
        `SELECT username, total_xp_bottled
         FROM player_stats
         ${baseWhere}
         ORDER BY total_xp_bottled DESC
         LIMIT ? OFFSET ?`,
        [server, wildcard, limit, offset]
      );

      [[{ total }]] = await statsPool.query(
        `SELECT COUNT(*) as total FROM player_stats ${baseWhere}`,
        [server, wildcard]
      );
    }

    else if (category === "shops") {
      [rows] = await statsPool.query(
        `SELECT username, ez_shops AS shops_owned, ez_profits AS total_profits
         FROM player_stats
         ${baseWhere}
         ORDER BY total_profits DESC
         LIMIT ? OFFSET ?`,
        [server, wildcard, limit, offset]
      );

      [[{ total }]] = await statsPool.query(
        `SELECT COUNT(*) as total FROM player_stats ${baseWhere}`,
        [server, wildcard]
      );
    }

    else if (category === "fish") {
      [rows] = await statsPool.query(
        `SELECT username, legendary_fish_caught, largest_fish
         FROM player_stats
         ${baseWhere}
         ORDER BY legendary_fish_caught DESC
         LIMIT ? OFFSET ?`,
        [server, wildcard, limit, offset]
      );

      [[{ total }]] = await statsPool.query(
        `SELECT COUNT(*) as total FROM player_stats ${baseWhere}`,
        [server, wildcard]
      );
    }

    else if (category === "plots") {
      [rows] = await statsPool.query(
        `SELECT username, plots_owned, plots_merged
         FROM player_stats
         ${baseWhere}
         ORDER BY plots_owned DESC
         LIMIT ? OFFSET ?`,
        [server, wildcard, limit, offset]
      );

      [[{ total }]] = await statsPool.query(
        `SELECT COUNT(*) as total FROM player_stats ${baseWhere}`,
        [server, wildcard]
      );
    }

    else {
      return res.status(400).json({ error: "Invalid category" });
    }

    res.json({
      results: rows,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error(`Error fetching stats for ${server} [${category}]:`, err);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

export default router;
