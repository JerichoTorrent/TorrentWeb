import express from "express";
import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
} from "discord.js";
import dotenv from "dotenv";
import fetch from "node-fetch";
import * as r2 from "./utils/r2.js";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import { sendVerdictEmail } from "./email.js";
import parseDuration from "./utils/parseDuration.js";
import requireAuth from "./middleware/authMiddleware.js";

dotenv.config();

const {
  DISCORD_BOT_TOKEN,
  DISCORD_GUILD_ID,
  DISCORD_CHANNEL_ID,
  DISCORD_MUTED_ROLE,
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_NAME,
  DB_PORT = 3306,
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI,
  JWT_SECRET
} = process.env;

if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID || !DISCORD_CHANNEL_ID) {
  console.error("❌ Missing Discord bot config in .env");
  process.exit(1);
}

function insertUuidDashes(uuid) {
  if (!uuid || uuid.length !== 32) return uuid;
  return uuid.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
}

const router = express.Router();
const app = globalThis.__app || express();

export const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

await discordClient.login(DISCORD_BOT_TOKEN);
console.log("✅ Discord bot logged in");

router.get("/discord/preview", async (req, res) => {
  try {
    const response = await fetch(`https://discord.com/api/guilds/${DISCORD_GUILD_ID}/preview`, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
    });
    res.json(await response.json());
  } catch (err) {
    console.error("❌ Discord preview fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch Discord preview." });
  }
});

router.get("/discord/check-link", requireAuth, async (req, res) => {
  try {
    const conn = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME, port: DB_PORT });
    const [[user]] = await conn.execute("SELECT discord_id FROM users WHERE uuid = ?", [req.user.uuid]);
    await conn.end();
    res.setHeader("Cache-Control", "no-store");
    res.json({ linked: !!user?.discord_id });
  } catch (err) {
    console.error("❌ Discord link check failed:", err);
    res.status(500).json({ error: "Failed to check Discord link." });
  }
});

router.get("/auth/discord", (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send("Missing token");

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify",
    state: token
  });

  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

