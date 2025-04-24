import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const BASE_URL = process.env.FRONTEND_URL;

const staticRoutes = [
  "/", "/login", "/register", "/forgot-password", "/reset-password", "/reset-success",
  "/verify-success", "/verify-error", "/map", "/vote", "/blog", "/rules", "/play",
  "/terms", "/privacy", "/affiliates", "/bans", "/bans/list", "/forums", "/forums/latest",
  "/forums/feed", "/forums/search", "/stats"
];

function wrapUrl(url, lastmod = null) {
  return `
  <url>
    <loc>${BASE_URL}${url}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
  </url>`;
}

export default async function generateSitemap() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const urls = [];

  // Blog posts
  const [posts] = await db.query("SELECT slug, published_at FROM blog_posts");
  for (const post of posts) {
    urls.push(wrapUrl(`/blog/${post.slug}`, post.published_at?.toISOString()));
  }

  // Forum threads
  const [threads] = await db.query(`
    SELECT id, category_id, created_at 
    FROM forum_threads 
    WHERE deleted = 0 AND is_private = 0
  `);
  const [categories] = await db.query("SELECT id, slug FROM forum_categories");
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.slug]));

  for (const thread of threads) {
    const slug = categoryMap[thread.category_id];
    if (slug) {
      urls.push(wrapUrl(`/forums/category/${slug}/thread/${thread.id}`, thread.created_at?.toISOString()));
    }
  }

  // Final sitemap content
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes.map(route => wrapUrl(route)).join("\n")}
${urls.join("\n")}
</urlset>`;

  const outputPath = path.join(__dirname, "..", "frontend", "public", "sitemap.xml");
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    console.log("📁 Creating directory:", outputDir);
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, sitemapContent.trim());
  console.log(`✅ Sitemap written to ${outputPath} (${staticRoutes.length + urls.length} URLs)`);

  await db.end();
}
