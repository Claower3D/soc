-- =============================================================================
-- ПОЛНАЯ СХЕМА БАЗЫ ДАННЫХ ПЛАТФОРМЫ NEW AGE (POSTGRESQL)
-- Совместима с Railway, Render, Supabase, Neon, AWS RDS и локальным PostgreSQL
-- Модули:
--  1. Пользователи, профили, сессии и настройки (Users & Auth)
--  2. СМС-коды, верификация телефона и логи (SMS & Phone Auth)
--  3. Истории и актуальное (Stories & Highlights)
--  4. Посты, лента, медиа, лайки, закладки и комментарии (Posts & Feed)
--  5. Мессенджер, чаты, папки, сообщения, реакции, звонки и стикеры (Messenger)
--  6. Маркетплейс, категории, товары, корзина, заказы и отзывы (Marketplace)
--  7. Доставка еды, рестораны, блюда и заказы еды (Food Delivery)
--  8. Видеохостинг, клипы, музыка и подкасты (Media & Entertainment)
--  9. Видеоконференции, звонки и духовные консультации (Conferences & Spiritual)
-- 10. Сообщества, клубы и события (Communities & Events)
-- 11. Финансовый кошелек, транзакции, платные подписки (Wallet & Subscriptions)
-- 12. Уведомления, активность и модерация (Notifications & Moderation)
-- =============================================================================

-- Включение расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. ПОЛЬЗОВАТЕЛИ, ПРОФИЛИ, СЕССИИ И НАСТРОЙКИ (USERS & AUTH)
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
    country_code VARCHAR(10) DEFAULT 'RU',
    phone_number VARCHAR(50) DEFAULT '',
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
    default_currency VARCHAR(10) DEFAULT 'RUB',
    rating NUMERIC(3, 2) DEFAULT 5.00,
    sales_count INT DEFAULT 0,
    online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email_or_phone ON users(email_or_phone);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_belief ON users(belief_type);

-- Безопасное добавление колонок в users
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date VARCHAR(50) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS zodiac_sign VARCHAR(50) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS eastern_zodiac VARCHAR(50) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(30) DEFAULT 'hidden';
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_birth_date BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_zodiac BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_image TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT 'RU';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS consciousness_level INT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consciousness_title VARCHAR(100) DEFAULT 'Странник';
ALTER TABLE users ADD COLUMN IF NOT EXISTS cognition_vector VARCHAR(50) DEFAULT 'spiritual';
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_currency VARCHAR(10) DEFAULT 'RUB';

-- Активные сессии пользователя и устройства
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_name VARCHAR(150) DEFAULT '',
    ip_address VARCHAR(45) DEFAULT '',
    country VARCHAR(100) DEFAULT '',
    user_agent TEXT DEFAULT '',
    is_revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);

