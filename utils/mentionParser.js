import db from "../utils/db.js";

export async function extractMentions(content) {
  const mentionRegex = /@(\w{3,16})/g;
  const mentions = new Set();

  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.add(match[1]);
  }

  if (mentions.size === 0) return [];

  const usernames = [...mentions];

  const [rows] = await db.query(
    `SELECT username, uuid FROM users WHERE username IN (?)`,
    [usernames]
  );

  return rows; // [{ username, uuid }, ...]
}

export function linkifyMentions(content) {
  return content.replace(/@(\w{3,16})/g, (_, username) => {
    return `<a href="/dashboard/${username}" class="mention-link">@${username}</a>`;
  });
}
