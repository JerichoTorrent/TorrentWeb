# 🌩️ Torrent Network Website Template

This is a full-stack React + TypeScript template for Minecraft server websites with user login, blog, voting, account dashboard, and more. Originally designed for the Torrent Network, it's now available for anyone to fork and adapt.
---

## 🚀 Features  

- Minecraft username + password login (JWT-based)
- Email verification and auto-login flow using Brevo or another mailer of your choice
- Register, login, forgot password pages
- Blog with pagination and post rendering
- Vote page
- User dashboard (protected)
- Dynamic header with online player + Discord info
- Fully responsive dark UI with particle effects

---

## 📦 Tech Stack  

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + MySQL (not included in this repo)
- **Authentication**: JWT + Email magic link verification
- **Deployment-ready**: Vite + `.env` support

---

## 🛠️ Getting Started

### 1. Clone the Repo  

```
git clone https://github.com/JerichoTorrent/TorrentWeb.git
cd TorrentWeb
```

### 2. Dependencies

- Node.js
- MySQL or another Database server
- A brain
- A code editor of your choice (VSCode, Intellij, etc.)
Once you have the project cloned and are `cd`ed into the project files, run `npm install` and theoretically you're good to go, but if I screwed up the package.json then you're on your own with this one.

### 3. Environment Variables  

Create a file in root called `.env` and edit it. Input the following:

```
# Server config
PORT=3000
FRONTEND_URL=http://localhost:5173

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
EMAIL_HOST=
EMAIL_PORT=
EMAIL_SENDAS=

BACKEND_URL=http://localhost:3000

DISCORD_BOT_TOKEN=
```
So as you can see from the above, there's a bit of configuring to do. You will need to:
- Create a database (explained later)
- Generate a JWT secret key. That's easy, just run `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` and copy the output
- Create Brevo account, add a verified email, then copy your SMTP settings.
- Create a [Discord bot](https://discord.com/developers/applications) and copy the bot token. This is required for the Discord preview in the header.
The port is your server's backend port. There are files that rely on it so just leave it as 3000 if you're running on React's default port. You have to create a database server as a lot of things use the database, so read MySQL's docs or use ChatGPT. Run the following commands in your MySQL server:
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
    session_token VARCHAR(255) NULL;
);
CREATE TABLE bans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reason TEXT NOT NULL,
    banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
```

### 4. Local Deployment  

To deploy this project locally just do `npm run dev` in the frontend folder, then `node index.js` in the backend (root). Then your backend will be accessible at `localhost:3000` and frontend on `localhost:5173`. However, the blog functionality does not work if the user is only exposed to the frontend. So, best practice, just push straight to prod, `npm run build` (in the frontend folder), then `node index.js` in the backend (root).

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
- Don't hate on my code. It worked on my machine.

### Credits  

If you use this template, please include the link to my site in the footer (that I will code.. eventually). This is the only credit I'm asking for.
Website: <https://torrentsmp.com>
Discord: <https://discord.gg/torrent>
Server IP: torrentsmp.com
Read my blog: <https://blog.torrentsmp.com>
Give me money: <https://patreon.com/torrentnetwork>
Give me crypto (c'mon bro): 0x0b544473a05E6B703066129498F758C7e1268FD4