router.get("/auth/discord/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).send("Missing code or token");

  let user;
  try {
    user = jwt.verify(state, JWT_SECRET);
  } catch (err) {
    console.error("⚠ JWT verification failed:", err);
    return res.status(403).send("Invalid token");
  }

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: DISCORD_REDIRECT_URI
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("Failed to get access token");

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const discordUser = await userRes.json();
    if (!discordUser.id) throw new Error("Failed to get user info");

    const formattedUuid = insertUuidDashes(user.uuid);

    const conn = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME, port: DB_PORT });
    await conn.execute("UPDATE users SET discord_id = ? WHERE uuid = ?", [discordUser.id, formattedUuid]);
    await conn.end();

    res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Discord Linked</title></head><body style="background-color:#121212;color:white;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;"><h1>✅ Discord Linked</h1><p>You may now close this window.</p><script>if (window.opener) window.opener.postMessage({type:"DISCORD_LINKED"},window.location.origin);setTimeout(()=>window.close(),500);</script></body></html>`);
  } catch (err) {
    console.error("❌ Discord OAuth failed:", err);
    return res.status(500).send("Discord login failed");
  }
});

discordClient.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const [action, appealId] = interaction.customId.split(":");
  const staffUser = interaction.user.username;
  const statusMap = { accept: "accepted", deny: "denied", modify: "modified" };

  try {
    const conn = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME, port: DB_PORT });
    const [[appeal]] = await conn.execute("SELECT * FROM appeals WHERE id = ?", [appealId]);
    if (!appeal || appeal.status !== "pending") {
      await interaction.reply({
        content: "This appeal has already been processed.",
        flags: 1 << 6
      });
      await conn.end();
      return;
    }

    if (appeal.files) {
      let files = [];
      try {
        const parsed = JSON.parse(appeal.files);
        files = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        files = [appeal.files];
      }
      const deleted = await Promise.all(
        files.map(async (fileUrl) => {
          if (typeof fileUrl !== "string") return;
      
          const rawName = fileUrl.split("/").pop()?.split("?")[0]; // Handles any query params
          if (!rawName) return;
      
          console.log(`🗑 Attempting to delete R2 file: ${rawName}`);
          try {
            await r2.deleteFile(rawName);
            console.log(`✅ Deleted: ${rawName}`);
          } catch (err) {
            console.error(`❌ Failed to delete ${rawName}:`, err);
          }
        })
      );      
    }

    if (action === "modify") {
      await interaction.reply({
        content: "✏ Enter new punishment duration (e.g. `2d`, `1w`):",
        flags: 1 << 6
      });

      const filter = m => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

      collector.on("collect", async (msg) => {
        const expiresAt = parseDuration(msg.content);
        if (!expiresAt) {
          await interaction.followUp({
            content: "❌ Invalid duration format.",
            flags: 1 << 6
          });
          await conn.end();
          return;
        }

        await conn.execute(
          `UPDATE appeals SET status = ?, verdict_message = ?, decided_by = ?, decided_at = NOW() WHERE id = ?`,
          [statusMap[action], `Modified by ${staffUser} — Expires ${expiresAt.toISOString()}`, staffUser, appealId]
        );

        const [[user]] = await conn.execute("SELECT email, username FROM users WHERE uuid = ?", [appeal.uuid]);
        if (user?.email) {
          await sendVerdictEmail(user.email, user.username, statusMap[action], appeal.type, `Modified by ${staffUser} — Expires ${expiresAt.toISOString()}`);
        }

        if (appeal.type === "discord") {
          const guild = await discordClient.guilds.fetch(DISCORD_GUILD_ID);
          const member = await guild.members.fetch(appeal.discord_id).catch(() => null);
          if (member) {
            const timeoutMs = expiresAt.getTime() - Date.now();
            await member.timeout(timeoutMs).catch(() => {});
          }
        }

        await updateAppealPanel(appealId, staffUser, statusMap[action]);
        await interaction.followUp({
          content: `✅ Appeal modified to expire <t:${Math.floor(expiresAt.getTime() / 1000)}:R>.`,
          flags: 1 << 6
        });
        await conn.end();
      });

      return;
    }

    if (appeal.type === "discord" && action === "accept") {
      const guild = await discordClient.guilds.fetch(DISCORD_GUILD_ID);
      const member = await guild.members.fetch(appeal.discord_id).catch(() => null);
      if (member && DISCORD_MUTED_ROLE) {
        await member.roles.remove(DISCORD_MUTED_ROLE);
      }
    }

    await conn.execute(
      `UPDATE appeals SET status = ?, verdict_message = ?, decided_by = ?, decided_at = NOW() WHERE id = ?`,
      [statusMap[action], `${action.charAt(0).toUpperCase() + action.slice(1)} by ${staffUser}`, staffUser, appealId]
    );

    const [[user]] = await conn.execute("SELECT email, username FROM users WHERE uuid = ?", [appeal.uuid]);
    if (user?.email) {
      await sendVerdictEmail(user.email, user.username, statusMap[action], appeal.type, `${action.charAt(0).toUpperCase() + action.slice(1)} by ${staffUser}`);
    }

    await updateAppealPanel(appealId, staffUser, statusMap[action]);
    await interaction.reply({
      content: `✅ Appeal ${statusMap[action]} successfully.`,
      flags: 1 << 6
    });
    await conn.end();
  } catch (err) {
    console.error("❌ Failed to process appeal:", err);
    await interaction.reply({
      content: "❌ Failed to process appeal.",
      flags: 1 << 6
    });
  }
});

async function updateAppealPanel(appealId, staffUser, status) {
  try {
    const channel = await discordClient.channels.fetch(DISCORD_CHANNEL_ID);
    if (!channel.isTextBased()) return;

    const messages = await channel.messages.fetch({ limit: 100 });
    const panelMessage = messages.find(msg => {
      const embed = msg.embeds?.[0];
      const found = embed?.footer?.text?.includes(`Appeal ID: ${appealId}`);
      if (found) console.log(`🔍 Found appeal panel message: ${msg.id}`);
      return found;
    });

    if (!panelMessage) {
      console.warn(`⚠ Could not find appeal panel message for ID ${appealId}`);
      return;
    }

    const embed = panelMessage.embeds[0];
    const updatedEmbed = {
      ...embed.toJSON(),
      color: status === "accepted" ? 0x00ff00 : status === "denied" ? 0xff0000 : 0x3498db,
      fields: embed.fields.map(field =>
        field.name === "Status"
          ? { ...field, value: `${status.toUpperCase()} by ${staffUser}` }
          : field
      )
    };

    await panelMessage.edit({
      embeds: [updatedEmbed],
      components: [] // Removes buttons
    });
    console.log(`✅ Embed updated for appeal ID ${appealId}`);

  } catch (err) {
    console.error("❌ Failed to update Discord panel:", err);
  }
}

app.use("/api", router);
export default router;