import express from "express";
import db from "../utils/db.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { limitThreadPosts, limitReplies } from "../utils/rateLimiter.js";

const router = express.Router();

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

    if (row.deleted) {
      row.content = "[Deleted by staff]";
      row.username = "[Deleted]";
    }

    children.push({ ...row, children: nested });
  }

  return children;
}

// GET threads by category
router.get("/threads", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const categorySlug = req.query.category;
  const whereWithAlias = "WHERE t.deleted = FALSE" + (categorySlug ? " AND t.category_id = ?" : "");
  const whereNoAlias = "WHERE deleted = FALSE" + (categorySlug ? " AND category_id = ?" : "");

  try {
    let whereClause = "WHERE t.deleted = FALSE";
    let params = [];

    if (categorySlug) {
      const [[cat]] = await db.query("SELECT id FROM forum_categories WHERE slug = ?", [categorySlug]);
      if (!cat) return res.status(404).json({ error: "Category not found" });
      whereClause += " AND t.category_id = ?";
      params.push(cat.id);
    }

    const [rows] = await db.query(`
      SELECT 
        t.id, t.user_id, t.title, t.content, t.created_at,
        t.category_id, t.is_sticky, t.deleted,
        u.username, c.slug AS category_slug, c.name AS category_name,
        COALESCE(SUM(CASE 
          WHEN r.reaction = 'upvote' THEN 1
          WHEN r.reaction = 'downvote' THEN -1
          ELSE 0
        END), 0) AS reputation
      FROM forum_threads t
      JOIN users u ON t.user_id = u.uuid
      JOIN forum_categories c ON t.category_id = c.id
      LEFT JOIN forum_reactions r ON t.id = r.post_id
      ${whereWithAlias}
      GROUP BY t.id
      ORDER BY t.is_sticky DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Sanitize deleted threads (if shown in future)
    const threads = rows.map((thread) => {
      if (thread.deleted) {
        return {
          ...thread,
          title: "[Deleted by staff]",
          content: "[Deleted by staff]",
          username: "[Deleted]"
        };
      }
      return thread;
    });

    const [[{ count }]] = await db.query(`
      SELECT COUNT(*) as count FROM forum_threads ${whereNoAlias}
    `, params);

    res.json({ threads, total: count });
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
      SELECT t.*, u.username, c.slug as category_slug, c.name as category_name
      FROM forum_threads t
      JOIN users u ON t.user_id = u.uuid
      JOIN forum_categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [threadId]);

    if (rows.length === 0) return res.status(404).json({ error: "Thread not found" });

    let thread = rows[0];
    if (thread.deleted) {
      thread.title = "[Deleted by staff]";
      thread.content = "[Deleted by staff]";
      thread.username = "[Deleted]";
    }

    res.json({ thread });
  } catch (err) {
    console.error("Error fetching thread:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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

    const sanitizedReplies = await Promise.all(
      topReplies.map(async (reply) => {
        const children = await getReplyTree(threadId, reply.id);
        if (reply.deleted) {
          reply.content = "[Deleted by staff]";
          reply.username = "[Deleted]";
        }
        return { ...reply, children };
      })
    );

    const [[{ count }]] = await db.query(`
      SELECT COUNT(*) as count FROM forum_posts
      WHERE thread_id = ? AND parent_id IS NULL AND deleted = FALSE
    `, [threadId]);

    res.json({ replies: sanitizedReplies, total: count });
  } catch (err) {
    console.error("Error fetching replies:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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

    const parent = parentRows[0];
    if (parent.deleted) {
      parent.content = "[Deleted by staff]";
      parent.username = "[Deleted]";
    }

    const replyTree = await getReplyTree(threadId, Number(parentId));
    res.json({ parent, replies: replyTree });
  } catch (err) {
    console.error("Error fetching reply branch:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT * FROM forum_categories ORDER BY section, sort_order
    `);

    const grouped = categories.reduce((acc, cat) => {
      if (!acc[cat.section]) acc[cat.section] = [];
      acc[cat.section].push(cat);
      return acc;
    }, {});

    res.json(grouped);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/categories/:slug", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM forum_categories WHERE slug = ?`,
      [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Category not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching category:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/threads", authMiddleware, limitThreadPosts, async (req, res) => {
  const { title, content, category_id, is_sticky = false } = req.body;
  const userId = req.user.uuid;

  if (!title || !content || !category_id) {
    return res.status(400).json({ error: "Title, content, and category are required" });
  }
  if (category_id === 1 && !req.user.is_staff) {
    return res.status(403).json({ error: "Only staff can post in this category." });
  }

  try {
    const [[category]] = await db.query(`SELECT id FROM forum_categories WHERE id = ?`, [category_id]);
    if (!category) {
      return res.status(400).json({ error: "Invalid category selected." });
    }

    if (is_sticky && !req.user.is_staff) {
      return res.status(403).json({ error: "Only staff can create sticky threads." });
    }

    const [result] = await db.query(
      `INSERT INTO forum_threads (user_id, title, content, category_id, is_sticky)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, title, content, category_id, is_sticky]
    );

    const [[{ slug }]] = await db.query(
      "SELECT slug FROM forum_categories WHERE id = ?",
      [category_id]
    );
    
    res.status(201).json({ threadId: result.insertId, categorySlug: slug });
  } catch (err) {
    console.error("Error creating thread:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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

router.patch("/threads/:id/sticky", authMiddleware, async (req, res) => {
  const threadId = req.params.id;
  const { is_sticky } = req.body;

  if (typeof is_sticky !== "boolean") {
    return res.status(400).json({ error: "is_sticky must be a boolean" });
  }

  if (!req.user.is_staff) {
    return res.status(403).json({ error: "Only staff can update sticky status." });
  }

  try {
    const [result] = await db.query(
      `UPDATE forum_threads SET is_sticky = ? WHERE id = ?`,
      [is_sticky, threadId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Thread not found." });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error updating sticky status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/replies/:id", authMiddleware, async (req, res) => {
  const replyId = req.params.id;
  const userId = req.user.uuid;
  const isStaff = req.user.is_staff;

  try {
    const [rows] = await db.query(`
      SELECT * FROM forum_posts WHERE id = ?
    `, [replyId]);

    if (rows.length === 0 || (!isStaff && rows[0].user_id !== userId)) {
      return res.status(403).json({ error: "Not authorized to delete this reply." });
    }

    await db.query(`UPDATE forum_posts SET deleted = TRUE WHERE id = ?`, [replyId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting reply:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/threads/:id", authMiddleware, async (req, res) => {
  const threadId = req.params.id;
  const userId = req.user.uuid;
  const isStaff = req.user.is_staff;

  try {
    const [rows] = await db.query(`
      SELECT * FROM forum_threads WHERE id = ?
    `, [threadId]);

    if (rows.length === 0 || (!isStaff && rows[0].user_id !== userId)) {
      return res.status(403).json({ error: "Not authorized to delete this thread." });
    }

    await db.query(`UPDATE forum_threads SET deleted = TRUE WHERE id = ?`, [threadId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting thread:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
