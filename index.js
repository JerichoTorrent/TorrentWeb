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
import forumActionsRoutes from "./routes/forumActions.js";
import forumUploadRoutes from './routes/forumUpload.js';
import usersRoutes from "./routes/users.js";
import usersRouter from "./routes/users.js";
import statsRoutes from "./routes/stats.js";
import twofaRoutes from "./routes/2fa.js";
import session from "express-session";
import badgeRoutes from "./routes/badges.js";
import db from "./utils/db.js";
import blogRoutes from "./routes/blog.js";
import bansRoutes from "./routes/bans.js";
import appealsRoutes from "./routes/appeals.js";
import authenticateToken from "./middleware/authMiddleware.js";
import "./cron/scheduler.js";
import accountRoutes from "./routes/account.js";
import { OpenAI } from "openai";
import redis from "./utils/redisClient.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1); // Trust Cloudflare's IP forwarding
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL;

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static frontend path
const FRONTEND_BUILD_PATH = path.join(__dirname, "frontend", "dist");

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ["Authorization"],
  allowedHeaders: ["Authorization", "Content-Type"]
}));
app.use(express.json());
app.use("/api/blog", blogRoutes);
app.use("/api/bans", bansRoutes);
app.use("/api/appeals", appealsRoutes);
app.use("/api", discordRoutes);
app.use("/api/forums", forumRoutes);
app.use("/api/forums", forumActionsRoutes);
app.use("/api", forumUploadRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/covers", express.static(path.join(__dirname, "frontend/public/covers")));
app.use("/api/users", usersRoutes);
app.use("/api/stats", statsRoutes);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "changeme-torrent-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // true if behind HTTPS/Cloudflare in production
      httpOnly: true,
      maxAge: 1000 * 60 * 10, // 10 minutes for 2FA setup
    },
  })
);
app.use("/api/2fa", twofaRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/users", accountRoutes);
app.use("/api/users", usersRouter);

// Verify DB Connection
db.getConnection()
  .then(() => console.log("✅ Connected to MySQL Database"))
  .catch((err) => {
    console.error("❌ MySQL Connection Error:", err);
    process.exit(1);
  });

// Config
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

// Mailer
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT),
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// UUID dash utility
function insertUuidDashes(uuid) {
  if (!uuid || uuid.length !== 32) return uuid;
  return uuid.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
}

// Mojang UUID Fetcher
async function getMinecraftUUID(username) {
  if (!username) return null;

  if (username.startsWith(".")) {
    // Bedrock player detected
    const gamertag = username.substring(1); // Strip the dot
    try {
      const response = await fetch(`https://api.geysermc.org/v2/xbox/xuid/${encodeURIComponent(gamertag)}`);
      if (!response.ok) {
        console.error("Failed to fetch Bedrock XUID from Geyser API");
        return null;
      }
      const data = await response.json();
      if (!data?.xuid) {
        console.error("No XUID found for Bedrock gamertag.");
        return null;
      }

      // Make the XUID into a UUID format by padding to 32 chars if needed
      let xuid = data.xuid.toString();
      if (xuid.length < 32) {
        xuid = xuid.padStart(32, "0");
      }

      return insertUuidDashes(xuid);
    } catch (err) {
      console.error("Error fetching Bedrock XUID:", err);
      return null;
    }
  } else {
    // Java Edition player
    try {
      const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
      if (!response.ok) {
        console.error("Failed to fetch Java UUID from Mojang API");
        return null;
      }
      const data = await response.json();
      if (!data?.id) {
        console.error("No UUID found for Java username.");
        return null;
      }
      return insertUuidDashes(data.id);
    } catch (err) {
      console.error("Error fetching Java UUID:", err);
      return null;
    }
  }
}

// API Status Check
app.get("/api/status", (req, res) => {
  res.json({ message: "Torrent Network API is running!" });
});

// Uptime / Metrics Ping for UptimeKuma, HetrixTools, etc
app.get("/api/metrics", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
    backend: process.env.BACKEND_URL,
    frontend: process.env.FRONTEND_URL,
  });
});

