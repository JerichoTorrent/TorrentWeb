import express from "express";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { fileURLToPath } from "url";
import { dirname } from "path";
import db from "../utils/db.js";
import authenticateToken from "../middleware/authMiddleware.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BLOG_DIR = path.join(__dirname, "../frontend/src/content/blog");

// Generates HTML + ToC, injects <h1 id="...">...</h1> directly
function generateHtmlAndToC(markdown) {
  const toc = [];
  const tokens = marked.lexer(markdown);
  const newTokens = [];

  tokens.forEach(token => {
    if (token.type === "heading" && token.depth >= 1 && token.depth <= 3) {
      const id = token.text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      // Replace heading token with raw HTML version with id on h-tag
      newTokens.push({
        type: "html",
        pre: false,
        text: `<h${token.depth} id="${id}">${token.text}</h${token.depth}>`
      });

      toc.push({ text: token.text, level: token.depth, id });
    } else {
      newTokens.push(token); // keep everything else
    }
  });

  const html = marked.parser(newTokens);
  return { html, toc };
}

// GET /api/blog | Blog summaries
router.get("/", (req, res) => {
  try {
    if (!fs.existsSync(BLOG_DIR)) {
      return res.status(500).json({ error: "Blog directory not found." });
    }

    const files = fs.readdirSync(BLOG_DIR).filter(file =>
      file.endsWith(".md") || file.endsWith(".markdown")
    );

    const posts = files.map((file) => {
      const slug = path.basename(file, path.extname(file));
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
      const { data, content } = matter(raw);

      const summary =
        data.description || content.split("<!--more-->")[0] || content.slice(0, 300);

      const { html: description } = generateHtmlAndToC(summary);

      return {
        slug,
        metadata: {
          title: data.title || slug,
          date: data.date || null,
          description,
          author: data.author || null,
          tags: Array.isArray(data.tags)
            ? data.tags
            : data.tags
              ? [data.tags]
              : [],
        },        
      };
    });

    posts.sort((a, b) => new Date(b.metadata.date) - new Date(a.metadata.date));
    res.json(posts);
  } catch (err) {
    console.error("❌ Blog summary error:", err);
    res.status(500).json({ error: "Error loading blog posts." });
  }
});

// GET /api/blog/:slug | Full post with ToC + emoji reactions
router.get("/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;

    // Find markdown file by slug
    const filePath = fs
      .readdirSync(BLOG_DIR)
      .find(f => path.basename(f, path.extname(f)) === slug);

    if (!filePath) {
      return res.status(404).json({ error: "Post not found." });
    }

    const raw = fs.readFileSync(path.join(BLOG_DIR, filePath), "utf-8");
    const { data, content } = matter(raw);

    const { html, toc } = generateHtmlAndToC(content);

    // Fetch emoji reaction counts
    let reactions = {};
    try {
      const [rows] = await db.query(
        `SELECT emoji, COUNT(*) as count
         FROM blog_post_reactions
         WHERE post_slug = ?
         GROUP BY emoji`,
        [slug]
      );

      for (const row of rows) {
        reactions[row.emoji] = row.count;
      }
    } catch (err) {
      console.warn("⚠️ Failed to fetch reactions:", err);
      reactions = {};
    }

    res.json({
      slug,
      ...data,
      content: html,
      toc,
      reactions, // Added to frontend payload
    });
  } catch (err) {
    console.error("❌ Blog post error:", err);
    res.status(500).json({ error: "Error loading blog post." });
  }
});


// GET /api/blog/comments/:slug → paginated + sorted
router.get("/comments/:slug", async (req, res) => {
  const { slug } = req.params;
  const sort = req.query.sort || "newest";
  const page = parseInt(req.query.page) || 1;
  const perPage = 10;
  const offset = (page - 1) * perPage;

  const validSorts = {
    top: "reputation DESC",
    newest: "created_at DESC",
    oldest: "created_at ASC",
  };

  const sortOrder = validSorts[sort] || validSorts["newest"];

  try {
    // Top-level comments only
    const [comments] = await db.query(
      `
      SELECT 
        c.*,
        c.edited_at IS NOT NULL AS edited,
        c.deleted,
        IFNULL(reactions.reaction_map, '{}') AS reaction_map
      FROM blog_comments c
      LEFT JOIN (
        SELECT 
          comment_id,
          CONCAT('{', GROUP_CONCAT(CONCAT('"', type, '":', count)), '}') AS reaction_map
        FROM (
          SELECT 
            comment_id,
            type,
            COUNT(*) AS count
          FROM blog_reactions
          GROUP BY comment_id, type
        ) AS counted
        GROUP BY comment_id
      ) AS reactions ON reactions.comment_id = c.id
      WHERE c.post_slug = ? AND c.parent_id IS NULL
      ORDER BY ${sortOrder}
      LIMIT ? OFFSET ?
      `,
      [slug, perPage, offset]
    );
    comments.forEach(c => {
      try {
        c.reactions = JSON.parse(c.reaction_map || '{}');
      } catch {
        c.reactions = {};
      }
      delete c.reaction_map;
    });

    // Child replies (all)
    const [replies] = await db.query(
      `
      SELECT 
        c.*,
        c.edited_at IS NOT NULL AS edited,
        c.deleted,
        IFNULL(reactions.reaction_map, '{}') AS reaction_map
      FROM blog_comments c
      LEFT JOIN (
        SELECT 
          comment_id,
          CONCAT('{', GROUP_CONCAT(CONCAT('"', type, '":', count)), '}') AS reaction_map
        FROM (
          SELECT 
            comment_id,
            type,
            COUNT(*) AS count
          FROM blog_reactions
          GROUP BY comment_id, type
        ) AS counted
        GROUP BY comment_id
      ) AS reactions ON reactions.comment_id = c.id
      WHERE c.post_slug = ? AND c.parent_id IS NOT NULL
      ORDER BY ${sortOrder}
      LIMIT ? OFFSET ?
      `,
      [slug, perPage, offset]
    );
    comments.forEach(c => {
      try {
        c.reactions = JSON.parse(c.reaction_map || '{}');
      } catch {
        c.reactions = {};
      }
      delete c.reaction_map;
    });

    // Total count for pagination (top-level only)
    const [[{ count }]] = await db.query(
      `SELECT COUNT(*) as count FROM blog_comments WHERE post_slug = ? AND parent_id IS NULL`,
      [slug]
    );

    // Total comment count (including replies)
    const [[{ totalComments }]] = await db.query(
      `SELECT COUNT(*) as totalComments FROM blog_comments WHERE post_slug = ?`,
      [slug]
    );

    res.json({
      comments,
      replies,
      totalPages: Math.ceil(count / perPage),
      currentPage: page,
      totalComments,
    });
  } catch (err) {
    console.error("❌ Blog comment fetch error:", err);
    res.status(500).json({ error: "Failed to fetch comments." });
  }
});