-- Персональные настройки пользователя
CREATE TABLE IF NOT EXISTS user_settings (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(30) DEFAULT 'system',
    default_currency VARCHAR(10) DEFAULT 'RUB',
    language VARCHAR(10) DEFAULT 'ru',
    notify_email BOOLEAN DEFAULT TRUE,
    notify_sms BOOLEAN DEFAULT TRUE,
    notify_push BOOLEAN DEFAULT TRUE,
    privacy_show_online BOOLEAN DEFAULT TRUE,
    privacy_show_read_receipts BOOLEAN DEFAULT TRUE,
    privacy_who_can_message VARCHAR(30) DEFAULT 'all', -- all, contacts, nobody
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Связи пользователей (подписки и критика)
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
-- 2. СМС-КОДЫ И ТЕЛЕФОННАЯ ВЕРИФИКАЦИЯ (SMS & PHONE AUTH)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sms_verifications (
    id VARCHAR(64) PRIMARY KEY,
    phone_number VARCHAR(50) NOT NULL,
    code VARCHAR(10) NOT NULL,
    purpose VARCHAR(50) NOT NULL DEFAULT 'login', -- login, register, reset_password, phone_bind
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_phone_code ON sms_verifications(phone_number, code);
CREATE INDEX IF NOT EXISTS idx_sms_expires ON sms_verifications(expires_at);

-- Логи отправки SMS через провайдеров
CREATE TABLE IF NOT EXISTS sms_logs (
    id VARCHAR(64) PRIMARY KEY,
    phone_number VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'sent', -- sent, delivered, failed
    provider VARCHAR(50) DEFAULT 'mock_gateway',
    provider_msg_id VARCHAR(100) DEFAULT '',
    error_message TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON sms_logs(phone_number);

-- =============================================================================
-- 3. ИСТОРИИ И АКТУАЛЬНОЕ (STORIES & HIGHLIGHTS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS stories (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    is_video BOOLEAN DEFAULT FALSE,
    is_live BOOLEAN DEFAULT FALSE,
    live_viewers INT DEFAULT 0,
    filter VARCHAR(50) DEFAULT '',
    mask VARCHAR(50) DEFAULT '',
    text_content TEXT DEFAULT '',
    text_position VARCHAR(20) DEFAULT 'bottom',
    gradient VARCHAR(100) DEFAULT '',
    viewers_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
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

-- Быстрые реакции на истории
CREATE TABLE IF NOT EXISTS story_reactions (
    id VARCHAR(64) PRIMARY KEY,
    story_id VARCHAR(64) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, user_id, emoji)
);

-- Ответы на истории в личные сообщения
CREATE TABLE IF NOT EXISTS story_replies (
    id VARCHAR(64) PRIMARY KEY,
    story_id VARCHAR(64) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_replies_story ON story_replies(story_id);

-- Актуальное (Highlights) в профиле
CREATE TABLE IF NOT EXISTS user_highlights (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    cover TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_highlights_user ON user_highlights(user_id);

-- Связка историй с актуальным
CREATE TABLE IF NOT EXISTS highlight_stories (
    highlight_id VARCHAR(64) NOT NULL REFERENCES user_highlights(id) ON DELETE CASCADE,
    story_id VARCHAR(64) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (highlight_id, story_id)
);

-- =============================================================================
-- 4. ПОСТЫ В ЛЕНТЕ, МЕДИА, ЛАЙКИ, ЗАКЛАДКИ И КОММЕНТАРИИ (POSTS & FEED)
-- =============================================================================
CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    caption TEXT DEFAULT '',
    location VARCHAR(255) DEFAULT '',
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    tags TEXT[] DEFAULT '{}',
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);

-- Дополнительные медиа-файлы поста (карусель)
CREATE TABLE IF NOT EXISTS post_media (
    id VARCHAR(64) PRIMARY KEY,
    post_id VARCHAR(64) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(30) DEFAULT 'image', -- image, video
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(post_id);

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
    folder_name VARCHAR(100) DEFAULT 'Все закладки',
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON post_comments(parent_id);

-- Лайки комментариев
CREATE TABLE IF NOT EXISTS comment_likes (
    comment_id VARCHAR(64) NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

-- Репосты постов
CREATE TABLE IF NOT EXISTS post_shares (
    id VARCHAR(64) PRIMARY KEY,
    post_id VARCHAR(64) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_chat_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Хэштеги
CREATE TABLE IF NOT EXISTS hashtags (
    id VARCHAR(64) PRIMARY KEY,
    tag VARCHAR(100) UNIQUE NOT NULL,
    posts_count INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag);

CREATE TABLE IF NOT EXISTS post_hashtags (
    post_id VARCHAR(64) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    hashtag_id VARCHAR(64) NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);

-- =============================================================================
-- 5. МЕССЕНДЖЕР, ЧАТЫ, СООБЩЕНИЯ, СТИКЕРЫ И ЗВОНКИ (MESSENGER & CHATS)
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
    is_system BOOLEAN DEFAULT FALSE,
    last_message TEXT DEFAULT '',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chats_last_msg ON chats(last_message_at DESC);

-- Участники чатов
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

-- Папки чатов (Все, Личные, Каналы, Работа, Группы)
CREATE TABLE IF NOT EXISTS chat_folders (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'Folder',
    order_index INT DEFAULT 0,
    filter_type VARCHAR(50) DEFAULT 'all', -- all, personal, groups, channels, unread
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_folders_user ON chat_folders(user_id);

-- Сообщения
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    chat_id VARCHAR(64) NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reply_to_id VARCHAR(64) REFERENCES messages(id) ON DELETE SET NULL,
    text TEXT DEFAULT '',
    media_url TEXT DEFAULT '',
    media_type VARCHAR(50) DEFAULT 'text', -- text, image, video, voice, video_note, file, sticker, poll, event, product, contact, document
    voice_duration VARCHAR(20) DEFAULT '',
    sticker_url TEXT DEFAULT '',
    gif_url TEXT DEFAULT '',
    file_name VARCHAR(255) DEFAULT '',
    file_size VARCHAR(50) DEFAULT '',
    poll_data JSONB DEFAULT NULL,
    event_data JSONB DEFAULT NULL,
    product_data JSONB DEFAULT NULL,
    contact_data JSONB DEFAULT NULL,
    conference_recording JSONB DEFAULT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, read
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Реакции на сообщения (эмодзи)
CREATE TABLE IF NOT EXISTS message_reactions (
    id VARCHAR(64) PRIMARY KEY,
    message_id VARCHAR(64) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Наборы стикеров (Sticker Packs)
CREATE TABLE IF NOT EXISTS sticker_packs (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    author_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    icon_url TEXT NOT NULL,
    is_official BOOLEAN DEFAULT FALSE,
    installs_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Стикеры
CREATE TABLE IF NOT EXISTS stickers (
    id VARCHAR(64) PRIMARY KEY,
    pack_id VARCHAR(64) NOT NULL REFERENCES sticker_packs(id) ON DELETE CASCADE,
    title VARCHAR(100) DEFAULT '',
    emoji VARCHAR(20) DEFAULT '',
    image_url TEXT NOT NULL,
    lottie_url TEXT DEFAULT '',
    is_animated BOOLEAN DEFAULT FALSE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stickers_pack ON stickers(pack_id);

-- Звонки (Аудио и Видео)
CREATE TABLE IF NOT EXISTS user_calls (
    id VARCHAR(64) PRIMARY KEY,
    caller_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id VARCHAR(64) REFERENCES chats(id) ON DELETE SET NULL,
    call_type VARCHAR(20) DEFAULT 'audio', -- audio, video
    status VARCHAR(30) DEFAULT 'completed', -- missed, declined, completed, busy, cancelled
    duration_seconds INT DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_calls_caller ON user_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_receiver ON user_calls(receiver_id);

-- =============================================================================
-- 6. МАРКЕТПЛЕЙС, ТОВАРЫ, КОРЗИНА И ЗАКАЗЫ (MARKETPLACE)
-- =============================================================================
CREATE TABLE IF NOT EXISTS marketplace_categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50) DEFAULT 'Tag',
    order_index INT DEFAULT 0
);

-- Товары маркетплейса
CREATE TABLE IF NOT EXISTS marketplace_products (
    id VARCHAR(64) PRIMARY KEY,
    seller_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    price NUMERIC(12, 2) NOT NULL,
    old_price NUMERIC(12, 2),
    currency VARCHAR(10) DEFAULT 'RUB',
    category VARCHAR(100) DEFAULT 'Все товары',
    rating NUMERIC(3, 2) DEFAULT 5.00,
    reviews_count INT DEFAULT 0,
    in_stock BOOLEAN DEFAULT TRUE,
    stock_count INT DEFAULT 10,
    item_type VARCHAR(30) DEFAULT 'product', -- product, service
    commission_percent NUMERIC(5, 2) DEFAULT 3.00,
    sales_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    image_url TEXT DEFAULT '',
    images TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    specs JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON marketplace_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_price ON marketplace_products(price);

-- Корзина покупателя
CREATE TABLE IF NOT EXISTS cart_items (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    selected_color VARCHAR(50) DEFAULT '',
    selected_size VARCHAR(50) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

-- Заказы товаров
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    buyer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RUB',
    status VARCHAR(30) DEFAULT 'pending', -- pending, paid, processing, shipped, delivered, cancelled
    payment_method VARCHAR(30) DEFAULT 'wallet', -- wallet, card, crypto
    delivery_address TEXT NOT NULL,
    contact_name VARCHAR(255) DEFAULT '',
    contact_phone VARCHAR(50) DEFAULT '',
    note TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Состав заказа (товары)
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64) REFERENCES marketplace_products(id) ON DELETE SET NULL,
    seller_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    quantity INT DEFAULT 1,
    image_url TEXT DEFAULT '',
    specs JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Отзывы на товары
CREATE TABLE IF NOT EXISTS product_reviews (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
    author_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id VARCHAR(64) REFERENCES orders(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT DEFAULT '',
    photos TEXT[] DEFAULT '{}',
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, author_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);

-- =============================================================================
-- 7. ДОСТАВКА ЕДЫ И РЕСТОРАНЫ (FOOD DELIVERY)
-- =============================================================================
CREATE TABLE IF NOT EXISTS food_restaurants (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cuisine VARCHAR(255) NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    delivery_time VARCHAR(50) DEFAULT '25-35 мин',
    min_order NUMERIC(10, 2) DEFAULT 500.00,
    free_delivery_threshold NUMERIC(10, 2) DEFAULT 800.00,
    cover_url TEXT NOT NULL,
    badge VARCHAR(100) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    address TEXT DEFAULT '',
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Блюда ресторанов
CREATE TABLE IF NOT EXISTS food_dishes (
    id VARCHAR(64) PRIMARY KEY,
    restaurant_id VARCHAR(64) NOT NULL REFERENCES food_restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    price NUMERIC(10, 2) NOT NULL,
    weight VARCHAR(50) DEFAULT '',
    calories VARCHAR(50) DEFAULT '',
    image_url TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- Пицца, Бургеры, Суши, Здоровая еда
    is_popular BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dishes_rest ON food_dishes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dishes_cat ON food_dishes(category);

-- Заказы еды
CREATE TABLE IF NOT EXISTS food_orders (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id VARCHAR(64) REFERENCES food_restaurants(id) ON DELETE SET NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(12, 2) DEFAULT 0.00,
    delivery_cost NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RUB',
    status VARCHAR(30) DEFAULT 'accepted', -- accepted, cooking, on_way, delivered, cancelled
    delivery_address TEXT NOT NULL,
    promo_code VARCHAR(50) DEFAULT '',
    payment_method VARCHAR(30) DEFAULT 'card',
    courier_name VARCHAR(100) DEFAULT '',
    courier_phone VARCHAR(50) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_orders_user ON food_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_food_orders_status ON food_orders(status);

-- =============================================================================
-- 8. МЕДИА: ВИДЕО, КЛИПЫ, МУЗЫКА И ПОДКАСТЫ (MEDIA & ENTERTAINMENT)
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

-- Клипы (короткие вертикальные видео Reels/TikTok-style)
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

-- Подкасты
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
-- 9. ВИДЕОКОНФЕРЕНЦИИ И ДУХОВНЫЕ ПРАКТИКИ (CONFERENCES & SPIRITUAL)
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

CREATE INDEX IF NOT EXISTS idx_conferences_host ON conferences(host_id);
CREATE INDEX IF NOT EXISTS idx_conferences_code ON conferences(invite_code);

-- Мастера и эксперты духовных практик
CREATE TABLE IF NOT EXISTS spiritual_masters (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    avatar TEXT NOT NULL,
    role VARCHAR(255) NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    reviews_count INT DEFAULT 0,
    price_rub NUMERIC(10, 2) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    slots TEXT[] DEFAULT '{}',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Запись на консультации к мастерам
CREATE TABLE IF NOT EXISTS master_bookings (
    id VARCHAR(64) PRIMARY KEY,
    master_id VARCHAR(64) NOT NULL REFERENCES spiritual_masters(id) ON DELETE CASCADE,
    client_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot_time VARCHAR(100) NOT NULL,
    session_theme TEXT DEFAULT '',
    price NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RUB',
    status VARCHAR(30) DEFAULT 'booked', -- booked, completed, cancelled
    room_url TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_master_bookings_client ON master_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_master_bookings_master ON master_bookings(master_id);

-- =============================================================================
-- 10. СООБЩЕСТВА, КЛУБЫ И СОБЫТИЯ (COMMUNITIES & EVENTS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS communities (
    id VARCHAR(64) PRIMARY KEY,
    creator_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    handle VARCHAR(100) UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    cover TEXT DEFAULT '',
    category VARCHAR(100) DEFAULT '',
    belief_category VARCHAR(100) DEFAULT '',
    members_count INT DEFAULT 1,
    is_private BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    rules TEXT[] DEFAULT '{}',
    chat_group_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communities_handle ON communities(handle);

-- Участники сообществ
CREATE TABLE IF NOT EXISTS community_members (
    community_id VARCHAR(64) NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(30) DEFAULT 'member', -- owner, admin, member
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (community_id, user_id)
);

-- События и встречи сообществ
CREATE TABLE IF NOT EXISTS community_events (
    id VARCHAR(64) PRIMARY KEY,
    community_id VARCHAR(64) NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    date VARCHAR(50) NOT NULL,
    time VARCHAR(50) NOT NULL,
    location TEXT NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    attendees_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_community ON community_events(community_id);

-- Участники события
CREATE TABLE IF NOT EXISTS event_attendees (
    event_id VARCHAR(64) NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

-- =============================================================================
-- 11. КОШЕЛЕК, ТРАНЗАКЦИИ, СПОНСОРСТВО (WALLET & SUBSCRIPTIONS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS wallet_accounts (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'RUB',
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Финансовые транзакции
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- deposit, transfer, donation, subscription, purchase, cashout, fee
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RUB',
    fee NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'completed', -- pending, completed, rejected, refunded
    recipient_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    description TEXT DEFAULT '',
    reference_id VARCHAR(64) DEFAULT '', -- ID заказа / подписки / доната
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recipient ON wallet_transactions(recipient_id);

-- Уровни платной подписки авторов (Спонсорство)
CREATE TABLE IF NOT EXISTS author_subscription_tiers (
    id VARCHAR(64) PRIMARY KEY,
    author_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    perks TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tiers_author ON author_subscription_tiers(author_id);

-- Активные подписки пользователей на авторов
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier_id VARCHAR(64) NOT NULL REFERENCES author_subscription_tiers(id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RUB',
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subs_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_author ON user_subscriptions(author_id);

-- =============================================================================
-- 12. УВЕДОМЛЕНИЯ И ЖАЛОБЫ (NOTIFICATIONS & MODERATION)
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- like, comment, follow, critic, mention, call, message, order, donation
    title VARCHAR(255) NOT NULL,
    body TEXT DEFAULT '',
    link TEXT DEFAULT '',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- Жалобы на контент (Модерация)
CREATE TABLE IF NOT EXISTS content_reports (
    id VARCHAR(64) PRIMARY KEY,
    reporter_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(30) NOT NULL, -- post, story, comment, message, product, user
    content_id VARCHAR(64) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    details TEXT DEFAULT '',
    status VARCHAR(30) DEFAULT 'pending', -- pending, reviewed, dismissed, banned
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON content_reports(status);

-- =============================================================================
-- 13. СИСТЕМНОЕ КЭШИРОВАНИЕ И БЫСТРОДЕЙСТВИЕ (SYSTEM CACHE & PERFORMANCE)
-- =============================================================================
CREATE TABLE IF NOT EXISTS system_cache (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    tag VARCHAR(100) DEFAULT 'general',             -- feed, stories, market, currency, user, geo
    ttl_seconds INT DEFAULT 3600,
    expires_at TIMESTAMP WITH TIME ZONE,
    hit_count BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_cache_tag ON system_cache(tag);
CREATE INDEX IF NOT EXISTS idx_system_cache_expires ON system_cache(expires_at);

-- Синхронизация клиентского оффлайн/онлайн кэша (Offline Sync)
CREATE TABLE IF NOT EXISTS client_cache_sync (
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cache_key VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    version INT DEFAULT 1,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, cache_key)
);

CREATE INDEX IF NOT EXISTS idx_cache_sync_user ON client_cache_sync(user_id);

