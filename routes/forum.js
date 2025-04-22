import express from "express";
import db from "../utils/db.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { limitThreadPosts, limitReplies } from "../utils/rateLimiter.js";
import { filterBadWords } from "../utils/filterBadWords.js";
import { marked } from 'marked';
import jwt from "jsonwebtoken";
import { extractMentions, linkifyMentions } from "../utils/mentionParser.js";
import { awardXp } from "../utils/xpManager.js";

const router = express.Router();
const FETCH_DEPTH_LIMIT = 50;

async function getReplyTree(threadId, parentId = null, depth = 0, maxDepth = FETCH_DEPTH_LIMIT) {
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
    const nested = await getReplyTree(threadId, row.id, depth + 1, maxDepth); // still depth-aware for safety

    if (row.deleted) {
      row.content = "[Deleted by staff]";
      row.username = "[Deleted]";
    }

    children.push({
      ...row,
      content_html: marked.parse(linkifyMentions(row.content)),
      children: nested,
    });
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
    let params = [];
    let whereClause = "WHERE t.deleted = FALSE";
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
      ${whereClause}
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
      return {
        ...thread,
        content_html: marked.parse(linkifyMentions(thread.content.slice(0, 300) + '...'))
      };
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
router.get("/threads/:id", authMiddleware, async (req, res) => {
  const threadId = req.params.id;

  try {
    const [rows] = await db.query(`
      SELECT t.*, u.username, c.slug as category_slug, c.name as category_name
      FROM forum_threads t
      JOIN users u ON t.user_id = u.uuid
      JOIN forum_categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [threadId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Thread not found" });
    }

    const thread = rows[0];

    if (thread.is_private) {
      const user = req.user;
      const isOwner = user?.uuid === thread.user_id;
      const isStaff = user?.is_staff;

      if (!isOwner && !isStaff) {
        return res.status(403).json({ error: "You do not have permission to view this private thread." });
      }
    }

    if (thread.deleted) {
      thread.title = "[Deleted by staff]";
      thread.content = "[Deleted by staff]";
      thread.username = "[Deleted]";
    }

    thread.content_html = marked.parse(linkifyMentions(thread.content));

    res.json({ thread });
  } catch (err) {
    console.error("Error fetching thread:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Full-text forum thread search
router.get("/search", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const { q, category } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (!q || typeof q !== "string") {
    return res.status(400).json({ error: "Missing search query" });
  }

  try {
    const searchTerm = `%${q}%`;
    const params = [searchTerm, searchTerm];
    const countParams = [searchTerm, searchTerm];
    let categoryFilter = "";

    let categoryId = null;
    if (category) {
      const [[cat]] = await db.query("SELECT id FROM forum_categories WHERE slug = ?", [category]);
      if (!cat) return res.status(404).json({ error: "Category not found" });
      categoryId = cat.id;
      categoryFilter = " AND t.category_id = ?";
      params.push(categoryId);
      countParams.push(categoryId);
    }

    const [contentMatches] = await db.query(`
      SELECT 
        t.id, t.title, t.content, t.created_at,
        t.category_id, t.is_sticky,
        u.username, c.slug AS category_slug,
        COALESCE(SUM(CASE 
          WHEN r.reaction = 'upvote' THEN 1
          WHEN r.reaction = 'downvote' THEN -1
          ELSE 0
        END), 0) AS reputation
      FROM forum_threads t
      JOIN users u ON t.user_id = u.uuid
      JOIN forum_categories c ON t.category_id = c.id
      LEFT JOIN forum_reactions r ON t.id = r.post_id
      WHERE t.deleted = FALSE AND (t.title LIKE ? OR t.content LIKE ?)
      ${categoryFilter}
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const [[{ count }]] = await db.query(`
      SELECT COUNT(*) as count
      FROM forum_threads t
      WHERE t.deleted = FALSE AND (t.title LIKE ? OR t.content LIKE ?)
      ${category ? " AND t.category_id = ?" : ""}
    `, countParams);

    const [userMatches] = await db.query(`
      SELECT uuid, username FROM users WHERE username LIKE ?
    `, [`%${q}%`]);

    const threads = contentMatches.map((thread) => ({
      ...thread,
      content_html: marked.parse(linkifyMentions(thread.content.slice(0, 300) + '...')),
    }));

    res.json({ threads, users: userMatches, total: count });
  } catch (err) {
    console.error("Error in search:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// GET replies
router.get("/threads/:id/replies", async (req, res) => {
  const threadId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [[mainPost]] = await db.query(
      "SELECT id FROM forum_posts WHERE thread_id = ? AND parent_id IS NULL ORDER BY created_at ASC LIMIT 1",
      [threadId]
    );

    const mainPostId = mainPost?.id ?? 0;
    const [topReplies] = await db.query(`
      SELECT forum_posts.*, users.username
      FROM forum_posts
      JOIN users ON forum_posts.user_id = users.uuid
      WHERE forum_posts.thread_id = ? AND forum_posts.parent_id IS NULL AND forum_posts.id != ?
      ORDER BY forum_posts.created_at ASC
      LIMIT ? OFFSET ?
    `, [threadId, mainPostId, limit, offset]);

    const sanitizedReplies = await Promise.all(
      topReplies.map(async (reply) => {
        const children = await getReplyTree(threadId, reply.id);
        if (reply.deleted) {
          reply.content = "[Deleted by staff]";
          reply.username = "[Deleted]";
        }
        return {
          ...reply,
          content_html: marked.parse(linkifyMentions(reply.content)),
          children,
        };
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
      parent.content_html = marked.parse(linkifyMentions(parent.content));
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

router.get("/auth/upload-token", authMiddleware, (req, res) => {
  const payload = {
    uuid: req.user.uuid,
    type: "upload",
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "2h" });

  res.json({ token });
});

// GET mentions (future for notifications)
router.get("/:uuid", async (req, res) => {
  const uuid = req.params.uuid;
  const [rows] = await db.query(`
    SELECT m.*, t.title AS thread_title
    FROM mentions m
    LEFT JOIN forum_threads t ON m.post_type = 'thread' AND m.post_id = t.id
    WHERE m.mentioned_uuid = ?
    ORDER BY m.created_at DESC
    LIMIT 10
  `, [uuid]);

  res.json(rows);
});

router.post("/threads", authMiddleware, limitThreadPosts, async (req, res) => {
  const { title, content, category_id, is_sticky = false, is_private = false } = req.body;
  const userId = req.user.uuid;

  if (!title || !content || !category_id) {
    return res.status(400).json({ error: "Title, content, and category are required" });
  }

  try {
    // Fetch full category info
    const [[category]] = await db.query(`SELECT id, name, section FROM forum_categories WHERE id = ?`, [category_id]);
    if (!category) {
      return res.status(400).json({ error: "Invalid category selected." });
    }

    // Only staff can post in "Administration" section
    if (category.section === "Administration" && !req.user.is_staff) {
      return res.status(403).json({ error: "Only staff can post in this category." });
    }

    // Restrict sticky threads to staff members
    if (is_sticky && !req.user.is_staff) {
      return res.status(403).json({ error: "Only staff can create sticky threads." });
    }

    // Limit staff applications to once every 30 days (category_id = 13)
    if (category.name === "Staff Applications" && !req.user.is_staff) {
      const [recent] = await db.query(
        `SELECT id FROM forum_threads
         WHERE user_id = ? AND category_id = ? AND created_at > NOW() - INTERVAL 30 DAY
         LIMIT 1`,
        [userId, category_id]
      );
      if (recent.length > 0) {
        return res.status(429).json({ error: "You may only submit one staff application every 30 days." });
      }
    }

    // Don't allow random private threads
    if (is_private && category.name !== "Staff Applications") {
      return res.status(403).json({ error: "Private threads are only allowed for staff applications." });
    }

    // Insert the new thread
    const [result] = await db.query(
      `INSERT INTO forum_threads (user_id, title, content, category_id, is_sticky, is_private)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, filterBadWords(title), filterBadWords(content), category_id, is_sticky, is_private ? 1 : 0]
    );

    const threadId = result.insertId;

    await db.query(
      `INSERT INTO forum_posts (thread_id, user_id, content, content_html)
       VALUES (?, ?, ?, ?)`,
      [
        threadId,
        userId,
        filterBadWords(content),
        marked.parse(linkifyMentions(content))
      ]
    );

    // Mentions
    const mentionedUsers = await extractMentions(content);
    for (const user of mentionedUsers) {
      await db.query(
        `INSERT INTO mentions (post_type, post_id, mentioned_uuid)
         VALUES (?, ?, ?)`,
        ["thread", threadId, user.uuid]
      );
    }

    const [[{ slug }]] = await db.query(
      "SELECT slug FROM forum_categories WHERE id = ?",
      [category_id]
    );

    await awardXp(db, userId, "thread");

    res.status(201).json({ threadId, categorySlug: slug });
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
    `, [threadId, userId, filterBadWords(content), parent_id]);

    const replyId = result.insertId;

    // Extract and save mentions
    const mentionedUsers = await extractMentions(content);

    for (const user of mentionedUsers) {
      await db.query(
        `INSERT INTO mentions (post_type, post_id, mentioned_uuid)
         VALUES (?, ?, ?)`,
        ["reply", replyId, user.uuid]
      );
    }

    const [rows] = await db.query(`
      SELECT forum_posts.*, users.username
      FROM forum_posts
      JOIN users ON forum_posts.user_id = users.uuid
      WHERE forum_posts.id = ?
    `, [replyId]);
    await awardXp(db, userId, "reply");

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
      UPDATE forum_posts SET content = ?, created_at = NOW(), edited = TRUE WHERE id = ?
    `, [filterBadWords(content), replyId]);

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

// GET single reply by ID (used after posting or editing to fetch full reply w/ content_html)
router.get("/replies/:id", async (req, res) => {
  const replyId = req.params.id;

  try {
    const [rows] = await db.query(`
      SELECT forum_posts.*, users.username
      FROM forum_posts
      JOIN users ON forum_posts.user_id = users.uuid
      WHERE forum_posts.id = ?
    `, [replyId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Reply not found" });
    }

    const reply = rows[0];

    if (reply.deleted) {
      reply.content = "[Deleted by staff]";
      reply.username = "[Deleted]";
    }

    res.json({
      reply: {
        ...reply,
        content_html: marked.parse(linkifyMentions(reply.content)),
        children: [],
      }
    });
  } catch (err) {
    console.error("Error fetching reply by ID:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/user-threads/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const [[user]] = await db.query("SELECT uuid FROM users WHERE username = ?", [username]);
    if (!user) return res.status(404).json({ error: "User not found" });

    const [threads] = await db.query(`
      SELECT 
        t.id, t.title, t.content, t.created_at,
        c.slug AS category_slug,
        u.username,
        (SELECT COUNT(*) FROM forum_posts WHERE thread_id = t.id AND deleted = FALSE) AS replies,
        CAST(COALESCE(SUM(CASE 
          WHEN r.reaction = 'upvote' THEN 1
          WHEN r.reaction = 'downvote' THEN -1
          ELSE 0
        END), 0) AS SIGNED) AS reputation
      FROM forum_threads t
      JOIN forum_categories c ON t.category_id = c.id
      JOIN users u ON t.user_id = u.uuid
      LEFT JOIN forum_reactions r ON r.post_id = t.id
      WHERE t.user_id = ?
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT 25
    `, [user.uuid]);

    res.json({ threads });
  } catch (err) {
    console.error("Error fetching user threads:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