// POST /api/blog/:slug/comments | Create comment
router.post("/:slug/comments", authenticateToken, async (req, res) => {
  const { slug } = req.params;
  const { content, parent_id } = req.body;
  const uuid = req.user?.uuid;
  const username = req.user?.username;

  if (!uuid || !content?.trim()) {
    return res.status(400).json({ error: "Missing content or authentication." });
  }

  try {
    await db.query(
      `INSERT INTO blog_comments (post_slug, uuid, username, content, parent_id) VALUES (?, ?, ?, ?, ?)`,
      [slug, uuid, username, content.trim(), parent_id || null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Create comment error:", err);
    res.status(500).json({ error: "Failed to create comment." });
  }
});

// PUT /api/blog/comments/:id | Edit comment
router.put("/comments/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const uuid = req.user?.uuid;

  if (!uuid || !content?.trim()) {
    return res.status(400).json({ error: "Missing content or unauthorized." });
  }

  try {
    const [result] = await db.query(
      `UPDATE blog_comments
       SET content = ?, edited_at = NOW()
       WHERE id = ? AND uuid = ? AND deleted = 0`,
      [content.trim(), id, uuid]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ error: "You cannot edit this comment." });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Comment edit error:", err);
    res.status(500).json({ error: "Failed to edit comment." });
  }
});

// DELETE /api/blog/:slug/comments/:id | Delete comment (soft delete)
router.delete("/:slug/comments/:id", authenticateToken, async (req, res) => {
  const { slug, id } = req.params;
  const uuid = req.user?.uuid;
  const isStaff = req.user?.is_staff;

  if (!uuid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Staff can delete any comment, users only their own
    const [result] = await db.query(
      `UPDATE blog_comments
       SET deleted = 1, content = '', edited_at = NOW()
       WHERE id = ? AND post_slug = ? ${isStaff ? '' : 'AND uuid = ?'}`,
      isStaff ? [id, slug] : [id, slug, uuid]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ error: "You cannot delete this comment." });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete comment error:", err);
    res.status(500).json({ error: "Failed to delete comment." });
  }
});

// POST /api/blog/comments/:id/react
router.post("/comments/:id/react", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  const uuid = req.user?.uuid;

  if (!uuid || !["upvote", "downvote"].includes(type)) {
    return res.status(400).json({ error: "Invalid reaction type." });
  }

  try {
    // First, delete previous reaction (if any)
    await db.query(
      `DELETE FROM blog_reactions WHERE comment_id = ? AND uuid = ?`,
      [id, uuid]
    );

    // Then, insert the new one
    await db.query(
      `INSERT INTO blog_reactions (comment_id, post_slug, uuid, type)
       SELECT ?, c.post_slug, ?, ?
       FROM blog_comments c WHERE c.id = ?`,
      [id, uuid, type, id]
    );

    // Return updated reaction counts
    const [rows] = await db.query(
      `SELECT type, COUNT(*) as count FROM blog_reactions WHERE comment_id = ? GROUP BY type`,
      [id]
    );

    const reactions = {};
    rows.forEach(r => reactions[r.type] = r.count);

    res.json({ reactions });
  } catch (err) {
    console.error("❌ React error:", err);
    res.status(500).json({ error: "Failed to react." });
  }
});

// POST /api/blog/:slug/react | Add or update emoji reaction on blog post
router.post("/:slug/react", authenticateToken, async (req, res) => {
  const { emoji } = req.body;
  const { slug } = req.params;
  const uuid = req.user?.uuid;

  if (!uuid || !emoji || typeof emoji !== 'string') {
    return res.status(400).json({ error: "Invalid emoji or user." });
  }

  try {
    // Insert or update user’s reaction for the blog post
    await db.query(
      `INSERT INTO blog_post_reactions (post_slug, user_uuid, emoji)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE emoji = emoji`,
      [slug, uuid, emoji]
    );

    // Fetch updated counts
    const [rows] = await db.query(
      `SELECT emoji, COUNT(*) as count
       FROM blog_post_reactions
       WHERE post_slug = ?
       GROUP BY emoji`,
      [slug]
    );

    const reactions = {};
    for (const row of rows) {
      reactions[row.emoji] = row.count;
    }

    res.json({ reactions });
  } catch (err) {
    console.error("❌ Blog post reaction error:", err);
    res.status(500).json({ error: "Failed to react to post." });
  }
});

export default router;
