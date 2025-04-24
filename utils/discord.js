import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";
import { S3Client } from "@aws-sdk/client-s3";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration
  ]
});

client.login(process.env.DISCORD_BOT_TOKEN);

// R2 S3 setup
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

export async function sendAppealPanel({ id, type, username, message, files, uuid }) {
  try {
    const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle(`📝 ${type.replace("-", " ").toUpperCase()} Appeal`)
      .setDescription(`**User:** ${username}\n**UUID:** ${uuid}\n\n**Message:**\n${message}`)
      .setColor(0x9b59b6)
      .setTimestamp()
      .setFooter({ text: `Appeal ID: ${id}` });

    files.forEach((url, i) => {
      embed.addFields({
        name: `Attachment #${i + 1}`,
        value: `[View File](${url})`
      });
    });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`accept:${id}`)
        .setLabel("✅ Accept Appeal")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`deny:${id}`)
        .setLabel("⛔ Deny Appeal")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`modify:${id}`)
        .setLabel("✏ Modify Appeal")
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await channel.send({ embeds: [embed], components: [buttons] });

    await msg.startThread({
      name: `${username}'s Appeal`,
      autoArchiveDuration: 1440
    });
  } catch (err) {
    console.error("Failed to send appeal panel to Discord:", err);
  }
}

export async function checkDiscordPunishment(discordId) {
  try {
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
    const bans = await guild.bans.fetch().catch(() => new Map());

    if (bans.has(discordId)) {
      return { active: true, type: "ban" };
    }

    const member = await guild.members.fetch(discordId).catch(() => null);
    if (!member) return { active: false };

    if (
      member.communicationDisabledUntilTimestamp &&
      member.communicationDisabledUntilTimestamp > Date.now()
    ) {
      return { active: true, type: "timeout" };
    }

    const mutedRoleId = process.env.DISCORD_MUTED_ROLE;
    if (mutedRoleId && member.roles.cache.has(mutedRoleId)) {
      return { active: true, type: "mute" };
    }

    return { active: false };
  } catch (err) {
    console.error("Discord punishment check failed:", err);
    return { active: false };
  }
}

export { client, s3 };
