import express from "express";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { fileURLToPath } from "url";
import { dirname } from "path";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BLOG_DIR = path.join(__dirname, "../frontend/src/content/blog");

// ✅ Generates HTML + ToC, injects <h1 id="...">...</h1> directly
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

      // ✅ Replace heading token with raw HTML version with id on h-tag
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

// GET /api/blog → Blog summaries
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
          author: data.author || null, // ✅ add this line
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

// GET /api/blog/:slug → Full post with ToC
router.get("/:slug", (req, res) => {
  try {
    const slug = req.params.slug;
    const filePath = fs
      .readdirSync(BLOG_DIR)
      .find(f => path.basename(f, path.extname(f)) === slug);

    if (!filePath) {
      return res.status(404).json({ error: "Post not found." });
    }

    const raw = fs.readFileSync(path.join(BLOG_DIR, filePath), "utf-8");
    const { data, content } = matter(raw);

    const { html, toc } = generateHtmlAndToC(content);

    console.log("✅ Final ToC:", toc);

    res.json({
      slug,
      ...data,
      content: html,
      toc,
    });
  } catch (err) {
    console.error("❌ Blog post error:", err);
    res.status(500).json({ error: "Error loading blog post." });
  }
});

export default router;