app.get("/auth/verify-email", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect(`${FRONTEND_URL}/verify-error`);

  try {
    console.log("🔑 Incoming verification token:", token);

    const [user] = await db.query("SELECT * FROM users WHERE verification_token = ?", [token]);
    if (!user.length) {
      console.warn("❌ No user found for token:", token);
      return res.redirect(`${FRONTEND_URL}/verify-error`);
    }

    const player = user[0];
    console.log("✅ Found user:", player.username);

    if (player.email_verified) {
      console.log("ℹ️ Already verified:", player.username);
      return res.redirect(`${FRONTEND_URL}/verify-success?token=already`);
    }

    const updateRes = await db.query(
      "UPDATE users SET email_verified = 1, verification_token = NULL WHERE uuid = ?",
      [player.uuid]
    );

    console.log("✅ Marked as verified:", player.username);

    const jwtToken = jwt.sign(
      {
        uuid: insertUuidDashes(player.uuid),
        username: player.username,
        is_staff: player.is_staff === 1,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("🎫 Issued JWT:", jwtToken);

    return res.redirect(`${FRONTEND_URL}/verify-success?token=${encodeURIComponent(jwtToken)}`);
  } catch (err) {
    console.error("💥 Verification error:", err);
    return res.redirect(`${FRONTEND_URL}/verify-error`);
  }
});

const router = express.Router();

// Register
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

    await db.query(
      `INSERT INTO user_badges (uuid, badge_id, earned_at) VALUES (?, 'crafter', NOW())`,
      [uuid]
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

// Resend Verification
router.post("/auth/resend-verification", async (req, res) => {
  const { email, username } = req.body;

  let targetEmail = email;

  if (!targetEmail && username) {
    const [users] = await db.query("SELECT email FROM users WHERE username = ?", [username]);
    if (!users.length) return res.status(404).json({ error: "User not found." });
    targetEmail = users[0].email;
  }

  if (!targetEmail) return res.status(400).json({ error: "Email or username is required." });

  const [user] = await db.query("SELECT * FROM users WHERE email = ?", [targetEmail]);
  if (!user.length) return res.status(404).json({ error: "User not found." });

  const player = user[0];
  if (player.email_verified)
    return res.status(400).json({ error: "Email already verified." });

  const newToken = randomstring.generate(32);
  await db.query("UPDATE users SET verification_token = ? WHERE email = ?", [newToken, targetEmail]);

  const verificationLink = `${BACKEND_URL}/auth/verify-email?token=${newToken}`;

  await transporter.sendMail({
    from: EMAIL_SENDAS,
    to: targetEmail,
    subject: "Resend Verification - Torrent Network",
    text: `Click to verify your email: ${verificationLink}`,
  });

  res.json({ message: "Verification email resent!" });
});

// Login with rate limiter
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

    if (user.twofa_enabled) {
      // Send partial login response — frontend will request 2FA code
      return res.status(200).json({
        twofaRequired: true,
        method: user.twofa_method,
        uuid: insertUuidDashes(user.uuid),
        username: user.username,
      });
    }

    const token = jwt.sign(
      {
        uuid: insertUuidDashes(user.uuid),
        username: user.username,
        is_staff: user.is_staff === 1,
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
        is_staff: user.is_staff === 1,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

router.post("/auth/2fa/verify-login", async (req, res) => {
  const { uuid, token } = req.body;
  if (!uuid || !token)
    return res.status(400).json({ error: "Missing credentials." });

  try {
    const [users] = await db.query("SELECT * FROM users WHERE uuid = ?", [uuid]);
    if (!users.length || !users[0].twofa_enabled)
      return res.status(401).json({ error: "2FA not enabled or user not found." });

    const user = users[0];

    if (user.twofa_method === "totp") {
      const speakeasy = await import("speakeasy");
      const verified = speakeasy.totp.verify({
        secret: user.twofa_secret,
        encoding: "base32",
        token,
        window: 1,
      });

      if (!verified) return res.status(401).json({ error: "Invalid code." });
    }

    // TO DO: Add email verification logic :)

    const jwtToken = jwt.sign(
      {
        uuid: insertUuidDashes(user.uuid),
        username: user.username,
        is_staff: user.is_staff === 1,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    await db.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE uuid = ?", [user.uuid]);

    res.json({
      message: "2FA login successful",
      token: jwtToken,
      user: {
        username: user.username,
        uuid: insertUuidDashes(user.uuid),
        is_staff: user.is_staff === 1,
      },
    });
  } catch (err) {
    console.error("2FA Login error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// Forgot Password
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

// Reset Password
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

// Protected Route
router.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: `Welcome, ${req.user.username}!`, user: req.user });
});

router.post(
  "/ask",
  rateLimiter(1, 10, "You're going too fast. Please wait a few seconds."), // 1 per 10 sec
  async (req, res) => {
    const { message, threadId } = req.body;

    if (!message || typeof message !== "string" || message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: "Message too long or missing." });
    }

    const ip = req.headers["cf-connecting-ip"] || req.ip;
    const redisKey = `ask:${ip}:daily`;

    try {
      // Check Redis limit
      console.log("🚨 Redis IP Key:", redisKey);
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.expire(redisKey, 60 * 60 * 24); // 24-hour TTL
        const ttl = await redis.ttl(redisKey);
        console.log("🕒 TTL set on key:", ttl);
      }

      if (count > MAX_DAILY_MESSAGES) {
        return res.status(429).json({
          error: "Daily usage limit exceeded. Please try again tomorrow.",
        });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      let thread = threadId;
      if (!thread) {
        const created = await openai.beta.threads.create();
        thread = created.id;
      }

      await openai.beta.threads.messages.create(thread, {
        role: "user",
        content: message,
      });

      const run = await openai.beta.threads.runs.create(thread, {
        assistant_id: process.env.OPENAI_ASSISTANT_ID,
      });

      let runStatus = run.status;
      let attempts = 0;

      while (
        runStatus !== "completed" &&
        runStatus !== "failed" &&
        attempts < MAX_ATTEMPTS
      ) {
        await new Promise((r) => setTimeout(r, 1000));
        const runCheck = await openai.beta.threads.runs.retrieve(thread, run.id);
        runStatus = runCheck.status;
        attempts++;
      }

      if (runStatus === "failed" || attempts >= MAX_ATTEMPTS) {
        throw new Error("Assistant run failed or timed out");
      }

      const messages = await openai.beta.threads.messages.list(thread);
      const last = messages.data.find((m) => m.role === "assistant");

      res.json({
        threadId: thread,
        reply: last?.content?.[0]?.text?.value || "No reply found.",
      });
    } catch (err) {
      console.error("❌ AI Assistant Error:", err);
      res.status(500).json({ error: "Failed to get assistant reply." });
    }
  }
);

app.use("/api", router);

// Root API
app.get("/api", (req, res) => {
  res.json({ message: "Torrent Network API is running!" });
});

// Production fallback for React routes
app.use(express.static(FRONTEND_BUILD_PATH));
app.get(/^\/(?!api\/|auth\/|uploads\/|covers\/).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_BUILD_PATH, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

export default db;