# 🌩️ Torrent Network Website Template

This is a full-stack React + TypeScript template for Minecraft server websites with user login, blog, voting, account dashboard, and more. Originally designed for the Torrent Network, it's now available for anyone to fork and adapt.
---

## 🚀 Features  

- Minecraft username + password login system (JWT-based)
- Email verification with automatic login (via Brevo or other SMTP providers)
- Responsive dark theme with particle effects
- Blog system with Markdown post support, comments, and reactions
- Ban, mute, and kick listings with appeal buttons; much cleaner and more responsive that Litebans-next or Litebans-php
- Full-featured appeal system supporting:
  - Minecraft bans and mutes (Litebans)
  - Discord punishments (via Discord bot)
  - File uploads (docx, png, jpg) to Cloudflare R2
- Discord authentication and account linking
- IP-based rate limiting (Express)
- Live server status + Discord info in header
- Full dashboard with player info (XP, profile, tokens coming soon)

---

## 📦 Tech Stack  

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + MySQL (not included in this repo)
- **Authentication**: JWT + Email magic link verification
- **Storage**: Cloudflare R2 (for uploaded files)
- **Deployment-ready**: Vite + `.env` support

---

## 🛠️ Documentation

### Read the [wiki](https://github.com/JerichoTorrent/TorrentWeb/wiki) for a detailed user guide for installing and deploying this on your server.

## Credits  

If you use this template, please include the link to my site in the footer from our digital marketing partner. This is the only credit I'm asking for.  
Website: <https://torrentsmp.com>  
Discord: <https://discord.gg/torrent>  
Server IP: torrentsmp.com  
Read my blog: <https://blog.torrentsmp.com>  
Give me money: <https://patreon.com/torrentnetwork>  
Give me crypto (c'mon bro): 0x0b544473a05E6B703066129498F758C7e1268FD4