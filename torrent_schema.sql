-- TorrentWeb Database Schema Setup
-- Assumes database `torrent` already exists.

-- Drop all tables if they exist (disable FK checks first)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS blog_reactions;
DROP TABLE IF EXISTS blog_post_reactions;
DROP TABLE IF EXISTS blog_flags;
DROP TABLE IF EXISTS blog_comment_reactions;
DROP TABLE IF EXISTS blog_comment_flags;
DROP TABLE IF EXISTS blog_comments;
DROP TABLE IF EXISTS blog_posts;
DROP TABLE IF EXISTS forum_flags;
DROP TABLE IF EXISTS forum_reactions;
DROP TABLE IF EXISTS forum_uploads;
DROP TABLE IF EXISTS forum_posts;
DROP TABLE IF EXISTS forum_threads;
DROP TABLE IF EXISTS forum_categories;
DROP TABLE IF EXISTS appeals;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- USERS
CREATE TABLE users (
  uuid CHAR(36) NOT NULL PRIMARY KEY,
  username VARCHAR(32) NOT NULL UNIQUE,
  email VARCHAR(255),
  password_hash VARCHAR(255),
  is_staff TINYINT(1) DEFAULT 0,
  discord_id VARCHAR(32),
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  verified TINYINT(1) DEFAULT 0,
  verification_token VARCHAR(255),
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  token_expires_at DATETIME,
  reset_token VARCHAR(255),
  reset_expires DATETIME,
  last_login DATETIME DEFAULT NULL,
  twofa_method ENUM('totp', 'email') DEFAULT NULL,
  twofa_enabled BOOLEAN DEFAULT 0,
  twofa_secret VARCHAR(255) DEFAULT NULL;
  reputation INT DEFAULT 0,

  -- XP system fields
  total_xp INT DEFAULT 0,
  level INT DEFAULT 0,
  last_xp_gain DATETIME,
  xp_this_week INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FORUM CATEGORIES
CREATE TABLE forum_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  section VARCHAR(100),
  sort_order INT DEFAULT 0,
  slug VARCHAR(100) NOT NULL UNIQUE,
  staff_only TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FORUM THREADS
CREATE TABLE forum_threads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  is_sticky TINYINT(1) DEFAULT 0,
  deleted TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (category_id),
  KEY (user_id),
  FOREIGN KEY (category_id) REFERENCES forum_categories(id),
  FOREIGN KEY (user_id) REFERENCES users(uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FORUM POSTS
CREATE TABLE forum_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  thread_id INT NOT NULL,
  parent_id INT DEFAULT NULL,
  user_id CHAR(36) NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT,
  deleted TINYINT(1) DEFAULT 0,
  edited TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (thread_id),
  KEY (parent_id),
  KEY (user_id),
  FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES forum_posts(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FORUM REACTIONS
CREATE TABLE forum_reactions (
  post_id INT NOT NULL,
  user_id CHAR(36) NOT NULL,
  reaction ENUM('upvote','downvote') NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(uuid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FORUM FLAGS
CREATE TABLE forum_flags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id CHAR(36) NOT NULL,
  reason ENUM('inappropriate','harassment','doxxing','guidelines','exploits','other') NOT NULL,
  details TEXT,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (post_id),
  KEY (user_id),
  FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FORUM UPLOADS
CREATE TABLE forum_uploads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  image_url TEXT NOT NULL,
  upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  thread_id INT DEFAULT NULL,
  KEY (user_id),
  KEY (thread_id),
  FOREIGN KEY (user_id) REFERENCES users(uuid),
  FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BLOG POSTS
CREATE TABLE blog_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(64),
  published_at DATETIME,
  content TEXT,
  content_html TEXT,
  excerpt TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BLOG COMMENTS
CREATE TABLE blog_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(32),
  parent_id INT DEFAULT NULL,
  content TEXT,
  content_html TEXT,
  deleted TINYINT(1) DEFAULT 0,
  edited TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  edited_at DATETIME DEFAULT NULL,
  post_slug VARCHAR(255) NOT NULL,
  uuid CHAR(36) NOT NULL,
  KEY (parent_id),
  FOREIGN KEY (parent_id) REFERENCES blog_comments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BLOG COMMENT REACTIONS
CREATE TABLE blog_comment_reactions (
  comment_id INT NOT NULL,
  user_id CHAR(36) NOT NULL,
  reaction ENUM('upvote','downvote') NOT NULL,
  PRIMARY KEY (comment_id, user_id),
  FOREIGN KEY (comment_id) REFERENCES blog_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BLOG COMMENT FLAGS
CREATE TABLE blog_comment_flags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comment_id INT DEFAULT NULL,
  user_id CHAR(36) DEFAULT NULL,
  reason ENUM('inappropriate','harassment','doxxing','guidelines','exploits','other') NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES blog_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BLOG FLAGS (legacy?)
CREATE TABLE blog_flags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comment_id INT NOT NULL,
  user_uuid CHAR(36) NOT NULL,
  reason VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_flag (comment_id, user_uuid),
  FOREIGN KEY (comment_id) REFERENCES blog_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BLOG POST REACTIONS (emoji)
CREATE TABLE blog_post_reactions (
  post_slug VARCHAR(255) NOT NULL,
  user_uuid CHAR(36) NOT NULL,
  emoji VARCHAR(8) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_reaction (post_slug, user_uuid),
  FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BLOG REACTIONS (old version?)
CREATE TABLE blog_reactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comment_id INT NOT NULL,
  post_slug VARCHAR(255) NOT NULL,
  uuid CHAR(36) NOT NULL,
  type VARCHAR(16) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_reaction (comment_id, uuid),
  FOREIGN KEY (comment_id) REFERENCES blog_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (uuid) REFERENCES users(uuid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- APPEALS
CREATE TABLE appeals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL,
  type ENUM('minecraft-ban','minecraft-mute','discord') NOT NULL,
  message TEXT,
  extra TEXT,
  status ENUM('pending','accepted','denied','modified') DEFAULT 'pending',
  staff_uuid CHAR(36) DEFAULT NULL,
  decision_at TIMESTAMP NULL DEFAULT NULL,
  files JSON DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  username VARCHAR(32) NOT NULL,
  discord_id VARCHAR(32) DEFAULT NULL,
  verdict_message TEXT,
  decided_at DATETIME DEFAULT NULL,
  decided_by CHAR(36) DEFAULT NULL,
  KEY (uuid),
  KEY (staff_uuid),
  FOREIGN KEY (uuid) REFERENCES users(uuid),
  FOREIGN KEY (staff_uuid) REFERENCES users(uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;