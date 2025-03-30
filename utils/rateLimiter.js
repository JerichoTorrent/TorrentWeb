import rateLimit from "express-rate-limit";

/**
 * Creates a rate limiter middleware with custom settings.
 * @param {number} windowMinutes - Duration of window in minutes.
 * @param {number} maxRequests - Max requests per window per IP.
 * @param {string} message - Optional message on limit exceeded.
 */
export default function rateLimiter(windowMinutes = 60, maxRequests = 3, message = "Too many requests. Please try again later.") {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message }
  });
}
