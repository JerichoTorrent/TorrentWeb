const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function authenticateToken(req, res, next) {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid token" });
  }
};