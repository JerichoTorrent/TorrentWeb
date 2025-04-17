import express from "express";
import db from "../utils/db.js";

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

export default router;