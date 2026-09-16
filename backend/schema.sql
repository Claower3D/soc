-- =========================================================
-- Схема базы данных New Age Platform (PostgreSQL)
-- Выполните этот скрипт в консоли Railway -> Postgres -> Query
-- =========================================================

-- 1. Таблица пользователей и аккаунтов
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email_or_phone VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    avatar TEXT,
    cover_image TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    website TEXT DEFAULT '',
    location TEXT DEFAULT '',
    birth_date VARCHAR(50) DEFAULT '',
    zodiac_sign VARCHAR(50) DEFAULT '',
    role VARCHAR(50) DEFAULT 'user',
    belief_type VARCHAR(100) DEFAULT '',
    belief_privacy VARCHAR(50) DEFAULT 'public',
    verified BOOLEAN DEFAULT FALSE,
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    critics_count INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска при логине и поиске пользователей
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email_or_phone ON users(email_or_phone);

-- Дополнительные колонки, если таблица создана ранее без них
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date VARCHAR(50) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS zodiac_sign VARCHAR(50) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_image TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';

-- 2. Таблица постов ленты
CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    image TEXT,
    caption TEXT,
    likes INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

-- 3. Таблица сообщений мессенджера
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    chat_id VARCHAR(64) NOT NULL,
    sender_id VARCHAR(64) NOT NULL,
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
