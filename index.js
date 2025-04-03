import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import randomstring from "randomstring";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import rateLimiter from "./utils/rateLimiter.js";
import discordRoutes from "./bot.js";
import forumRoutes from "./routes/forum.js";

import db from "./utils/db.js"; // ✅ shared DB pool
import blogRoutes from "./routes/blog.js";
import bansRoutes from "./routes/bans.js";
import appealsRoutes from "./routes/appeals.js";
import authenticateToken from "./middleware/authMiddleware.js";
import "./bot.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1); // ✅ Trust Cloudflare's IP forwarding
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL;

// ✅ ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Static frontend path
const FRONTEND_BUILD_PATH = path.join(__dirname, "frontend", "dist");

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use("/api/blog", blogRoutes);
app.use("/api/bans", bansRoutes);
app.use("/api/appeals", appealsRoutes);
app.use("/api", discordRoutes);
app.use("/api/forums", forumRoutes);
app.use(express.static(FRONTEND_BUILD_PATH));

// ✅ Verify DB Connection
db.getConnection()
  .then(() => console.log("✅ Connected to MySQL Database"))
  .catch((err) => {
    console.error("❌ MySQL Connection Error:", err);
    process.exit(1);
  });

// ✅ Config
const {
  JWT_SECRET,
  FRONTEND_URL,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_SENDAS,
  EMAIL_HOST = "smtp-relay.brevo.com",
  EMAIL_PORT = 587,
} = process.env;

if (!JWT_SECRET || !EMAIL_USER || !EMAIL_PASS || !EMAIL_SENDAS || !FRONTEND_URL) {
  console.error("❌ Missing environment variables in .env");
  process.exit(1);
}

// ✅ Mailer
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT),
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// ✅ UUID dash utility
function insertUuidDashes(uuid) {
  if (!uuid || uuid.length !== 32) return uuid;
  return uuid.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
}

// ✅ Mojang UUID Fetcher
async function getMinecraftUUID(username) {
  const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
  if (!response.ok) return null;
  const data = await response.json();
  return insertUuidDashes(data.id);
}

// ✅ API Status Check
app.get("/api/status", (req, res) => {
  res.json({ message: "Torrent Network API is running!" });
});

// 🔹 Uptime / Metrics Ping
app.get("/api/metrics", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
    backend: process.env.BACKEND_URL,
    frontend: process.env.FRONTEND_URL,
  });
});

const router = express.Router();

// 🔹 Register
router.post("/auth/request-verification", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "All fields are required." });

  try {
    const [existing] = await db.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );
    if (existing.length)
      return res.status(400).json({ error: "User already exists." });

    const uuid = await getMinecraftUUID(username);
    if (!uuid) return res.status(404).json({ error: "Invalid Minecraft username." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = randomstring.generate(32);

    await db.query(
      "INSERT INTO users (uuid, username, email, password_hash, verification_token, email_verified) VALUES (?, ?, ?, ?, ?, 0)",
      [uuid, username, email, hashedPassword, token]
    );

    const verificationLink = `${BACKEND_URL}/auth/verify-email?token=${token}`;

    await transporter.sendMail({
      from: EMAIL_SENDAS,
      to: email,
      subject: "Verify Your Email - Torrent Network",
      text: `Click to verify: ${verificationLink}`,
    });

    res.json({ message: "Verification email sent!" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// 🔹 Resend Verification
router.post("/auth/resend-verification", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!user.length) return res.status(404).json({ error: "User not found." });

    const player = user[0];
    if (player.email_verified)
      return res.status(400).json({ error: "Email already verified." });

    const newToken = randomstring.generate(32);
    await db.query("UPDATE users SET verification_token = ? WHERE email = ?", [newToken, email]);

    const verificationLink = `${BACKEND_URL}/auth/verify-email?token=${newToken}`;

    await transporter.sendMail({
      from: EMAIL_SENDAS,
      to: email,
      subject: "Resend Verification - Torrent Network",
      text: `Click to verify your email: ${verificationLink}`,
    });

    res.json({ message: "Verification email resent!" });
  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// 🔹 Verify Email
router.get("/auth/verify-email", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "Missing token." });

  try {
    const [user] = await db.query("SELECT * FROM users WHERE verification_token = ?", [token]);
    if (!user.length) return res.status(404).json({ error: "Invalid or expired token." });

    const player = user[0];
    await db.query("UPDATE users SET email_verified = 1, verification_token = NULL WHERE uuid = ?", [player.uuid]);

    const jwtToken = jwt.sign(
      {
        uuid: insertUuidDashes(player.uuid),
        username: player.username,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.redirect(`${FRONTEND_URL}/verify-success?token=${jwtToken}`);
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// 🔹 Login with rate limiter
router.post("/auth/login", rateLimiter(1, 5, "Too many login attempts. Try again soon."), async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing credentials." });

  try {
    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (!users.length)
      return res.status(401).json({ error: "Invalid username or password." });

    const user = users[0];
    if (!user.email_verified)
      return res.status(403).json({ error: "Email not verified." });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ error: "Invalid username or password." });

    const token = jwt.sign(
      {
        uuid: insertUuidDashes(user.uuid),
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    await db.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE uuid = ?", [user.uuid]);

    res.json({
      message: "Login successful!",
      token,
      user: {
        username: user.username,
        uuid: insertUuidDashes(user.uuid),
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// 🔹 Forgot Password
router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!users.length) return res.status(404).json({ error: "User not found." });

    const user = users[0];
    const resetToken = randomstring.generate(32);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await db.query(
      "UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?",
      [resetToken, expiresAt, email]
    );

    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: EMAIL_SENDAS,
      to: email,
      subject: "Reset Your Password - Torrent Network",
      text: `Click the link below to reset your password:\n\n${resetLink}`,
    });

    res.json({ message: "Reset email sent!" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// 🔹 Reset Password
router.post("/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword)
    return res.status(400).json({ error: "Missing token or password." });

  try {
    const [users] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_expires > NOW()",
      [token]
    );
    if (!users.length)
      return res.status(400).json({ error: "Invalid or expired token." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE uuid = ?",
      [hashedPassword, users[0].uuid]
    );

    res.json({ message: "Password reset successful!" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// 🔐 Protected Route
router.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: `Welcome, ${req.user.username}!`, user: req.user });
});

app.use(router);

// 🔹 Root API
app.get("/api", (req, res) => {
  res.json({ message: "Torrent Network API is running!" });
});

// ✅ Production fallback for React routes
app.get("*", (req, res) => {
  res.sendFile(path.join(FRONTEND_BUILD_PATH, "index.html"));
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

export default db;