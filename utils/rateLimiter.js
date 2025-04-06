import rateLimit from "express-rate-limit";

/**
 * Creates a rate limiter middleware with custom settings.
 * @param {number} windowMinutes - Duration of window in minutes.
 * @param {number} maxRequests - Max requests per window per IP.
 * @param {string} message - Optional message on limit exceeded.
 */
export default function rateLimiter(windowMinutes = 60, maxRequests = 3, message = "Too many requests. Please try again later.") {
  const exemptIp = "127.0.0.1"; // ⬅️ Replace with your IP

  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
    keyGenerator: (req) => {
      // Bypass rate limiting for your IP
      return req.ip === exemptIp ? `${req.ip}-bypass` : req.ip;
    },
    skip: (req) => req.ip === exemptIp
  });
  
}
// In-memory store (replace with Redis or DB in prod)
const lastAction = {};

function userLimit(type, windowSeconds = 10) {
  return (req, res, next) => {
    const userId = req.user?.uuid;
    const key = `${type}:${userId}`;
    const now = Date.now();

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (lastAction[key] && now - lastAction[key] < windowSeconds * 1000) {
      const wait = Math.ceil((windowSeconds * 1000 - (now - lastAction[key])) / 1000);
      return res.status(429).json({ error: `Please wait ${wait}s before posting again.` });
    }

    lastAction[key] = now;
    next();
  };
}

export const limitThreadPosts = userLimit("thread", 60);
export const limitReplies = userLimit("reply", 10);
export const limitReactions = userLimit("reaction", 1);
export const limitFlags = userLimit("flag", 60);