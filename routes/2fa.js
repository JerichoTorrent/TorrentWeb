import express from "express";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import mysql from "mysql2/promise";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Generate a TOTP secret and QR code
router.post("/setup", authMiddleware, async (req, res) => {
  const user = req.user;

  const secret = speakeasy.generateSecret({
    name: `Torrent Network (${user.username})`,
  });

  const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

  // Temporarily store secret in-memory or attach to user session
  // In production, store to DB in unverified state or cache
  req.session.temp2FASecret = secret.base32;

  res.json({
    qrCode: qrDataUrl,
    secret: secret.base32,
  });
});

// Verify and activate 2FA
router.post("/verify", authMiddleware, async (req, res) => {
  const user = req.user;
  const { token } = req.body;
  const secret = req.session.temp2FASecret;

  if (!token || !secret) {
    return res.status(400).json({ error: "Missing token or setup secret." });
  }

  const verified = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  });

  if (!verified) {
    return res.status(401).json({ error: "Invalid verification code." });
  }

  // Save 2FA state in DB
  await db.query(
    "UPDATE users SET twofa_enabled = 1, twofa_method = 'totp', twofa_secret = ? WHERE uuid = ?",
    [secret, user.uuid]
  );

  delete req.session.temp2FASecret;
  res.json({ success: true });
});

// Disable 2FA
router.post("/disable", authMiddleware, async (req, res) => {
  const user = req.user;

  await db.query(
    "UPDATE users SET twofa_enabled = 0, twofa_method = NULL, twofa_secret = NULL WHERE uuid = ?",
    [user.uuid]
  );

  res.json({ success: true });
});

// Check 2FA status
router.get("/status", authMiddleware, async (req, res) => {
  const user = req.user;
  const [rows] = await db.query(
    "SELECT twofa_enabled, twofa_method FROM users WHERE uuid = ?",
    [user.uuid]
  );

  res.json(rows[0] || {});
});

export default router;
