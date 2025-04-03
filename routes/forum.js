import express from "express";
import db from "../utils/db.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { limitThreadPosts, limitReplies } from "../utils/rateLimiter.js";

const router = express.Router();

// Recursive reply tree function
async function getReplyTree(threadId, parentId = null, depth = 0, maxDepth = 10) {
  if (depth >= maxDepth) return [];

  const query = `
    SELECT forum_posts.*, users.username
    FROM forum_posts
    JOIN users ON forum_posts.user_id = users.uuid
    WHERE forum_posts.thread_id = ? AND forum_posts.parent_id ${parentId === null ? "IS NULL" : "= ?"}
    ORDER BY forum_posts.created_at ASC
  `;
  const params = parentId === null ? [threadId] : [threadId, parentId];
  const [rows] = await db.query(query, params);

  const children = [];
  for (const row of rows) {
    const nested = await getReplyTree(threadId, row.id, depth + 1, maxDepth);
    children.push({ ...row, children: nested });
  }

  return children;
}

// GET paginated threads
router.get("/threads", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [rows] = await db.query(`
      SELECT forum_threads.*, users.username
      FROM forum_threads
      JOIN users ON forum_threads.user_id = users.uuid
      ORDER BY forum_threads.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [[{ count }]] = await db.query("SELECT COUNT(*) as count FROM forum_threads");
    res.json({ threads: rows, total: count });
  } catch (err) {
    console.error("Error fetching threads:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET thread by ID
router.get("/threads/:id", async (req, res) => {
  const threadId = req.params.id;
  try {
    const [rows] = await db.query(`
      SELECT forum_threads.*, users.username
      FROM forum_threads
      JOIN users ON forum_threads.user_id = users.uuid
      WHERE forum_threads.id = ?
    `, [threadId]);

    if (rows.length === 0) return res.status(404).json({ error: "Thread not found" });
    res.json({ thread: rows[0] });
  } catch (err) {
    console.error("Error fetching thread:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET top-level replies and nested tree
router.get("/threads/:id/replies", async (req, res) => {
  const threadId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [topReplies] = await db.query(`
      SELECT forum_posts.*, users.username
      FROM forum_posts
      JOIN users ON forum_posts.user_id = users.uuid
      WHERE forum_posts.thread_id = ? AND forum_posts.parent_id IS NULL
      ORDER BY forum_posts.created_at ASC
      LIMIT ? OFFSET ?
    `, [threadId, limit, offset]);

    const fullReplies = await Promise.all(
      topReplies.map(async (reply) => {
        const children = await getReplyTree(threadId, reply.id);
        return { ...reply, children };
      })
    );

    const [[{ count }]] = await db.query(`
      SELECT COUNT(*) as count FROM forum_posts
      WHERE thread_id = ? AND parent_id IS NULL
    `, [threadId]);

    res.json({ replies: fullReplies, total: count });
  } catch (err) {
    console.error("Error fetching replies:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET reply branch
router.get("/threads/:id/replies/:parentId", async (req, res) => {
  const threadId = req.params.id;
  const parentId = req.params.parentId;

  try {
    const [parentRows] = await db.query(`
      SELECT forum_posts.*, users.username
      FROM forum_posts
      JOIN users ON forum_posts.user_id = users.uuid
      WHERE forum_posts.id = ? AND forum_posts.thread_id = ?
    `, [parentId, threadId]);

    if (parentRows.length === 0) {
      return res.status(404).json({ error: "Parent reply not found" });
    }

    const replyTree = await getReplyTree(threadId, Number(parentId));
    res.json({ parent: parentRows[0], replies: replyTree });
  } catch (err) {
    console.error("Error fetching reply branch:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST a thread
router.post("/threads", authMiddleware, limitThreadPosts, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.uuid;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  try {
    const [result] = await db.query(`
      INSERT INTO forum_threads (user_id, title, content)
      VALUES (?, ?, ?)
    `, [userId, title, content]);

    res.status(201).json({ threadId: result.insertId });
  } catch (err) {
    console.error("Error creating thread:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST a reply
router.post("/threads/:id/replies", authMiddleware, limitReplies, async (req, res) => {
  const { content, parent_id = null } = req.body;
  const userId = req.user.uuid;
  const threadId = req.params.id;

  if (!content) {
    return res.status(400).json({ error: "Reply content is required" });
  }

  try {
    const [result] = await db.query(`
      INSERT INTO forum_posts (thread_id, user_id, content, parent_id)
      VALUES (?, ?, ?, ?)
    `, [threadId, userId, content, parent_id]);

    const [rows] = await db.query(`
      SELECT forum_posts.*, users.username
      FROM forum_posts
      JOIN users ON forum_posts.user_id = users.uuid
      WHERE forum_posts.id = ?
    `, [result.insertId]);

    res.status(201).json({ reply: rows[0] });
  } catch (err) {
    console.error("Error posting reply:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT edit reply
router.put("/replies/:id", authMiddleware, async (req, res) => {
  const replyId = req.params.id;
  const { content } = req.body;
  const userId = req.user.uuid;

  if (!content) {
    return res.status(400).json({ error: "Updated content is required." });
  }

  try {
    const [rows] = await db.query(`
      SELECT * FROM forum_posts WHERE id = ? AND user_id = ?
    `, [replyId, userId]);

    if (rows.length === 0) {
      return res.status(403).json({ error: "Not authorized to edit this reply." });
    }

    await db.query(`
      UPDATE forum_posts SET content = ?, created_at = NOW() WHERE id = ?
    `, [content, replyId]);

    res.json({ success: true });
  } catch (err) {
    console.error("Error updating reply:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE a reply
router.delete("/replies/:id", authMiddleware, async (req, res) => {
  const replyId = req.params.id;
  const userId = req.user.uuid;

  try {
    const [rows] = await db.query(`
      SELECT * FROM forum_posts WHERE id = ? AND user_id = ?
    `, [replyId, userId]);

    if (rows.length === 0) {
      return res.status(403).json({ error: "Not authorized to delete this reply." });
    }

    await db.query(`DELETE FROM forum_posts WHERE id = ?`, [replyId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting reply:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE a thread
router.delete("/threads/:id", authMiddleware, async (req, res) => {
  const threadId = req.params.id;
  const userId = req.user.uuid;

  try {
    const [rows] = await db.query(`
      SELECT * FROM forum_threads WHERE id = ? AND user_id = ?
    `, [threadId, userId]);

    if (rows.length === 0) {
      return res.status(403).json({ error: "Not authorized to delete this thread." });
    }

    await db.query(`DELETE FROM forum_threads WHERE id = ?`, [threadId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting thread:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
