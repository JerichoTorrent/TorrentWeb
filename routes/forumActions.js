import express from "express";
import db from "../utils/db.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { limitReactions, limitFlags } from "../utils/rateLimiter.js";
import { awardXp } from "../utils/xpManager.js";

const router = express.Router();

// POST /api/forums/posts/:postId/react
router.post("/posts/:postId/react", authMiddleware, limitReactions, async (req, res) => {
  const { postId } = req.params;
  const { reaction } = req.body;
  const userId = req.user.uuid;

  if (!["upvote", "downvote"].includes(reaction)) {
    return res.status(400).json({ error: "Invalid reaction type" });
  }

  try {
    // Check if this user already reacted
    const [existingRows] = await db.query(
      `SELECT reaction FROM forum_reactions WHERE post_id = ? AND user_id = ?`,
      [postId, userId]
    );

    let awardReactionXp = false;
    let postAuthorId = null;

    if (existingRows.length > 0) {
      const existing = existingRows[0].reaction;

      if (existing === reaction) {
        // Undo reaction
        await db.query(
          `DELETE FROM forum_reactions WHERE post_id = ? AND user_id = ?`,
          [postId, userId]
        );
      } else {
        // Change reaction
        await db.query(
          `UPDATE forum_reactions SET reaction = ?, created_at = NOW() WHERE post_id = ? AND user_id = ?`,
          [reaction, postId, userId]
        );
      }
    } else {
      // NEW reaction — award XP only if it's an upvote
      await db.query(
        `INSERT INTO forum_reactions (post_id, user_id, reaction) VALUES (?, ?, ?)`,
        [postId, userId, reaction]
      );

      if (reaction === "upvote") {
        awardReactionXp = true;
        const [[post]] = await db.query(
          `SELECT user_id FROM forum_posts WHERE id = ?`,
          [postId]
        );
        postAuthorId = post?.user_id;
      }
    }

    // Award XP to post author (but never to yourself)
    if (awardReactionXp && postAuthorId && postAuthorId !== userId) {
      try {
        await awardXp(db, postAuthorId, "reaction_received");
      } catch (err) {
        console.warn("Failed to award XP for reaction:", err);
      }
    }

    // Get updated score
    const [[{ score }]] = await db.query(
      `SELECT 
        SUM(CASE 
              WHEN reaction = 'upvote' THEN 1 
              WHEN reaction = 'downvote' THEN -1 
              ELSE 0 
            END) AS score
       FROM forum_reactions
       WHERE post_id = ?`,
      [postId]
    );

    res.json({ success: true, reputation: score ?? 0 });
  } catch (err) {
    console.error("Error processing reaction:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/forums/posts/:postId/flag
router.post("/posts/:postId/flag", authMiddleware, limitFlags, async (req, res) => {
  const { postId } = req.params;
  const { reason, details } = req.body;
  const userId = req.user.uuid;

  const validReasons = [
    "inappropriate",
    "harassment",
    "doxxing",
    "guidelines",
    "exploits",
    "other",
  ];

  if (!validReasons.includes(reason)) {
    return res.status(400).json({ error: "Invalid flag reason" });
  }

  try {
    await db.query(
      `
      INSERT INTO forum_flags (post_id, user_id, reason, details)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        reason = VALUES(reason),
        details = VALUES(details),
        created_at = NOW()
    `,
      [postId, userId, reason, details || null]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error processing flag:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/forums/posts/:postId/reputation
router.get("/posts/:postId/reputation", async (req, res) => {
  const { postId } = req.params;
  try {
    const [[{ score }]] = await db.query(
      `SELECT 
        SUM(CASE 
              WHEN reaction = 'upvote' THEN 1 
              WHEN reaction = 'downvote' THEN -1 
              ELSE 0 
            END) AS score
       FROM forum_reactions
       WHERE post_id = ?`,
      [postId]
    );
    res.json({ reputation: score ?? 0 });
  } catch (err) {
    console.error("Error fetching reputation:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router;
