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

export default router;