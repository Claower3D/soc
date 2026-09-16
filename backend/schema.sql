-- =============================================================================
-- ПОЛНАЯ СХЕМА БАЗЫ ДАННЫХ ПЛАТФОРМЫ NEW AGE (POSTGRESQL)
-- Совместима с Railway, Render, Supabase, Neon, AWS RDS, локальным PostgreSQL
-- =============================================================================

-- Включение расширений (если поддерживаются)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. ПОЛЬЗОВАТЕЛИ И ПРОФИЛИ (USERS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email_or_phone VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    cover_image TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    website TEXT DEFAULT '',
    location TEXT DEFAULT '',
    birth_date VARCHAR(50) DEFAULT '',
    zodiac_sign VARCHAR(50) DEFAULT '',
    eastern_zodiac VARCHAR(50) DEFAULT '',
    gender VARCHAR(30) DEFAULT 'hidden',
    show_birth_date BOOLEAN DEFAULT TRUE,
    show_zodiac BOOLEAN DEFAULT TRUE,
    role VARCHAR(50) DEFAULT 'user',               -- user, creator, business, admin, expert, critic
    belief_type VARCHAR(100) DEFAULT '',          -- Религия / мировоззрение
    belief_privacy VARCHAR(50) DEFAULT 'public',  -- public, followers, private
    verified BOOLEAN DEFAULT FALSE,
    consciousness_level INT DEFAULT 1,            -- Класс сознания от 1 до 11
    consciousness_title VARCHAR(100) DEFAULT 'Странник',
    cognition_vector VARCHAR(50) DEFAULT 'spiritual',
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    critics_count INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    balance NUMERIC(15, 2) DEFAULT 0.00,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    sales_count INT DEFAULT 0,
    online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email_or_phone ON users(email_or_phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_belief ON users(belief_type);

-- Безопасное добавление колонок на случай обновления старой таблицы
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date VARCHAR(50) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS zodiac_sign VARCHAR(50) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS eastern_zodiac VARCHAR(50) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(30) DEFAULT 'hidden';
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_birth_date BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_zodiac BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_image TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS consciousness_level INT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consciousness_title VARCHAR(100) DEFAULT 'Странник';
ALTER TABLE users ADD COLUMN IF NOT EXISTS cognition_vector VARCHAR(50) DEFAULT 'spiritual';
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance NUMERIC(15, 2) DEFAULT 0.00;

-- =============================================================================
-- 2. ПОДПИСКИ И КРИТИКА (USER RELATIONSHIPS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_relationships (
    id VARCHAR(64) PRIMARY KEY,
    follower_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rel_type VARCHAR(30) NOT NULL DEFAULT 'follow', -- 'follow' (подписка) или 'critic' (критика)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, target_id, rel_type)
);

CREATE INDEX IF NOT EXISTS idx_rel_follower ON user_relationships(follower_id);
CREATE INDEX IF NOT EXISTS idx_rel_target ON user_relationships(target_id);

-- =============================================================================
-- 3. АКТУАЛЬНОЕ В ПРОФИЛЕ (HIGHLIGHTS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_highlights (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    cover TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_highlights_user ON user_highlights(user_id);

-- =============================================================================
-- 4. ПОСТЫ В ЛЕНТЕ (POSTS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    caption TEXT DEFAULT '',
    location VARCHAR(255) DEFAULT '',
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);

-- Лайки постов
CREATE TABLE IF NOT EXISTS post_likes (
    post_id VARCHAR(64) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- Сохраненные посты (Закладки)
CREATE TABLE IF NOT EXISTS post_saves (
    post_id VARCHAR(64) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- Комментарии к постам
CREATE TABLE IF NOT EXISTS post_comments (
    id VARCHAR(64) PRIMARY KEY,
    post_id VARCHAR(64) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id VARCHAR(64) REFERENCES post_comments(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON post_comments(post_id);

-- =============================================================================
-- 5. ИСТОРИИ (STORIES - 24 часа)
-- =============================================================================
CREATE TABLE IF NOT EXISTS stories (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    is_video BOOLEAN DEFAULT FALSE,
    is_live BOOLEAN DEFAULT FALSE,
    filter VARCHAR(50) DEFAULT '',
    text_content TEXT DEFAULT '',
    text_position VARCHAR(20) DEFAULT 'bottom',
    viewers_count INT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 HOURS'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);

-- Просмотры историй
CREATE TABLE IF NOT EXISTS story_views (
    story_id VARCHAR(64) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction VARCHAR(50) DEFAULT '',
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (story_id, user_id)
);

-- =============================================================================
-- 6. ЧАТЫ И МЕССЕНДЖЕР (CHATS & MESSAGES)
-- =============================================================================
CREATE TABLE IF NOT EXISTS chats (
    id VARCHAR(64) PRIMARY KEY,
    is_group BOOLEAN DEFAULT FALSE,
    is_channel BOOLEAN DEFAULT FALSE,
    title VARCHAR(255) DEFAULT '',
    avatar TEXT DEFAULT '',
    owner_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    conference_id VARCHAR(64) DEFAULT '',
    theme_id VARCHAR(50) DEFAULT 'default',
    pin_code VARCHAR(20) DEFAULT '',
    is_locked BOOLEAN DEFAULT FALSE,
    last_message TEXT DEFAULT '',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chats_last_msg ON chats(last_message_at DESC);

-- Участники чата / настройки диалога
CREATE TABLE IF NOT EXISTS chat_members (
    chat_id VARCHAR(64) NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(30) DEFAULT 'member', -- owner, admin, member
    is_pinned BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_important BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    tag_id VARCHAR(50) DEFAULT '',
    unread_count INT DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_members_user ON chat_members(user_id);

-- Сообщения
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    chat_id VARCHAR(64) NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reply_to_id VARCHAR(64) REFERENCES messages(id) ON DELETE SET NULL,
    text TEXT DEFAULT '',
    media_url TEXT DEFAULT '',
    media_type VARCHAR(50) DEFAULT '', -- image, voice, video_note, sticker, file, product, poll
    voice_duration VARCHAR(20) DEFAULT '',
    sticker_url TEXT DEFAULT '',
    file_name VARCHAR(255) DEFAULT '',
    file_size VARCHAR(50) DEFAULT '',
    poll_data JSONB DEFAULT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, read
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Реакции на сообщения
CREATE TABLE IF NOT EXISTS message_reactions (
    id VARCHAR(64) PRIMARY KEY,
    message_id VARCHAR(64) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- =============================================================================
-- 7. ВИДЕОХОСТИНГ И КЛИПЫ (VIDEOS & CLIPS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS videos (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    thumbnail TEXT NOT NULL,
    video_url TEXT NOT NULL,
    duration VARCHAR(20) NOT NULL,
    views_count BIGINT DEFAULT 0,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_user ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at DESC);

-- Клипы (короткие вертикальные видео)
CREATE TABLE IF NOT EXISTS clips (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    poster TEXT NOT NULL,
    caption TEXT DEFAULT '',
    music_title VARCHAR(255) DEFAULT '',
    music_author VARCHAR(255) DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    views_count BIGINT DEFAULT 0,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clips_user ON clips(user_id);

-- =============================================================================
-- 8. ПОДКАСТЫ И МУЗЫКА (PODCASTS & MUSIC)
-- =============================================================================
CREATE TABLE IF NOT EXISTS podcasts (
    id VARCHAR(64) PRIMARY KEY,
    author_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    cover TEXT NOT NULL,
    description TEXT DEFAULT '',
    episodes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS podcast_episodes (
    id VARCHAR(64) PRIMARY KEY,
    podcast_id VARCHAR(64) NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    audio_url TEXT NOT NULL,
    duration VARCHAR(20) NOT NULL,
    published_date VARCHAR(50) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_episodes_podcast ON podcast_episodes(podcast_id);

-- Музыкальные треки
CREATE TABLE IF NOT EXISTS music_tracks (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    audio_url TEXT NOT NULL,
    cover TEXT DEFAULT '',
    duration VARCHAR(20) NOT NULL,
    genre VARCHAR(100) DEFAULT '',
    plays_count BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 9. ВИДЕОКОНФЕРЕНЦИИ И ЗВОНКИ (CONFERENCES & CALLS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS conferences (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    host_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_code VARCHAR(50) UNIQUE NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) DEFAULT 'scheduled', -- live, scheduled, ended
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    scheduled_time TIMESTAMP WITH TIME ZONE,
    has_recording BOOLEAN DEFAULT FALSE,
    recording_duration VARCHAR(20) DEFAULT '',
    recording_thumbnail TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 10. МАРКЕТПЛЕЙС И УСЛУГИ (MARKETPLACE)
-- =============================================================================
CREATE TABLE IF NOT EXISTS marketplace_products (
    id VARCHAR(64) PRIMARY KEY,
    seller_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    price NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT '₽',
    item_type VARCHAR(30) DEFAULT 'product', -- product, service
    category VARCHAR(100) DEFAULT 'general',
    image_url TEXT DEFAULT '',
    images TEXT[] DEFAULT '{}',
    rating NUMERIC(3, 2) DEFAULT 5.00,
    sales_count INT DEFAULT 0,
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON marketplace_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace_products(category);

-- =============================================================================
-- 11. СООБЩЕСТВА И КЛУБЫ (COMMUNITIES)
-- =============================================================================
CREATE TABLE IF NOT EXISTS communities (
    id VARCHAR(64) PRIMARY KEY,
    creator_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    cover TEXT DEFAULT '',
    category VARCHAR(100) DEFAULT '',
    members_count INT DEFAULT 1,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_members (
    community_id VARCHAR(64) NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(30) DEFAULT 'member', -- owner, admin, member
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (community_id, user_id)
);

-- =============================================================================
-- 12. КОШЕЛЕК И ТРАНЗАКЦИИ (WALLET & TRANSACTIONS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- deposit, transfer, withdrawal, purchase, cashout
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT '₽',
    status VARCHAR(30) DEFAULT 'completed', -- pending, completed, rejected
    recipient_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON wallet_transactions(user_id);

-- =============================================================================
-- 13. УВЕДОМЛЕНИЯ (NOTIFICATIONS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- like, comment, follow, critic, mention, call, message
    title VARCHAR(255) NOT NULL,
    body TEXT DEFAULT '',
    link TEXT DEFAULT '',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
