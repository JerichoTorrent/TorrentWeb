const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
require("dotenv").config();

function insertUuidDashes(uuid) {
  if (!uuid || uuid.length !== 32) return uuid;
  return uuid.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
}

module.exports = async function authenticateToken(req, res, next) {
  let token = null;

  // Check Authorization header
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Fallback: check ?token query (for Discord popup)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    if (verified.uuid && verified.uuid.length === 32) {
      verified.uuid = insertUuidDashes(verified.uuid);
    }

    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    // ✅ Fetch is_staff field too
    const [rows] = await conn.execute(
      "SELECT username, discord_id, is_staff FROM users WHERE uuid = ?",
      [verified.uuid]
    );

    await conn.end();

    if (rows.length === 0) {
      return res.status(401).json({ error: "User not found." });
    }

    req.user = {
      uuid: verified.uuid,
      username: rows[0].username,
      discordId: rows[0].discord_id,
      is_staff: rows[0].is_staff === 1 // Convert to boolean
    };

    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    res.status(403).json({ error: "Invalid or expired token." });
  }
};
