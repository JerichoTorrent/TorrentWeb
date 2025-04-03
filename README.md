![Lines of Code](https://raw.githubusercontent.com/JerichoTorrent/TorrentWeb/badges/badge.svg)

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

## 🛠️ Getting Started

### 1. Clone the Repo  

```
git clone https://github.com/JerichoTorrent/TorrentWeb.git
cd TorrentWeb
```

### 2. Dependencies

- Node.js & npm
- MySQL or another Database server
- A brain
- A code editor of your choice (VSCode, Intellij, etc.)
- Litebans with MySQL storage option
- Bluemap or another live map reverse proxy application
- Cloudflare R2 bucket for sandboxed storage; trust me this is important for content moderation. You don't frontend uploaded files on your server.
- A [Discord bot](https://discord.com/developers/applications)
- OpenAI API key (Content Moderation API calls are free!)
Once you have the project cloned and are `cd`ed into the project files, run `npm install` and theoretically you're good to go, but if I screwed up the package.json then you're on your own with this one.

### 3. Environment Variables  

Create a file in root called `.env` and edit it. Input the following:

```
# Server config. Port is usually the default React/node.js port and the frontend URL is *usually* the same as your backend.
PORT=3000
FRONTEND_URL=

# MySQL config
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=
DB_PORT=

# JWT Secret Key, can be anything but generate something secure
JWT_SECRET=

# Email config. Create a Brevo account and go to SMTP settings. Verify your domain and create a sender email

EMAIL_USER=
EMAIL_PASS=
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_SENDAS=

# Backend URL needs to be https for CORS to work on strict browsers
BACKEND_URL=

# Discord
DISCORD_GUILD_ID=
DISCORD_BOT_TOKEN=
DISCORD_CHANNEL_ID=
DISCORD_MUTED_ROLE=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=

# Litebans DB config
LITEBANS_DB_HOST=
LITEBANS_DB_PORT=
LITEBANS_DB_NAME=
LITEBANS_DB_USER=
LITEBANS_DB_PASS=

# OpenAI Moderation
OPENAI_API_KEY=

# Cloudflare R2 | Cloudflare Dashboard -> R2 Object Storage
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=
R2_BUCKET=
R2_PUBLIC_URL=
```

Create ANOTHER .env in /frontend:
```
VITE_API_BASE_URL=
VITE_MCSTATUS_URL=
VITE_DISCORD_URL=
VITE_DISCORD_CLIENT_ID=
VITE_DISCORD_REDIRECT_URI=
```
So as you can see from the above, there's a bit of configuring to do. You will need to:
- Create a database (explained later)
- Generate a JWT secret key. That's easy, just run the command `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` and copy the output
- Create Brevo account, add a verified email, then copy your SMTP settings.
- Create a [Discord bot](https://discord.com/developers/applications) and give it necessary permissions. This is required for the Discord preview in the header as well as the appeal system. All the logic is in bot.js, which is intended to run alongside your web app. Invite it to your server.
- Create an R2 storage bucket. Be smart and turn on Cloudflare CSAM monitoring as well.

Run the following commands in your MySQL server:
```
CREATE DATABASE <database_name>;
USE <database_name>;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  username VARCHAR(16) NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  session_token VARCHAR(255) NULL
);
CREATE TABLE votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  site_name VARCHAR(255) NOT NULL,
  vote_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE forum_threads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(uuid)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
CREATE TABLE forum_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  thread_id INT NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(uuid) ON DELETE CASCADE
);
CREATE TABLE blog_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_slug VARCHAR(255),
  uuid VARCHAR(36), -- from auth system
  username VARCHAR(16),
  content TEXT,
  parent_id INT, -- nullable
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE blog_reactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_slug VARCHAR(255),
  uuid VARCHAR(36),
  type ENUM('like', 'love', 'fire', 'laugh', 'wow'), -- emoji set
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE appeals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL,
  username VARCHAR(32) NOT NULL,
  discord_id VARCHAR(32), -- nullable if not linked
  type ENUM('minecraft-ban', 'minecraft-mute', 'discord') NOT NULL,
  message TEXT NOT NULL,
  files JSON, -- array of uploaded file URLs
  status ENUM('pending', 'accepted', 'denied', 'modified') DEFAULT 'pending',
  verdict_message TEXT, -- optional staff message
  decided_by VARCHAR(32), -- username or staff ID
  decided_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 4. Deployment  

1. Run `npm run build` in `/frontend`
2. Your Express server will serve the static frontend from `/frontend/dist`
3. Use a [Cloudflare Zero Trust](https://developers.cloudflare.com/cloudflare-one/) tunnel to expose both frontend + backend.

### 5. Adding New Pages  

Obviously as it is now, it's quite unfinished and even when it is finished, you will want to tweak it to your liking and add new content for SEO and other purposes. To create a new page, add a file in /frontend/src/pages and name it <Your_page_name>.tsx. Code the page in typescript and ensure you're adding `export default <page_name>;` at the bottom. Then, edit App.tsx and import the page, i.e. `import <page> from "./pages/<page>";` and add the route to the App function like so: `<Route path="/<page_name>" element={<Page />} />`. You get the point. You'll also want to add the page to the NavItems in Navbar.tsx, both desktop and mobile.

### Notes  

- Pull requests are welcome if you want to tweak anything or add a new feature. Hell, I would love some help building out the forum.
- The blog was my idea for a full-from-scratch integration of a markdown-style blog. I originally pushed my blog site <https://blog.torrentsmp.com> but wanted it to link internally, which is not possible with an RSS feed, so I rebuilt the whole module from scratch. You can write markdown files in /src/content/blog and they will automatically be routed. Make sure you include frontmatter or they will not parse. Use <!--more--> as a content separator for the post summary/RSS feed.
- The voting sites can easily be changed by altering the const in Vote.tsx
- I did not place an emphasis on making this "template-ready". This is MY website that I plan to push to production sometime within the next week or so, and it will never be a fully realized template. There WILL be a lot you need to change for your setup.
- The styling uses tailwind
- Blog.tsx is the page you see when you go to /blog, while BlogPost.tsx controls the styling of the markdown files you put in /frontend/src/content/blog
- If you use Bluemap, Dynmap, etc. just change the link in Map.tsx to your own
- Uploaded files are scanned by ClamAV and moderated via OpenAI before being saved
- Don't hate on my code. It worked on my machine.

### Credits  

If you use this template, please include the link to my site in the footer from our digital marketing partner. This is the only credit I'm asking for.  
Website: <https://torrentsmp.com>  
Discord: <https://discord.gg/torrent>  
Server IP: torrentsmp.com  
Read my blog: <https://blog.torrentsmp.com>  
Give me money: <https://patreon.com/torrentnetwork>  
Give me crypto (c'mon bro): 0x0b544473a05E6B703066129498F758C7e1268FD4
