import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fetch from "node-fetch";
import requireAuth from "../middleware/authMiddleware.js";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname });
const router = express.Router();

const pool = mysql.createPool({
  host: process.env.LITEBANS_DB_HOST,
  user: process.env.LITEBANS_DB_USER,
  password: process.env.LITEBANS_DB_PASS,
  database: process.env.LITEBANS_DB_NAME,
  port: process.env.LITEBANS_DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

function stripColorCodes(text) {
  return text.replace(/§[0-9A-FK-OR]/gi, "").replace(/#[0-9A-Fa-f]{6}/g, "");
}

async function resolveNameFromHistory(uuid) {
  try {
    const [rows] = await pool.query(
      `SELECT name FROM litebans_history WHERE uuid = ? ORDER BY date DESC LIMIT 1`,
      [uuid]
    );
    return rows[0]?.name || uuid;
  } catch {
    return uuid;
  }
}

// GET /api/bans/list
router.get("/list", async (req, res) => {
  const type = req.query.type || "ban";
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const offset = (page - 1) * limit;
  const search = req.query.search;

  if (!["ban", "mute", "kick"].includes(type)) {
    return res.status(400).json({ error: "Invalid punishment type." });
  }

  try {
    const table = `litebans_${type}s`;
    let query = `
      SELECT p.uuid, p.reason, p.banned_by_name, p.time, p.until, p.active
      FROM ${table} p
      LEFT JOIN litebans_history h ON p.uuid = h.uuid
    `;
    const params = [];

    if (search) {
      query += " WHERE h.name LIKE ?";
      params.push(`%${search}%`);
    }

    query += " GROUP BY p.id ORDER BY p.time DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const now = Date.now();

    const data = await Promise.all(
      rows.map(async (row) => {
        const name = await resolveNameFromHistory(row.uuid);
        const active = Buffer.isBuffer(row.active) ? row.active[0] : Number(row.active);
        const until = row.until;
        const untilMs = until === 0 ? null : new Date(until).getTime();
        const isPermanent = until === 0;
        const isActive = active === 1 && (isPermanent || (untilMs && untilMs > now));
        const timeMs = new Date(row.time).getTime();

        return {
          uuid: row.uuid,
          name,
          reason: stripColorCodes(row.reason),
          staff: row.banned_by_name,
          date: timeMs,
          expires: isPermanent ? null : untilMs,
          active: isActive,
        };
      })
    );

    const [[{ count }]] = await pool.query(
      `SELECT COUNT(DISTINCT p.id) as count FROM ${table} p LEFT JOIN litebans_history h ON p.uuid = h.uuid ${
        search ? "WHERE h.name LIKE ?" : ""
      }`,
      search ? [`%${search}%`] : []
    );

    res.json({
      type,
      page,
      totalPages: Math.ceil(count / limit),
      total: count,
      data,
    });
  } catch (err) {
    console.error("❌ Punishment fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/bans/history/:uuid
router.get("/history/:uuid", async (req, res) => {
  const uuid = req.params.uuid;
  try {
    const types = ["bans", "mutes", "kicks"];
    const results = {};

    for (const type of types) {
      const [rows] = await pool.query(
        `SELECT reason, banned_by_name, time, until, active FROM litebans_${type} WHERE uuid = ? ORDER BY time DESC`,
        [uuid]
      );

      const parsed = rows.map((row) => {
        const active = Buffer.isBuffer(row.active) ? row.active[0] : Number(row.active);
        const untilMs = row.until === 0 ? null : new Date(row.until).getTime();
        const isActive = active === 1 && (row.until === 0 || untilMs > Date.now());
        return {
          reason: stripColorCodes(row.reason),
          staff: row.banned_by_name,
          date: new Date(row.time).getTime(),
          expires: row.until === 0 ? null : untilMs,
          active: isActive,
        };
      });

      results[type] = parsed;
    }

    const [names] = await pool.query(
      "SELECT name FROM litebans_history WHERE uuid = ? ORDER BY date DESC LIMIT 1",
      [uuid]
    );

    res.json({ uuid, name: names[0]?.name || uuid, history: results });
  } catch (err) {
    console.error("❌ History fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/bans/counts
router.get("/counts", async (req, res) => {
  try {
    const [[{ count: bans }]] = await pool.query("SELECT COUNT(*) as count FROM litebans_bans");
    const [[{ count: mutes }]] = await pool.query("SELECT COUNT(*) as count FROM litebans_mutes");
    const [[{ count: kicks }]] = await pool.query("SELECT COUNT(*) as count FROM litebans_kicks");

    res.json({ bans, mutes, kicks });
  } catch (err) {
    console.error("❌ Count fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Discord link status check
router.get("/api/discord/check-link", requireAuth, async (req, res) => {
  try {
    const linked = !!req.user?.discordId;

    res
      .status(200)
      .set("Cache-Control", "no-store, no-cache, must-revalidate")
      .set("Pragma", "no-cache")
      .set("Expires", "0")
      .set("Content-Type", "application/json")
      .json({ linked });
  } catch (err) {
    console.error("❌ Discord check error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
