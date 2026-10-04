package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	_ "embed"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	mathrand "math/rand"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"
	"unicode"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

//go:embed schema.sql
var fullSchemaSQL string

// ==================== СИСТЕМА КЭШИРОВАНИЯ (CACHE PERSISTENCE) ====================

type CacheItem struct {
	Value     interface{} `json:"value"`
	ExpiresAt time.Time   `json:"expires_at"`
	CreatedAt time.Time   `json:"created_at"`
	Tag       string      `json:"tag"`
}

type ServerCache struct {
	mu     sync.RWMutex
	items  map[string]CacheItem
	hits   uint64
	misses uint64
}

var globalCache = &ServerCache{
	items: make(map[string]CacheItem),
}

// SMS-коды в памяти (фолбэк если нет БД)
type smsCodeEntry struct {
	Code      string
	Phone     string
	ExpiresAt time.Time
	SentAt    time.Time
	Attempts  int
}
var smsCodesStore sync.Map

func (c *ServerCache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	item, found := c.items[key]
	c.mu.RUnlock()

	if !found {
		atomic.AddUint64(&c.misses, 1)
		return nil, false
	}

	if !item.ExpiresAt.IsZero() && time.Now().After(item.ExpiresAt) {
		c.mu.Lock()
		delete(c.items, key)
		c.mu.Unlock()
		atomic.AddUint64(&c.misses, 1)
		return nil, false
	}

	atomic.AddUint64(&c.hits, 1)
	return item.Value, true
}

func (c *ServerCache) Set(key string, value interface{}, ttl time.Duration, tag string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	var exp time.Time
	if ttl > 0 {
		exp = time.Now().Add(ttl)
	}

	c.items[key] = CacheItem{
		Value:     value,
		ExpiresAt: exp,
		CreatedAt: time.Now(),
		Tag:       tag,
	}
}

func (c *ServerCache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items = make(map[string]CacheItem)
}

func (c *ServerCache) InvalidateTag(tag string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	for k, item := range c.items {
		if item.Tag == tag {
			delete(c.items, k)
		}
	}
}

func (c *ServerCache) Stats() map[string]interface{} {
	c.mu.RLock()
	defer c.mu.RUnlock()

	keys := make([]string, 0, len(c.items))
	for k := range c.items {
		keys = append(keys, k)
	}

	hits := atomic.LoadUint64(&c.hits)
	misses := atomic.LoadUint64(&c.misses)
	total := hits + misses
	hitRate := 0.0
	if total > 0 {
		hitRate = float64(hits) / float64(total) * 100.0
	}

	return map[string]interface{}{
		"cached_items_count": len(c.items),
		"keys":               keys,
		"hits":               hits,
		"misses":             misses,
		"hit_rate_percent":   fmt.Sprintf("%.1f%%", hitRate),
	}
}

// Response — стандартная обёртка для JSON-ответов API.
type Response struct {
	Status  string      `json:"status"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// HealthCheck — структура для ответа /api/health.
type HealthCheck struct {
	Uptime    string `json:"uptime"`
	Timestamp string `json:"timestamp"`
	Database  string `json:"database"`
	DBEnv     string `json:"dbEnv,omitempty"`
	DBError   string `json:"dbError,omitempty"`
}

// User — пользователь платформы New Age.
type User struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Username       string `json:"username"`
	Avatar         string `json:"avatar"`
	CoverImage     string `json:"coverImage,omitempty"`
	Bio            string `json:"bio,omitempty"`
	Location       string `json:"location,omitempty"`
	Website        string `json:"website,omitempty"`
	Online         bool   `json:"online"`
	LastSeen       string `json:"lastSeen,omitempty"`
	LastSeenText   string `json:"lastSeenText,omitempty"`
	IsFollowed     bool   `json:"isFollowed,omitempty"`
	IsFriend       bool   `json:"isFriend,omitempty"`
	Role           string `json:"role,omitempty"`
	BeliefType     string `json:"beliefType,omitempty"`
	BeliefPrivacy  string `json:"beliefPrivacy,omitempty"`
	Verified       bool   `json:"verified,omitempty"`
	BirthDate      string `json:"birthDate,omitempty"`
	Gender         string `json:"gender,omitempty"`
	ShowBirthDate  bool   `json:"showBirthDate,omitempty"`
	ShowZodiac     bool   `json:"showZodiac,omitempty"`
	FollowersCount int    `json:"followersCount"`
	FollowingCount int    `json:"followingCount"`
	FriendsCount   int    `json:"friendsCount"`
	CriticsCount   int    `json:"criticsCount,omitempty"`
	PostsCount     int    `json:"postsCount"`
	ClipsCount     int    `json:"clipsCount"`
}

// AccountStoreEntry — внутренняя запись пользователя с хешем пароля.
type AccountStoreEntry struct {
	User         User
	EmailOrPhone string
	PasswordHash string
	Salt         string
	CreatedAt    time.Time
}

// Comment — комментарий к публикации.
type Comment struct {
	ID        string    `json:"id"`
	User      User      `json:"user"`
	Text      string    `json:"text"`
	TimeAgo   string    `json:"timeAgo"`
	Likes     int       `json:"likes,omitempty"`
	Liked     bool      `json:"liked,omitempty"`
	CreatedAt time.Time `json:"createdAt,omitempty"`
}

// Post — пост в ленте.
type Post struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId,omitempty"`
	User      User      `json:"user"`
	Image     string    `json:"image"`
	Caption   string    `json:"caption"`
	Location  string    `json:"location,omitempty"`
	Likes     int       `json:"likes"`
	Liked     bool      `json:"liked"`
	Saved     bool      `json:"saved"`
	Comments  []Comment `json:"comments"`
	TimeAgo   string    `json:"timeAgo"`
	CreatedAt time.Time `json:"createdAt"`
}

// Video — видео.
type Video struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Channel     User   `json:"channel"`
	Thumbnail   string `json:"thumbnail"`
	Views       string `json:"views"`
	Duration    string `json:"duration"`
	TimeAgo     string `json:"timeAgo"`
	Description string `json:"description"`
}

// ChatPreview — превью чата.
type ChatPreview struct {
	ID          string `json:"id"`
	User        User   `json:"user"`
	LastMessage string `json:"lastMessage"`
	Time        string `json:"time"`
	Unread      int    `json:"unread"`
}

// Podcast — подкаст.
type Podcast struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Author      string    `json:"author"`
	Cover       string    `json:"cover"`
	Description string    `json:"description"`
	Episodes    []Episode `json:"episodes"`
}

// Episode — эпизод подкаста.
type Episode struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Duration string `json:"duration"`
	Date     string `json:"date"`
}

// Story — история (сторис).
type Story struct {
	ID           string `json:"id"`
	User         User   `json:"user"`
	Viewed       bool   `json:"viewed"`
	Image        string `json:"image,omitempty"`
	VideoURL     string `json:"videoUrl,omitempty"`
	MediaURL     string `json:"mediaUrl,omitempty"`
	Gradient     string `json:"gradient,omitempty"`
	IsLive       bool   `json:"isLive,omitempty"`
	LiveViewers  int    `json:"liveViewers,omitempty"`
	Filter       string `json:"filter,omitempty"`
	Mask         string `json:"mask,omitempty"`
	Text         string `json:"text,omitempty"`
	TextPosition string `json:"textPosition,omitempty"`
	Timestamp    string `json:"timestamp,omitempty"`
	MusicTrack   string `json:"musicTrack,omitempty"`
	ViewsCount   int    `json:"viewsCount,omitempty"`
	ExpiresAt    string `json:"expiresAt,omitempty"`
	CreatedAt    string `json:"createdAt,omitempty"`
}

func ensureUserAvatar(u *User) {
	if u == nil {
		return
	}
	trimmed := strings.TrimSpace(u.Avatar)
	if trimmed == "" || trimmed == "undefined" || trimmed == "null" || strings.Contains(trimmed, "dicebear") || strings.Contains(trimmed, "unsplash") {
		u.Avatar = "/default-avatar.svg"
	}
}

var startTime = time.Now()

// JWT Secret Key — ОБЯЗАТЕЛЬНО установите переменную JWT_SECRET в production!
var jwtSecretKey = func() []byte {
	k := os.Getenv("JWT_SECRET")
	if k == "" {
		// В production JWT_SECRET обязателен. При отсутствии генерируем случайный
		// (токены сбросятся при перезапуске — это намеренно для безопасности).
		randomBytes := make([]byte, 32)
		if _, err := rand.Read(randomBytes); err != nil {
			log.Fatal("FATAL: не удалось сгенерировать случайный JWT-ключ")
		}
		k = hex.EncodeToString(randomBytes)
		log.Println("⚠️ ВНИМАНИЕ: JWT_SECRET не задан! Сгенерирован случайный ключ. Все сессии сбросятся при перезапуске.")
		log.Println("👉 Для production установите: JWT_SECRET=<ваш-секретный-ключ-32+символов>")
	}
	return []byte(k)
}()

// Глобальное подключение к PostgreSQL и переменные состояния
var (
	db            *sql.DB
	dbMu          sync.RWMutex
	dbStatus      = "initializing"
	dbStatusError = ""
	dbEnvKeyUsed  = ""
)

// getDatabaseURL ищет строку подключения к PostgreSQL в стандартных переменных Railway, Render и Heroku
func getDatabaseURL() (string, string) {
	keys := []string{
		"DATABASE_URL",
		"DATABASE_PRIVATE_URL",
		"DATABASE_PUBLIC_URL",
		"POSTGRES_URL",
		"POSTGRESQL_URL",
		"RAILWAY_DATABASE_URL",
	}

	for _, k := range keys {
		if val := strings.TrimSpace(os.Getenv(k)); val != "" {
			return val, k
		}
	}

	// Раздельные переменные PGHOST, PGUSER, PGPORT, PGPASSWORD, PGDATABASE
	host := strings.TrimSpace(os.Getenv("PGHOST"))
	if host != "" {
		port := strings.TrimSpace(os.Getenv("PGPORT"))
		if port == "" {
			port = "5432"
		}
		user := strings.TrimSpace(os.Getenv("PGUSER"))
		if user == "" {
			user = "postgres"
		}
		pass := strings.TrimSpace(os.Getenv("PGPASSWORD"))
		dbname := strings.TrimSpace(os.Getenv("PGDATABASE"))
		if dbname == "" {
			dbname = "railway"
		}
		sslMode := strings.TrimSpace(os.Getenv("PGSSLMODE"))
		if sslMode == "" {
			sslMode = "disable"
		}
		url := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", user, pass, host, port, dbname, sslMode)
		return url, "PGHOST"
	}

	return "", ""
}

// createTables создает полную схему базы данных (все таблицы, индексы и связи) из embedded schema.sql
func createTables(dbConn *sql.DB) error {
	if strings.TrimSpace(fullSchemaSQL) == "" {
		return errors.New("embedded fullSchemaSQL пуст")
	}
	_, err := dbConn.Exec(fullSchemaSQL)
	return err
}

func connectAndMigrate(dbURL string) (*sql.DB, error) {
	conn, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, err
	}
	conn.SetMaxOpenConns(25)
	conn.SetMaxIdleConns(5)
	conn.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 6*time.Second)
	defer cancel()

	if err := conn.PingContext(ctx); err != nil {
		conn.Close()
		return nil, err
	}

	if err := createTables(conn); err != nil {
		conn.Close()
		return nil, fmt.Errorf("ошибка создания таблиц в БД: %w", err)
	}

	// Очистка битых/осиротевших связей (если пользователь был удален)
	_, _ = conn.Exec(`
		DELETE FROM user_relationships 
		WHERE follower_id NOT IN (SELECT id FROM users) 
		   OR target_id NOT IN (SELECT id FROM users);
	`)
	// Актуализация счетчиков подписок и подписчиков в таблице users
	_, _ = conn.Exec(`
		UPDATE users u SET 
		  following_count = (SELECT COUNT(*) FROM user_relationships r JOIN users u2 ON r.target_id = u2.id WHERE r.follower_id = u.id AND r.rel_type = 'follow'),
		  followers_count = (SELECT COUNT(*) FROM user_relationships r JOIN users u2 ON r.follower_id = u2.id WHERE r.target_id = u.id AND r.rel_type = 'follow');
	`)

	// Исправление пустых, битых, dicebear и unsplash аватарок у всех пользователей в БД на стандартный серый бублик
	_, _ = conn.Exec(`
		UPDATE users 
		SET avatar = '/default-avatar.svg' 
		WHERE avatar IS NULL 
		   OR avatar = '' 
		   OR avatar = 'undefined' 
		   OR avatar = 'null' 
		   OR avatar LIKE '%dicebear%' 
		   OR avatar LIKE '%unsplash%';
	`)

	// Убеждаемся что колонки online и last_seen присутствуют в таблице users, а также таблица story_views и колонка viewers_count
	_, _ = conn.Exec(`
		ALTER TABLE users ADD COLUMN IF NOT EXISTS online BOOLEAN DEFAULT FALSE;
		ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
		ALTER TABLE stories ADD COLUMN IF NOT EXISTS viewers_count INT DEFAULT 0;
		CREATE TABLE IF NOT EXISTS story_views (
			story_id VARCHAR(64) NOT NULL,
			user_id VARCHAR(64) NOT NULL,
			reaction VARCHAR(50) DEFAULT '',
			viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			PRIMARY KEY (story_id, user_id)
		);
	`)

	return conn, nil
}

func initDB() {
	dbURL, envKey := getDatabaseURL()
	if dbURL == "" {
		dbMu.Lock()
		dbStatus = "in_memory (no database variable)"
		dbMu.Unlock()
		log.Println("ℹ️ Переменная базы данных (DATABASE_URL/POSTGRES_URL/PGHOST) не обнаружена.")
		log.Println("👉 ВАЖНО: В панели Railway свяжите сервис PostgreSQL с сервисом приложения через Reference Variable DATABASE_URL.")
		log.Println("ℹ️ Сервер продолжает работу в in-memory режиме.")
		return
	}

	log.Printf("🔌 Найдена конфигурация БД из переменной '%s'. Попытка подключения...", envKey)

	var lastErr error
	for attempt := 1; attempt <= 5; attempt++ {
		conn, err := connectAndMigrate(dbURL)
		if err == nil {
			dbMu.Lock()
			db = conn
			dbStatus = "connected"
			dbEnvKeyUsed = envKey
			dbStatusError = ""
			dbMu.Unlock()
			log.Printf("✅ Успешное подключение к PostgreSQL на Railway (из переменной %s)!", envKey)
			log.Println("✅ Схема базы данных (таблицы users, posts, messages) проверена и готова к работе!")
			return
		}
		lastErr = err
		log.Printf("⏳ Попытка подключения к Postgres %d/5 не удалась (%v). Повтор через 2с...", attempt, err)
		time.Sleep(2 * time.Second)
	}

	dbMu.Lock()
	dbStatus = "connecting_retry"
	dbStatusError = lastErr.Error()
	dbMu.Unlock()
	log.Printf("⚠️ Первые попытки подключения не удались (%v). Запускаем фоновый реконнект...", lastErr)

	go func() {
		for i := 1; i <= 30; i++ {
			time.Sleep(5 * time.Second)
			currentURL, currentKey := getDatabaseURL()
			if currentURL == "" {
				continue
			}
			conn, err := connectAndMigrate(currentURL)
			if err == nil {
				dbMu.Lock()
				db = conn
				dbStatus = "connected"
				dbEnvKeyUsed = currentKey
				dbStatusError = ""
				dbMu.Unlock()
				log.Printf("✅ [Фоновое подключение] Успешное подключение к PostgreSQL (%s)!", currentKey)
				log.Println("✅ [Фоновое подключение] Таблицы users, posts, messages успешно созданы!")
				return
			}
		}
		dbMu.Lock()
		dbStatus = "failed"
		dbMu.Unlock()
		log.Println("❌ Не удалось подключиться к PostgreSQL после серии фоновых попыток. Используется in-memory режим.")
	}()
}

// Хранилище аккаунтов и данных с постоянным сохранением на диск
type UserStore struct {
	mu            sync.RWMutex
	accounts      map[string]AccountStoreEntry // key: userID
	relationships map[string][]string          // key: followerID -> []targetID
	posts         []Post                       // persistent list of posts
	stories       []Story                      // persistent list of stories
}

type PersistentData struct {
	Accounts      map[string]AccountStoreEntry `json:"accounts"`
	Relationships map[string][]string          `json:"relationships"`
	Posts         []Post                       `json:"posts"`
	Stories       []Story                      `json:"stories,omitempty"`
}

const storeFilePath = "data/social_network_store.json"
var fileWriteMu sync.Mutex

func (s *UserStore) saveToDisk() {
	// Создаем снимок данных в памяти за микросекунды под текущим локом
	data := PersistentData{
		Accounts:      make(map[string]AccountStoreEntry, len(s.accounts)),
		Relationships: make(map[string][]string, len(s.relationships)),
		Posts:         make([]Post, len(s.posts)),
		Stories:       make([]Story, len(s.stories)),
	}
	for k, v := range s.accounts {
		data.Accounts[k] = v
	}
	for k, v := range s.relationships {
		relCopy := make([]string, len(v))
		copy(relCopy, v)
		data.Relationships[k] = relCopy
	}
	copy(data.Posts, s.posts)
	copy(data.Stories, s.stories)

	// Асинхронная запись на диск в фоновой горутине — не блокирует s.mu для других запросов
	go func(d PersistentData) {
		fileWriteMu.Lock()
		defer fileWriteMu.Unlock()

		if err := os.MkdirAll("data", 0755); err != nil {
			return
		}
		b, err := json.MarshalIndent(d, "", "  ")
		if err != nil {
			return
		}
		tmpPath := storeFilePath + ".tmp"
		if err := os.WriteFile(tmpPath, b, 0644); err == nil {
			os.Rename(tmpPath, storeFilePath)
		}
	}(data)
}

func (s *UserStore) loadFromDisk() {
	b, err := os.ReadFile(storeFilePath)
	if err != nil {
		return
	}
	var data PersistentData
	if err := json.Unmarshal(b, &data); err != nil {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if data.Accounts != nil {
		s.accounts = data.Accounts
		for id, acc := range s.accounts {
			ensureUserAvatar(&acc.User)
			s.accounts[id] = acc
		}
	}
	if data.Relationships != nil {
		s.relationships = make(map[string][]string)
		for fid, targets := range data.Relationships {
			var valid []string
			for _, tid := range targets {
				if _, ok := s.accounts[tid]; ok {
					valid = append(valid, tid)
					continue
				}
				for _, mu := range mockUsers {
					if mu.ID == tid {
						valid = append(valid, tid)
						break
					}
				}
			}
			s.relationships[fid] = valid
		}
	}
	if data.Posts != nil {
		s.posts = data.Posts
		for i := range s.posts {
			ensureUserAvatar(&s.posts[i].User)
		}
	}
	if data.Stories != nil {
		s.stories = data.Stories
	}
	log.Printf("📦 Успешно загружено из локального хранилища %s: %d аккаунтов, %d постов, %d историй", storeFilePath, len(s.accounts), len(s.posts), len(s.stories))
}

var store = &UserStore{
	accounts:      make(map[string]AccountStoreEntry),
	relationships: make(map[string][]string),
	posts:         make([]Post, 0),
	stories:       make([]Story, 0),
}

// mockUsers защищён мьютексом от конкурентного доступа
var (
	mockUsersMu sync.RWMutex
	mockUsers   = []User{}
)

// Трекинг реальной активности пользователей (онлайн статус)
var (
	userLastActiveMu sync.RWMutex
	userLastActive   = make(map[string]time.Time)
)

// Трекинг реальных просмотров историй (in-memory fallback + sync)
type StoryViewerRecord struct {
	UserID   string    `json:"userId"`
	Username string    `json:"username"`
	Name     string    `json:"name"`
	Avatar   string    `json:"avatar"`
	ViewedAt time.Time `json:"viewedAt"`
}

var (
	storyViewersMu sync.RWMutex
	storyViewers   = make(map[string][]StoryViewerRecord) // key: storyID
)

func markUserActive(userID string) {
	if userID == "" {
		return
	}
	now := time.Now()
	userLastActiveMu.Lock()
	userLastActive[userID] = now
	userLastActiveMu.Unlock()

	dbMu.RLock()
	currentDB := db
	dbMu.RUnlock()

	if currentDB != nil {
		go func(uid string) {
			_, _ = currentDB.Exec("UPDATE users SET online = true, last_seen = NOW() WHERE id = $1", uid)
		}(userID)
	}
}

func markUserOffline(userID string) {
	if userID == "" {
		return
	}
	userLastActiveMu.Lock()
	delete(userLastActive, userID)
	userLastActiveMu.Unlock()

	dbMu.RLock()
	currentDB := db
	dbMu.RUnlock()

	if currentDB != nil {
		go func(uid string) {
			_, _ = currentDB.Exec("UPDATE users SET online = false, last_seen = NOW() WHERE id = $1", uid)
		}(userID)
	}
}

func isUserOnline(userID string, dbOnline bool, dbLastSeen time.Time) bool {
	if userID == "" {
		return false
	}
	userLastActiveMu.RLock()
	t, exists := userLastActive[userID]
	userLastActiveMu.RUnlock()
	if exists && time.Since(t) < 3*time.Minute {
		return true
	}
	if dbOnline && !dbLastSeen.IsZero() && time.Since(dbLastSeen) < 3*time.Minute {
		return true
	}
	return false
}

func formatLastSeen(lastSeen time.Time, isOnline bool) string {
	if isOnline {
		return "В сети"
	}
	if lastSeen.IsZero() {
		return "Был(а) в сети недавно"
	}
	diff := time.Since(lastSeen)
	if diff < 0 {
		return "В сети"
	}
	if diff < 1*time.Minute {
		return "Был(а) в сети только что"
	}
	if diff < 60*time.Minute {
		mins := int(diff.Minutes())
		if mins < 1 {
			mins = 1
		}
		return fmt.Sprintf("Был(а) в сети %s назад", pluralizeRu(mins, "минуту", "минуты", "минут"))
	}
	if diff < 24*time.Hour {
		hours := int(diff.Hours())
		if hours < 1 {
			hours = 1
		}
		return fmt.Sprintf("Был(а) в сети %s назад", pluralizeRu(hours, "час", "часа", "часов"))
	}
	days := int(diff.Hours() / 24)
	if days == 1 {
		return "Был(а) в сети вчера"
	}
	if days < 7 {
		return fmt.Sprintf("Был(а) в сети %s назад", pluralizeRu(days, "день", "дня", "дней"))
	}
	if days < 30 {
		weeks := days / 7
		return fmt.Sprintf("Был(а) в сети %s назад", pluralizeRu(weeks, "неделю", "недели", "недель"))
	}
	return "Был(а) в сети давно"
}

// =========================================================================
// CRYPTO & JWT IMPLEMENTATION (RFC 7519 HMAC-SHA256)
// =========================================================================

type JWTHeader struct {
	Alg string `json:"alg"`
	Typ string `json:"typ"`
}

type JWTClaims struct {
	UserID       string `json:"user_id"`
	Username     string `json:"username"`
	Role         string `json:"role"`
	EmailOrPhone string `json:"email_or_phone"`
	Exp          int64  `json:"exp"`
	Iat          int64  `json:"iat"`
}

func base64URLEncode(data []byte) string {
	return strings.TrimRight(base64.URLEncoding.EncodeToString(data), "=")
}

func base64URLDecode(s string) ([]byte, error) {
	if l := len(s) % 4; l > 0 {
		s += strings.Repeat("=", 4-l)
	}
	return base64.URLEncoding.DecodeString(s)
}

func generateSalt(n int) string {
	b := make([]byte, n)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func hashPassword(password, salt string) string {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		// Fallback в маловероятном случае сбоя bcrypt
		h := sha256.New()
		h.Write([]byte(password + ":" + salt + ":new_age_pepper"))
		return hex.EncodeToString(h.Sum(nil))
	}
	return string(hashedBytes)
}

func checkPassword(password, salt, expectedHash string) bool {
	if strings.HasPrefix(expectedHash, "$2a$") || strings.HasPrefix(expectedHash, "$2b$") || strings.HasPrefix(expectedHash, "$2y$") {
		return bcrypt.CompareHashAndPassword([]byte(expectedHash), []byte(password)) == nil
	}
	// Fallback для старых SHA-256 хешей
	h := sha256.New()
	h.Write([]byte(password + ":" + salt + ":new_age_pepper"))
	return hex.EncodeToString(h.Sum(nil)) == expectedHash
}

func generateJWT(user User, emailOrPhone string) (string, error) {
	header := JWTHeader{
		Alg: "HS256",
		Typ: "JWT",
	}
	headerJSON, err := json.Marshal(header)
	if err != nil {
		return "", err
	}
	encodedHeader := base64URLEncode(headerJSON)

	now := time.Now()
	claims := JWTClaims{
		UserID:       user.ID,
		Username:     user.Username,
		Role:         user.Role,
		EmailOrPhone: emailOrPhone,
		Iat:          now.Unix(),
		Exp:          now.Add(30 * 24 * time.Hour).Unix(), // 30 дней сессия
	}
	claimsJSON, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	encodedClaims := base64URLEncode(claimsJSON)

	unsignedToken := encodedHeader + "." + encodedClaims
	mac := hmac.New(sha256.New, jwtSecretKey)
	mac.Write([]byte(unsignedToken))
	signature := base64URLEncode(mac.Sum(nil))

	return unsignedToken + "." + signature, nil
}

func parseAndValidateJWT(tokenStr string) (*JWTClaims, error) {
	parts := strings.Split(tokenStr, ".")
	if len(parts) != 3 {
		return nil, errors.New("неверный формат токена")
	}

	unsignedToken := parts[0] + "." + parts[1]
	mac := hmac.New(sha256.New, jwtSecretKey)
	mac.Write([]byte(unsignedToken))
	expectedSig := base64URLEncode(mac.Sum(nil))

	if !hmac.Equal([]byte(parts[2]), []byte(expectedSig)) {
		return nil, errors.New("недействительная подпись токена")
	}

	claimsBytes, err := base64URLDecode(parts[1])
	if err != nil {
		return nil, errors.New("ошибка декодирования payload")
	}

	var claims JWTClaims
	if err := json.Unmarshal(claimsBytes, &claims); err != nil {
		return nil, errors.New("некорректный payload")
	}

	if claims.Exp < time.Now().Unix() {
		return nil, errors.New("срок действия токена истек")
	}

	if claims.UserID != "" {
		markUserActive(claims.UserID)
	}

	return &claims, nil
}

func extractBearerToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
		return strings.TrimSpace(parts[1])
	}
	return ""
}

// =========================================================================
// RATE LIMITER ДЛЯ ЗАЩИТЫ АУТЕНТИФИКАЦИИ
// =========================================================================

type IPRateLimiter struct {
	mu       sync.Mutex
	attempts map[string][]time.Time
	limit    int
	window   time.Duration
}

func newIPRateLimiter(limit int, window time.Duration) *IPRateLimiter {
	rl := &IPRateLimiter{
		attempts: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
	go func() {
		ticker := time.NewTicker(2 * time.Minute)
		for range ticker.C {
			rl.mu.Lock()
			now := time.Now()
			for ip, times := range rl.attempts {
				validIdx := 0
				for _, t := range times {
					if now.Sub(t) < rl.window {
						times[validIdx] = t
						validIdx++
					}
				}
				if validIdx == 0 {
					delete(rl.attempts, ip)
				} else {
					rl.attempts[ip] = times[:validIdx]
				}
			}
			rl.mu.Unlock()
		}
	}()
	return rl
}

func (rl *IPRateLimiter) Allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	times := rl.attempts[ip]

	valid := make([]time.Time, 0, len(times))
	for _, t := range times {
		if now.Sub(t) < rl.window {
			valid = append(valid, t)
		}
	}

	if len(valid) >= rl.limit {
		rl.attempts[ip] = valid
		return false
	}

	valid = append(valid, now)
	rl.attempts[ip] = valid
	return true
}

func getClientIP(r *http.Request) string {
	xfwd := r.Header.Get("X-Forwarded-For")
	if xfwd != "" {
		parts := strings.Split(xfwd, ",")
		return strings.TrimSpace(parts[0])
	}
	ip := r.RemoteAddr
	if colon := strings.LastIndex(ip, ":"); colon != -1 {
		ip = ip[:colon]
	}
	return ip
}

func rateLimitMiddleware(limiter *IPRateLimiter, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := getClientIP(r)
		if !limiter.Allow(ip) {
			writeJSON(w, http.StatusTooManyRequests, Response{
				Status:  "error",
				Message: "Слишком много запросов. Пожалуйста, повторите попытку через минуту.",
			})
			return
		}
		next(w, r)
	}
}

// =========================================================================
// MAIN & ROUTES
// =========================================================================

func main() {
	// Загрузка постоянных данных из дискового хранилища
	store.loadFromDisk()

	// Инициализация подключения к PostgreSQL (если предоставлена DATABASE_URL на Railway)
	initDB()

	mux := http.NewServeMux()

	// API-маршруты
	mux.HandleFunc("GET /api/health", handleHealth)
	mux.HandleFunc("GET /api/feed", handleFeed)
	mux.HandleFunc("GET /api/posts", handleFeed)
	mux.HandleFunc("GET /api/users/{id}/posts", handleUserPosts)
	mux.HandleFunc("GET /api/profile/{id}/posts", handleUserPosts)
	mux.HandleFunc("GET /api/videos", handleVideos)
	mux.HandleFunc("GET /api/chats", handleChats)
	mux.HandleFunc("GET /api/podcasts", handlePodcasts)
	mux.HandleFunc("GET /api/profile", handleProfile)
	mux.HandleFunc("GET /api/users", handleUsers)
	mux.HandleFunc("GET /api/search", handleSearch)
	mux.HandleFunc("POST /api/users/heartbeat", handleHeartbeat)
	mux.HandleFunc("POST /api/users/offline", handleOffline)
	mux.HandleFunc("GET /api/marketplace", handleMarketplace)
	mux.HandleFunc("GET /api/communities", handleCommunities)
	mux.HandleFunc("GET /api/wallet", handleWallet)
	mux.HandleFunc("GET /api/admin/stats", handleAdminStats)

	// Auth эндпоинты (JWT) с защитой от перебора (Rate Limiting: 15 запросов в минуту)
	authLimiter := newIPRateLimiter(15, 1*time.Minute)
	mux.HandleFunc("POST /api/auth/register", rateLimitMiddleware(authLimiter, handleRegister))
	mux.HandleFunc("POST /api/auth/login", rateLimitMiddleware(authLimiter, handleLogin))
	mux.HandleFunc("GET /api/auth/me", handleAuthMe)
	mux.HandleFunc("GET /api/auth/check-username", handleCheckUsername)

	// SMS авторизация с защитой Rate Limiter (10 запросов в минуту)
	smsLimiter := newIPRateLimiter(10, 1*time.Minute)
	mux.HandleFunc("POST /api/auth/send-code", rateLimitMiddleware(smsLimiter, handleSendCode))
	mux.HandleFunc("POST /api/auth/verify-code", rateLimitMiddleware(smsLimiter, handleVerifyCode))

	// QR-код авторизация (вход со смартфона)
	mux.HandleFunc("GET /api/auth/qr/init", handleQRInit)
	mux.HandleFunc("GET /api/auth/qr/status", handleQRStatus)
	mux.HandleFunc("POST /api/auth/qr/confirm", handleQRConfirm)
	mux.HandleFunc("POST /api/auth/qr/reject", handleQRReject)

	// Уведомления (Notifications)
	mux.HandleFunc("GET /api/notifications", handleGetNotifications)
	mux.HandleFunc("POST /api/notifications/read", handleMarkNotificationsRead)
	mux.HandleFunc("POST /api/notifications/{id}/read", handleMarkSingleNotificationRead)
	mux.HandleFunc("DELETE /api/notifications/{id}", handleDeleteNotification)
	mux.HandleFunc("DELETE /api/notifications", handleClearNotifications)
	mux.HandleFunc("POST /api/notifications/test", handleTestNotification)

	// Подписки и друзья (полная совместимость с E:\соц и текущей архитектурой)
	mux.HandleFunc("POST /api/users/{id}/follow", handleFollow)
	mux.HandleFunc("DELETE /api/users/{id}/follow", handleUnfollow)
	mux.HandleFunc("POST /api/friends/request/{id}", handleFollow)
	mux.HandleFunc("DELETE /api/friends/{id}", handleUnfollow)
	mux.HandleFunc("GET /api/friends", handleMyFriends)
	mux.HandleFunc("GET /api/friends/requests", handleFriendRequests)
	mux.HandleFunc("GET /api/users/{id}/followers", handleFollowers)
	mux.HandleFunc("GET /api/users/{id}/following", handleFollowing)
	mux.HandleFunc("GET /api/users/{id}/friends", handleFriends)
	mux.HandleFunc("DELETE /api/users/{id}/friend", handleRemoveFriend)
	mux.HandleFunc("GET /api/profile/{id}", handleUserProfile)
	mux.HandleFunc("GET /api/profile/{id}/followers", handleFollowers)
	mux.HandleFunc("GET /api/profile/{id}/following", handleFollowing)
	mux.HandleFunc("GET /api/profile/{id}/friends", handleFriends)
	mux.HandleFunc("GET /api/users/{id}/profile", handleUserProfile)
	mux.HandleFunc("PUT /api/profile", handleUpdateProfile)

	// Посты CRUD
	mux.HandleFunc("POST /api/posts", handleCreatePost)
	mux.HandleFunc("POST /api/posts/{id}/like", handleLikePost)
	mux.HandleFunc("DELETE /api/posts/{id}/like", handleUnlikePost)
	mux.HandleFunc("POST /api/posts/{id}/comments", handleAddComment)
	mux.HandleFunc("GET /api/posts/{id}/comments", handleGetComments)
	mux.HandleFunc("DELETE /api/posts/{id}", handleDeletePost)

	// Сторис и клипы
	mux.HandleFunc("GET /api/stories", handleStories)
	mux.HandleFunc("GET /api/clips", handleClips)

	// Сообщения
	mux.HandleFunc("GET /api/chats/{id}/messages", handleGetMessages)
	mux.HandleFunc("POST /api/chats/{id}/messages", handleSendMessage)
	mux.HandleFunc("POST /api/chats/direct", handleCreateDirectChat)
	mux.HandleFunc("POST /api/chats/{id}/read", handleMarkRead)

	// Сообщества
	mux.HandleFunc("POST /api/communities", handleCreateCommunity)
	mux.HandleFunc("POST /api/communities/{id}/join", handleJoinCommunity)
	mux.HandleFunc("DELETE /api/communities/{id}/leave", handleLeaveCommunity)
	mux.HandleFunc("GET /api/communities/{id}/members", handleCommunityMembers)

	// Сторис
	mux.HandleFunc("POST /api/stories", handleCreateStory)
	mux.HandleFunc("POST /api/stories/sync", handleSyncStories)
	mux.HandleFunc("POST /api/stories/{id}/view", handleViewStory)
	mux.HandleFunc("GET /api/stories/{id}/viewers", handleStoryViewers)
	mux.HandleFunc("DELETE /api/stories/{id}", handleDeleteStory)

	// Клипы
	mux.HandleFunc("POST /api/clips", handleCreateClip)
	mux.HandleFunc("POST /api/clips/{id}/like", handleLikeClip)
	mux.HandleFunc("POST /api/clips/{id}/view", handleViewClip)

	// DB Admin эндпоинты
	mux.HandleFunc("GET /api/admin/db-status", handleDBStatus)
	mux.HandleFunc("POST /api/admin/init-db", handleInitDB)
	mux.HandleFunc("GET /api/admin/init-db", handleInitDB)

	// Geo / Location автоопределение
	mux.HandleFunc("GET /api/geo/detect", handleGeoDetect)

	// Cache Management эндпоинты
	mux.HandleFunc("GET /api/cache/stats", handleCacheStats)
	mux.HandleFunc("POST /api/cache/clear", handleCacheClear)
	mux.HandleFunc("POST /api/cache/sync", handleCacheSync)

	// ИИ Оракул
	mux.HandleFunc("POST /api/ai/chat", handleAIChat)
	mux.HandleFunc("POST /api/ai/oracle", handleAIChat)
	mux.HandleFunc("GET /api/ai/oracle", handleAIChat)
	mux.HandleFunc("POST /api/oracle", handleAIChat)
	mux.HandleFunc("GET /api/ai/tts", handleAITTS)
	mux.HandleFunc("POST /api/ai/tts", handleAITTS)
	mux.HandleFunc("POST /api/ai/stt", handleAISTT)

	// Раздача статики фронтенда (SPA fallback для продакшена на Railway)
	distDir := os.Getenv("STATIC_DIR")
	if distDir == "" {
		if _, err := os.Stat("./dist"); err == nil {
			distDir = "./dist"
		} else if _, err := os.Stat("../frontend/dist"); err == nil {
			distDir = "../frontend/dist"
		} else if _, err := os.Stat("./frontend/dist"); err == nil {
			distDir = "./frontend/dist"
		}
	}

	if distDir != "" {
		log.Printf("📁 Раздача статических файлов фронтенда из: %s", distDir)
	}

	// Оборачиваем: API → mux, остальное → SPA static
	var rootHandler http.Handler
	if distDir != "" {
		fsHandler := http.FileServer(http.Dir(distDir))
		rootHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Все /api/* запросы идут в mux (там зарегистрированы все API handlers)
			if strings.HasPrefix(r.URL.Path, "/api/") || r.URL.Path == "/api" {
				mux.ServeHTTP(w, r)
				return
			}
			// Проверяем есть ли статический файл
			filePath := distDir + r.URL.Path
			if fi, err := os.Stat(filePath); err == nil && !fi.IsDir() {
				// Принудительно ставим charset=utf-8 для текстовых ассетов,
				// иначе на Windows Go отдаёт .js без charset и браузер
				// на русской локали читает UTF-8 как CP1251 → кракозябры.
				if strings.HasSuffix(r.URL.Path, ".js") {
					w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
				} else if strings.HasSuffix(r.URL.Path, ".css") {
					w.Header().Set("Content-Type", "text/css; charset=utf-8")
				} else if strings.HasSuffix(r.URL.Path, ".html") {
					w.Header().Set("Content-Type", "text/html; charset=utf-8")
				} else if strings.HasSuffix(r.URL.Path, ".json") {
					w.Header().Set("Content-Type", "application/json; charset=utf-8")
				} else if strings.HasSuffix(r.URL.Path, ".svg") {
					w.Header().Set("Content-Type", "image/svg+xml; charset=utf-8")
				}
				fsHandler.ServeHTTP(w, r)
				return
			}
			// SPA fallback → index.html
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			http.ServeFile(w, r, distDir+"/index.html")
		})
	} else {
		rootHandler = mux
	}

	// CORS middleware
	handler := corsMiddleware(rootHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Сервер запущен на http://localhost:%s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}

// allowedOrigins — список разрешённых доменов для CORS.
var allowedOrigins = func() []string {
	origins := os.Getenv("CORS_ORIGINS")
	if origins != "" {
		return strings.Split(origins, ",")
	}
	// По умолчанию — localhost для разработки и Android WebView
	return []string{"http://localhost:5173", "http://localhost:5175", "http://localhost:3000", "http://localhost:8080", "https://appassets.androidplatform.net", "https://soc-production-9d33.up.railway.app"}
}()

func isOriginAllowed(origin string) bool {
	if origin == "" {
		return true // same-origin запросы
	}
	cleanOrigin := strings.ToLower(strings.TrimSpace(origin))
	if cleanOrigin == "https://appassets.androidplatform.net" ||
		cleanOrigin == "capacitor://localhost" ||
		cleanOrigin == "http://localhost" ||
		strings.HasPrefix(cleanOrigin, "http://localhost:") ||
		strings.HasPrefix(cleanOrigin, "http://127.0.0.1:") ||
		strings.HasSuffix(cleanOrigin, ".up.railway.app") ||
		strings.HasSuffix(cleanOrigin, ".railway.app") {
		return true
	}
	for _, o := range allowedOrigins {
		if strings.TrimSpace(o) == origin {
			return true
		}
	}
	return false
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && isOriginAllowed(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		} else if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		} else if len(allowedOrigins) > 0 {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigins[0])
		}
		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// pluralizeRu возвращает число с правильным склонением существительного
func pluralizeRu(n int, one, few, many string) string {
	nAbs := n
	if nAbs < 0 {
		nAbs = -nAbs
	}
	mod10 := nAbs % 10
	mod100 := nAbs % 100
	if mod100 >= 11 && mod100 <= 19 {
		return fmt.Sprintf("%d %s", n, many)
	}
	if mod10 == 1 {
		return fmt.Sprintf("%d %s", n, one)
	}
	if mod10 >= 2 && mod10 <= 4 {
		return fmt.Sprintf("%d %s", n, few)
	}
	return fmt.Sprintf("%d %s", n, many)
}

// formatTimeAgo возвращает "сколько времени назад" на русском с правильными склонениями
func formatTimeAgo(t time.Time) string {
	diff := time.Since(t)
	switch {
	case diff < time.Minute:
		return "только что"
	case diff < time.Hour:
		m := int(diff.Minutes())
		return pluralizeRu(m, "минуту", "минуты", "минут") + " назад"
	case diff < 24*time.Hour:
		h := int(diff.Hours())
		return pluralizeRu(h, "час", "часа", "часов") + " назад"
	case diff < 7*24*time.Hour:
		d := int(diff.Hours() / 24)
		if d == 1 {
			return "вчера"
		}
		return pluralizeRu(d, "день", "дня", "дней") + " назад"
	case diff < 30*24*time.Hour:
		w := int(diff.Hours() / 24 / 7)
		return pluralizeRu(w, "неделю", "недели", "недель") + " назад"
	default:
		return t.Format("02.01.2006")
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	dbMu.RLock()
	st := dbStatus
	envKey := dbEnvKeyUsed
	errStr := dbStatusError
	dbMu.RUnlock()

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: HealthCheck{
			Uptime:    time.Since(startTime).String(),
			Timestamp: time.Now().Format(time.RFC3339),
			Database:  st,
			DBEnv:     envKey,
			DBError:   errStr,
		},
	})
}

func handleDBStatus(w http.ResponseWriter, r *http.Request) {
	dbMu.RLock()
	isConnected := db != nil
	st := dbStatus
	envKey := dbEnvKeyUsed
	errStr := dbStatusError
	dbMu.RUnlock()

	tables := []string{}
	if isConnected {
		rows, err := db.Query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var tName string
				if err := rows.Scan(&tName); err == nil {
					tables = append(tables, tName)
				}
			}
		}
	}

	_, detectedKey := getDatabaseURL()

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]interface{}{
			"connected":    isConnected,
			"status":       st,
			"detected_env": detectedKey,
			"active_env":   envKey,
			"tables":       tables,
			"tables_count": len(tables),
			"error":        errStr,
			"railway_hint": "Для привязки базы в Railway: Сервис бэкенда -> Variables -> Add Variable -> Add Reference -> Postgres -> DATABASE_URL",
		},
	})
}

func handleInitDB(w http.ResponseWriter, r *http.Request) {
	dbURL, envKey := getDatabaseURL()
	if dbURL == "" {
		writeJSON(w, http.StatusBadRequest, Response{
			Status:  "error",
			Message: "Не найдена переменная окружения DATABASE_URL или POSTGRES_URL в сервисе Railway.",
			Data: map[string]string{
				"instruction": "Перейдите в веб-сервис на Railway -> Variables -> Add Variable -> Add Reference -> выберите Postgres -> DATABASE_URL",
			},
		})
		return
	}

	conn, err := connectAndMigrate(dbURL)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, Response{
			Status:  "error",
			Message: fmt.Sprintf("Ошибка создания таблиц в PostgreSQL: %v", err),
		})
		return
	}

	dbMu.Lock()
	if db != nil {
		db.Close()
	}
	db = conn
	dbStatus = "connected"
	dbEnvKeyUsed = envKey
	dbStatusError = ""
	dbMu.Unlock()

	createdTables := []string{}
	rows, err := conn.Query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var tName string
			if err := rows.Scan(&tName); err == nil {
				createdTables = append(createdTables, tName)
			}
		}
	}

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: fmt.Sprintf("✅ Все таблицы базы данных (%d шт.) успешно созданы в PostgreSQL!", len(createdTables)),
		Data: map[string]interface{}{
			"connected":    true,
			"env":          envKey,
			"tables":       createdTables,
			"tables_count": len(createdTables),
		},
	})
}

// GET /api/geo/detect — Автоопределение страны по заголовкам Cloudflare / прокси / IP
func handleGeoDetect(w http.ResponseWriter, r *http.Request) {
	country := strings.ToUpper(strings.TrimSpace(r.Header.Get("CF-IPCountry")))
	if country == "" {
		country = strings.ToUpper(strings.TrimSpace(r.Header.Get("X-Country-Code")))
	}
	if country == "" {
		country = "RU"
	}

	countryName := "Россия"
	dialCode := "+7"

	switch country {
	case "RU":
		countryName = "Россия"; dialCode = "+7"
	case "BY":
		countryName = "Беларусь"; dialCode = "+375"
	case "KZ":
		countryName = "Казахстан"; dialCode = "+7"
	case "UZ":
		countryName = "Узбекистан"; dialCode = "+998"
	case "KG":
		countryName = "Кыргызстан"; dialCode = "+996"
	case "TJ":
		countryName = "Таджикистан"; dialCode = "+992"
	case "AM":
		countryName = "Армения"; dialCode = "+374"
	case "AZ":
		countryName = "Азербайджан"; dialCode = "+994"
	case "GE":
		countryName = "Грузия"; dialCode = "+995"
	case "MD":
		countryName = "Молдова"; dialCode = "+373"
	case "UA":
		countryName = "Украина"; dialCode = "+380"
	case "TR":
		countryName = "Турция"; dialCode = "+90"
	case "AE":
		countryName = "ОАЭ"; dialCode = "+971"
	case "US":
		countryName = "США"; dialCode = "+1"
	case "DE":
		countryName = "Германия"; dialCode = "+49"
	}

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]string{
			"country":     country,
			"countryName": countryName,
			"dialCode":    dialCode,
		},
	})
}

// GET /api/cache/stats — Статистика системного кэша
func handleCacheStats(w http.ResponseWriter, r *http.Request) {
	stats := globalCache.Stats()

	// Дополняем статистику из таблицы system_cache, если подключен PostgreSQL
	dbMu.RLock()
	conn := db
	dbMu.RUnlock()

	dbCacheCount := 0
	if conn != nil {
		var cnt int
		if err := conn.QueryRow("SELECT COUNT(*) FROM system_cache WHERE expires_at IS NULL OR expires_at > NOW()").Scan(&cnt); err == nil {
			dbCacheCount = cnt
		}
	}
	stats["db_system_cache_count"] = dbCacheCount

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data:   stats,
	})
}

// POST /api/cache/clear — Полная очистка серверного кэша (память + БД)
func handleCacheClear(w http.ResponseWriter, r *http.Request) {
	globalCache.Clear()

	dbMu.RLock()
	conn := db
	dbMu.RUnlock()

	if conn != nil {
		_, _ = conn.Exec("DELETE FROM system_cache")
	}

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: "Кэш сервера и базы данных успешно очищен",
	})
}

// POST /api/cache/sync — Синхронизация клиентского оффлайн/онлайн кэша
type CacheSyncPayload struct {
	UserID   string      `json:"user_id"`
	CacheKey string      `json:"cache_key"`
	Data     interface{} `json:"data"`
	Version  int         `json:"version"`
}

func handleCacheSync(w http.ResponseWriter, r *http.Request) {
	var payload CacheSyncPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Status:  "error",
			Message: "Неверный формат запроса синхронизации",
		})
		return
	}

	if payload.CacheKey == "" {
		writeJSON(w, http.StatusBadRequest, Response{
			Status:  "error",
			Message: "cache_key обязателен",
		})
		return
	}

	// Сохраняем в in-memory
	memoryKey := fmt.Sprintf("sync:%s:%s", payload.UserID, payload.CacheKey)
	globalCache.Set(memoryKey, payload.Data, 24*time.Hour, "client_sync")

	// Если подключена БД, сохраняем в client_cache_sync
	dbMu.RLock()
	conn := db
	dbMu.RUnlock()

	if conn != nil && payload.UserID != "" {
		dataBytes, _ := json.Marshal(payload.Data)
		_, _ = conn.Exec(`
			INSERT INTO client_cache_sync (user_id, cache_key, data, version, synced_at)
			VALUES ($1, $2, $3, $4, NOW())
			ON CONFLICT (user_id, cache_key)
			DO UPDATE SET data = $3, version = $4, synced_at = NOW()
		`, payload.UserID, payload.CacheKey, string(dataBytes), payload.Version)
	}

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: "Кэш успешно синхронизирован с сервером",
	})
}

func handleProfile(w http.ResponseWriter, r *http.Request) {
	// Определяем пользователя из JWT, а не из глобальной переменной
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Авторизация требуется"})
		return
	}

	// Ищем в PostgreSQL
	if db != nil {
		var u User
		err := db.QueryRow(`
			SELECT id, name, username, COALESCE(avatar, ''), COALESCE(bio, ''), COALESCE(location, ''), COALESCE(website, ''),
				COALESCE(role, 'user'), COALESCE(belief_type, ''), COALESCE(belief_privacy, 'public'), COALESCE(verified, false),
				COALESCE(followers_count, 0), COALESCE(following_count, 0), COALESCE(critics_count, 0), COALESCE(posts_count, 0)
			FROM users WHERE id = $1
		`, claims.UserID).Scan(
			&u.ID, &u.Name, &u.Username, &u.Avatar, &u.Bio, &u.Location, &u.Website,
			&u.Role, &u.BeliefType, &u.BeliefPrivacy, &u.Verified,
			&u.FollowersCount, &u.FollowingCount, &u.CriticsCount, &u.PostsCount,
		)
		if err == nil {
			u.Online = true
			ensureUserAvatar(&u)
			writeJSON(w, http.StatusOK, Response{Status: "ok", Data: u})
			return
		}
	}

	// Fallback — in-memory
	store.mu.RLock()
	acc, ok := store.accounts[claims.UserID]
	store.mu.RUnlock()
	if ok {
		u := acc.User
		ensureUserAvatar(&u)
		writeJSON(w, http.StatusOK, Response{Status: "ok", Data: u})
		return
	}

	writeJSON(w, http.StatusNotFound, Response{Status: "error", Message: "Профиль не найден"})
}

func handleHeartbeat(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil || claims == nil || claims.UserID == "" {
		writeJSON(w, http.StatusOK, Response{Status: "ok", Message: "guest"})
		return
	}
	markUserActive(claims.UserID)
	writeJSON(w, http.StatusOK, Response{Status: "ok", Message: "active"})
}

func handleOffline(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err == nil && claims != nil && claims.UserID != "" {
		markUserOffline(claims.UserID)
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Message: "offline"})
}

func handleUsers(w http.ResponseWriter, r *http.Request) {
	if db != nil {
		rows, err := db.Query(`
			SELECT id, name, username, avatar, COALESCE(bio, ''), COALESCE(role, 'user'), 
			       COALESCE(belief_type, ''), COALESCE(belief_privacy, 'public'), COALESCE(verified, false), 
			       followers_count, following_count, critics_count, posts_count,
			       COALESCE(online, false), COALESCE(last_seen, NOW() - INTERVAL '1 day')
			FROM users ORDER BY created_at DESC LIMIT 50`)
		if err == nil {
			defer rows.Close()
			var dbUsers []User
			for rows.Next() {
				var u User
				var dbOnline bool
				var dbLastSeen time.Time
				if err := rows.Scan(&u.ID, &u.Name, &u.Username, &u.Avatar, &u.Bio, &u.Role, &u.BeliefType, &u.BeliefPrivacy, &u.Verified, &u.FollowersCount, &u.FollowingCount, &u.CriticsCount, &u.PostsCount, &dbOnline, &dbLastSeen); err == nil {
					userLastActiveMu.RLock()
					if memT, exists := userLastActive[u.ID]; exists && (dbLastSeen.IsZero() || memT.After(dbLastSeen)) {
						dbLastSeen = memT
					}
					userLastActiveMu.RUnlock()

					u.Online = isUserOnline(u.ID, dbOnline, dbLastSeen)
					if !dbLastSeen.IsZero() {
						u.LastSeen = dbLastSeen.Format(time.RFC3339)
						u.LastSeenText = formatLastSeen(dbLastSeen, u.Online)
					}
					ensureUserAvatar(&u)
					dbUsers = append(dbUsers, u)
				}
			}
			if dbUsers == nil {
				dbUsers = []User{}
			}
			writeJSON(w, http.StatusOK, Response{Status: "ok", Data: dbUsers})
			return
		}
	}
	store.mu.RLock()
	var realUsers []User
	for _, a := range store.accounts {
		u := a.User
		u.Online = isUserOnline(u.ID, false, time.Time{})
		ensureUserAvatar(&u)
		realUsers = append(realUsers, u)
	}
	store.mu.RUnlock()
	if realUsers == nil {
		realUsers = []User{}
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: realUsers})
}

func handleSearch(w http.ResponseWriter, r *http.Request) {
	q := strings.ToLower(r.URL.Query().Get("q"))
	if q == "" {
		writeJSON(w, http.StatusOK, Response{Status: "ok", Data: []User{}})
		return
	}

	if db != nil {
		rows, err := db.Query(`
			SELECT id, name, username, avatar, COALESCE(bio, ''), COALESCE(role, 'user'), 
			       COALESCE(belief_type, ''), COALESCE(belief_privacy, 'public'), COALESCE(verified, false), 
			       followers_count, following_count, critics_count, posts_count,
			       COALESCE(online, false), COALESCE(last_seen, NOW() - INTERVAL '1 day')
			FROM users WHERE LOWER(name) LIKE $1 OR LOWER(username) LIKE $1 LIMIT 20`, "%"+q+"%")
		if err == nil {
			defer rows.Close()
			var results []User
			for rows.Next() {
				var u User
				var dbOnline bool
				var dbLastSeen time.Time
				if err := rows.Scan(&u.ID, &u.Name, &u.Username, &u.Avatar, &u.Bio, &u.Role, &u.BeliefType, &u.BeliefPrivacy, &u.Verified, &u.FollowersCount, &u.FollowingCount, &u.CriticsCount, &u.PostsCount, &dbOnline, &dbLastSeen); err == nil {
					u.Online = isUserOnline(u.ID, dbOnline, dbLastSeen)
					ensureUserAvatar(&u)
					results = append(results, u)
				}
			}
			if results == nil {
				results = []User{}
			}
			writeJSON(w, http.StatusOK, Response{Status: "ok", Data: results})
			return
		}
	}

	var results []User
	store.mu.RLock()
	for _, entry := range store.accounts {
		u := entry.User
		if strings.Contains(strings.ToLower(u.Name), q) || strings.Contains(strings.ToLower(u.Username), q) {
			u.Online = isUserOnline(u.ID, false, time.Time{})
			ensureUserAvatar(&u)
			results = append(results, u)
		}
	}
	store.mu.RUnlock()
	if results == nil {
		results = []User{}
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: results})
}

func handleFeed(w http.ResponseWriter, r *http.Request) {
	if cached, ok := globalCache.Get("api:feed"); ok {
		writeJSON(w, http.StatusOK, Response{Status: "ok", Data: cached})
		return
	}

	var posts []Post

	if db != nil {
		rows, err := db.Query(`
			SELECT p.id, COALESCE(p.caption, ''), COALESCE(p.image, ''), COALESCE(p.location, ''), 
			       COALESCE(p.likes_count, 0), p.created_at,
			       COALESCE(u.id, p.user_id), COALESCE(u.name, p.user_id), COALESCE(u.username, p.user_id), COALESCE(u.avatar, ''), COALESCE(u.verified, false)
			FROM posts p
			LEFT JOIN users u ON (p.user_id = u.id OR LOWER(REPLACE(u.username, '@', '')) = LOWER(REPLACE(p.user_id, '@', '')))
			ORDER BY p.created_at DESC LIMIT 100
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var p Post
				if err := rows.Scan(
					&p.ID, &p.Caption, &p.Image, &p.Location,
					&p.Likes, &p.CreatedAt,
					&p.User.ID, &p.User.Name, &p.User.Username, &p.User.Avatar, &p.User.Verified,
				); err == nil {
					p.UserID = p.User.ID
					p.TimeAgo = formatTimeAgo(p.CreatedAt)
					p.Comments = []Comment{}
					posts = append(posts, p)
				}
			}
		}
	}

	if len(posts) == 0 {
		store.mu.RLock()
		for _, p := range store.posts {
			if p.Comments == nil {
				p.Comments = []Comment{}
			}
			posts = append(posts, p)
		}
		store.mu.RUnlock()
	}

	if posts == nil {
		posts = []Post{}
	}

	globalCache.Set("api:feed", posts, 10*time.Second, "feed")
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: posts})
}

// GET /api/users/{id}/posts & GET /api/profile/{id}/posts
func handleUserPosts(w http.ResponseWriter, r *http.Request) {
	targetID := r.PathValue("id")
	cleanTarget := strings.ToLower(strings.TrimPrefix(targetID, "@"))
	var userPosts []Post

	if db != nil {
		rows, err := db.Query(`
			SELECT p.id, COALESCE(p.caption, ''), COALESCE(p.image, ''), COALESCE(p.location, ''), 
			       COALESCE(p.likes_count, 0), p.created_at,
			       COALESCE(u.id, p.user_id), COALESCE(u.name, p.user_id), COALESCE(u.username, p.user_id), COALESCE(u.avatar, ''), COALESCE(u.verified, false)
			FROM posts p
			LEFT JOIN users u ON (p.user_id = u.id OR LOWER(REPLACE(u.username, '@', '')) = LOWER(REPLACE(p.user_id, '@', '')))
			WHERE (p.user_id = $1 
			   OR LOWER(REPLACE(p.user_id, '@', '')) = LOWER($2)
			   OR u.id = $1 
			   OR LOWER(REPLACE(u.username, '@', '')) = LOWER($2))
			ORDER BY p.created_at DESC
		`, targetID, cleanTarget)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var p Post
				if err := rows.Scan(
					&p.ID, &p.Caption, &p.Image, &p.Location,
					&p.Likes, &p.CreatedAt,
					&p.User.ID, &p.User.Name, &p.User.Username, &p.User.Avatar, &p.User.Verified,
				); err == nil {
					p.UserID = p.User.ID
					p.TimeAgo = formatTimeAgo(p.CreatedAt)
					p.Comments = []Comment{}
					userPosts = append(userPosts, p)
				}
			}
		}
	}

	if len(userPosts) == 0 {
		store.mu.RLock()
		for _, p := range store.posts {
			if p.Comments == nil {
				p.Comments = []Comment{}
			}
			if p.UserID == targetID || strings.ToLower(p.User.Username) == cleanTarget || strings.ToLower(p.UserID) == cleanTarget {
				userPosts = append(userPosts, p)
			}
		}
		store.mu.RUnlock()
	}

	if userPosts == nil {
		userPosts = []Post{}
	}

	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: userPosts})
}

func handleVideos(w http.ResponseWriter, r *http.Request) {
	if cached, ok := globalCache.Get("api:videos"); ok && cached != nil {
		writeJSON(w, http.StatusOK, Response{Status: "ok", Data: cached})
		return
	}
	videos := make([]map[string]interface{}, 0)
	if db != nil {
		rows, err := db.Query(`
			SELECT v.id, v.title, v.description, v.thumbnail, v.video_url, v.duration, v.views_count, v.likes_count, v.created_at,
				u.id, u.name, u.username, u.avatar
			FROM videos v JOIN users u ON v.user_id = u.id
			ORDER BY v.created_at DESC LIMIT 50
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id, title, desc, thumb, videoUrl, duration, userId, userName, userUsername, userAvatar string
				var viewsCount, likesCount int
				var createdAt time.Time
				if err := rows.Scan(&id, &title, &desc, &thumb, &videoUrl, &duration, &viewsCount, &likesCount, &createdAt, &userId, &userName, &userUsername, &userAvatar); err == nil {
					videos = append(videos, map[string]interface{}{
						"id": id, "title": title, "description": desc,
						"thumbnail": thumb, "videoUrl": videoUrl,
						"duration": duration,
						"views": fmt.Sprintf("%dK просмотров", viewsCount/1000),
						"likes": likesCount,
						"timeAgo": formatTimeAgo(createdAt),
						"channel": map[string]interface{}{"id": userId, "name": userName, "username": userUsername, "avatar": userAvatar},
					})
				}
			}
			globalCache.Set("api:videos", videos, 60*time.Second, "videos")
			writeJSON(w, http.StatusOK, Response{Status: "ok", Data: videos})
			return
		}
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: videos})
}

func handleChats(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Авторизация требуется"})
		return
	}
	chats := make([]map[string]interface{}, 0)
	if db != nil {
		rows, err := db.Query(`
			SELECT c.id,
				CASE WHEN c.is_channel THEN 'channel' WHEN c.is_group THEN 'group' ELSE 'direct' END as chat_type,
				c.title,
				COALESCE(NULLIF(c.last_message, ''), (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1), '') as last_msg,
				COALESCE((SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND sender_id != $1 AND is_read = false), 0) as unread
			FROM chats c
			JOIN chat_members cm ON c.id = cm.chat_id
			WHERE cm.user_id = $1
			ORDER BY c.last_message_at DESC
		`, claims.UserID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id, chatType, name, lastMsg string
				var unread int
				if err := rows.Scan(&id, &chatType, &name, &lastMsg, &unread); err == nil {
					chats = append(chats, map[string]interface{}{"id": id, "type": chatType, "name": name, "lastMessage": lastMsg, "unread": unread})
				}
			}
			writeJSON(w, http.StatusOK, Response{Status: "ok", Data: chats})
			return
		}
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: chats})
}

func handlePodcasts(w http.ResponseWriter, r *http.Request) {
	podcasts := make([]map[string]interface{}, 0)
	if db != nil {
		rows, err := db.Query(`SELECT id, title, author_name, cover, description FROM podcasts ORDER BY created_at DESC LIMIT 20`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id, title, author, cover, desc string
				if err := rows.Scan(&id, &title, &author, &cover, &desc); err == nil {
					// Get episodes
					episodes := make([]map[string]interface{}, 0)
					epRows, _ := db.Query(`SELECT id, title, duration, TO_CHAR(created_at, 'DD Mon') FROM podcast_episodes WHERE podcast_id = $1 ORDER BY episode_number DESC`, id)
					if epRows != nil {
						for epRows.Next() {
							var eid, etitle, edur, edate string
							if epRows.Scan(&eid, &etitle, &edur, &edate) == nil {
								episodes = append(episodes, map[string]interface{}{"id": eid, "title": etitle, "duration": edur, "date": edate})
							}
						}
						epRows.Close()
					}
					podcasts = append(podcasts, map[string]interface{}{"id": id, "title": title, "author": author, "cover": cover, "description": desc, "episodes": episodes})
				}
			}
			writeJSON(w, http.StatusOK, Response{Status: "ok", Data: podcasts})
			return
		}
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: podcasts})
}

func handleMarketplace(w http.ResponseWriter, r *http.Request) {
	products := make([]map[string]interface{}, 0)
	if db != nil {
		rows, err := db.Query(`
			SELECT p.id, p.title, p.price, p.currency, p.rating, COALESCE(p.image_url, ''),
				u.name as author, COALESCE(p.category, '') as category
			FROM marketplace_products p
			JOIN users u ON p.seller_id = u.id
			WHERE p.in_stock = true
			ORDER BY p.created_at DESC LIMIT 50
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id, title, currency, imageUrl, author, category string
				var price float64
				var rating float64
				if err := rows.Scan(&id, &title, &price, &currency, &rating, &imageUrl, &author, &category); err == nil {
					products = append(products, map[string]interface{}{"id": id, "title": title, "price": price, "currency": currency, "rating": rating, "image": imageUrl, "author": author, "category": category})
				}
			}
			writeJSON(w, http.StatusOK, Response{Status: "ok", Data: products})
			return
		}
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: products})
}

func handleCommunities(w http.ResponseWriter, r *http.Request) {
	communities := make([]map[string]interface{}, 0)
	if db != nil {
		rows, err := db.Query(`
			SELECT id, name, description, avatar, cover, members_count, category, verified
			FROM communities ORDER BY members_count DESC LIMIT 50
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id, name, desc, avatar, cover, category string
				var membersCount int
				var isVerified bool
				if err := rows.Scan(&id, &name, &desc, &avatar, &cover, &membersCount, &category, &isVerified); err == nil {
					communities = append(communities, map[string]interface{}{"id": id, "name": name, "description": desc, "avatar": avatar, "cover": cover, "membersCount": membersCount, "category": category, "isVerified": isVerified})
				}
			}
			writeJSON(w, http.StatusOK, Response{Status: "ok", Data: communities})
			return
		}
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: communities})
}

func handleWallet(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Авторизация требуется"})
		return
	}
	if db != nil {
		var balance float64
		var currency string
		err := db.QueryRow("SELECT balance, currency FROM wallet_accounts WHERE user_id = $1", claims.UserID).Scan(&balance, &currency)
		if err != nil {
			// Create wallet if not exists
			db.Exec("INSERT INTO wallet_accounts (user_id, balance, currency) VALUES ($1, 0, 'RUB') ON CONFLICT DO NOTHING", claims.UserID)
			balance = 0
			currency = "RUB"
		}
		// Get recent transactions
		txRows, _ := db.Query(`
			SELECT id, type, amount, currency, description, created_at
			FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20
		`, claims.UserID)
		var transactions []map[string]interface{}
		if txRows != nil {
			defer txRows.Close()
			for txRows.Next() {
				var tid, txType, txCurrency, txDesc string
				var txAmount float64
				var txDate time.Time
				if txRows.Scan(&tid, &txType, &txAmount, &txCurrency, &txDesc, &txDate) == nil {
					transactions = append(transactions, map[string]interface{}{"id": tid, "type": txType, "amount": txAmount, "currency": txCurrency, "description": txDesc, "date": txDate.Format("02.01.2006")})
				}
			}
		}
		writeJSON(w, http.StatusOK, Response{Status: "ok", Data: map[string]interface{}{"balance": balance, "currency": currency, "transactions": transactions}})
		return
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: map[string]interface{}{"balance": 0, "currency": "RUB", "transactions": []interface{}{}}})
}

// requireAdmin проверяет JWT и роль admin для защищённых эндпоинтов
func requireAdmin(r *http.Request) (*JWTClaims, error) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		return nil, errors.New("Авторизация требуется")
	}
	if claims.Role != "admin" {
		return nil, errors.New("Доступ только для администраторов")
	}
	return claims, nil
}

func handleAdminStats(w http.ResponseWriter, r *http.Request) {
	if _, err := requireAdmin(r); err != nil {
		writeJSON(w, http.StatusForbidden, Response{Status: "error", Message: err.Error()})
		return
	}

	stats := map[string]interface{}{
		"dau":            0,
		"marketplaceGMV": 0,
		"revenue":        0,
		"pendingReports": 0,
	}

	// Подтягиваем реальные данные, если БД подключена
	if db != nil {
		var dau, pendingReports int
		if db.QueryRow("SELECT COUNT(*) FROM users").Scan(&dau) == nil {
			stats["dau"] = dau
		}
		if db.QueryRow("SELECT COUNT(*) FROM content_reports WHERE status = 'pending'").Scan(&pendingReports) == nil {
			stats["pendingReports"] = pendingReports
		}
	}

	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: stats})
}

// GET /api/auth/check-username?username=... — Проверка доступности уникального @username
func handleCheckUsername(w http.ResponseWriter, r *http.Request) {
	raw := strings.TrimSpace(r.URL.Query().Get("username"))
	username := strings.ToLower(strings.TrimPrefix(raw, "@"))

	if username == "" {
		writeJSON(w, http.StatusOK, Response{Status: "ok", Data: map[string]interface{}{"available": false, "message": "ID не может быть пустым"}})
		return
	}

	matched, _ := regexp.MatchString(`^[a-z0-9_]{3,30}$`, username)
	if !matched {
		writeJSON(w, http.StatusOK, Response{Status: "ok", Data: map[string]interface{}{
			"available": false,
			"message":   "Только латинские буквы a-z, цифры 0-9 и _ (от 3 до 30 знаков)",
		}})
		return
	}

	// Проверка в PostgreSQL
	if db != nil {
		var count int
		err := db.QueryRow("SELECT COUNT(*) FROM users WHERE LOWER(username) = $1", username).Scan(&count)
		if err == nil && count > 0 {
			writeJSON(w, http.StatusOK, Response{Status: "ok", Data: map[string]interface{}{
				"available": false,
				"message":   fmt.Sprintf("ID @%s уже занят", username),
			}})
			return
		}
	}

	// Проверка в памяти
	store.mu.RLock()
	defer store.mu.RUnlock()
	for _, entry := range store.accounts {
		if strings.ToLower(entry.User.Username) == username {
			writeJSON(w, http.StatusOK, Response{Status: "ok", Data: map[string]interface{}{
				"available": false,
				"message":   fmt.Sprintf("ID @%s уже занят", username),
			}})
			return
		}
	}

	for _, u := range mockUsers {
		if strings.ToLower(u.Username) == username {
			writeJSON(w, http.StatusOK, Response{Status: "ok", Data: map[string]interface{}{
				"available": false,
				"message":   fmt.Sprintf("ID @%s уже занят", username),
			}})
			return
		}
	}

	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: map[string]interface{}{
		"available": true,
		"message":   fmt.Sprintf("ID @%s свободен", username),
	}})
}

// POST /api/auth/register — Реальная регистрация с хешированием пароля и выдачей JWT
func handleRegister(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name          string `json:"name"`
		Username      string `json:"username"`
		EmailOrPhone  string `json:"emailOrPhone"`
		Password      string `json:"password"`
		Role          string `json:"role"`
		BeliefType    string `json:"beliefType"`
		BeliefPrivacy string `json:"beliefPrivacy"`
		Avatar        string `json:"avatar"`
		Location      string `json:"location"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Некорректные данные запроса"})
		return
	}

	cleanUsername := strings.ToLower(strings.TrimPrefix(strings.TrimSpace(req.Username), "@"))
	cleanEmailOrPhone := strings.ToLower(strings.TrimSpace(req.EmailOrPhone))

	if cleanUsername == "" || cleanEmailOrPhone == "" || req.Password == "" || strings.TrimSpace(req.Name) == "" {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Все обязательные поля должны быть заполнены"})
		return
	}

	// Валидация формата уникального ID (@username)
	matched, _ := regexp.MatchString(`^[a-z0-9_]{3,30}$`, cleanUsername)
	if !matched {
		writeJSON(w, http.StatusBadRequest, Response{
			Status:  "error",
			Message: "ID пользователя может содержать только латинские буквы, цифры и символ подчеркивания (от 3 до 30 символов)",
		})
		return
	}

	if len(req.Password) < 6 {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Пароль должен содержать не менее 6 символов"})
		return
	}

	// Проверка уникальности в PostgreSQL
	if db != nil {
		var count int
		err := db.QueryRow("SELECT COUNT(*) FROM users WHERE LOWER(username) = $1", cleanUsername).Scan(&count)
		if err == nil && count > 0 {
			writeJSON(w, http.StatusConflict, Response{Status: "error", Message: fmt.Sprintf("ID @%s уже занят. Выберите другой уникальный ID", cleanUsername)})
			return
		}
		var emailCount int
		err = db.QueryRow("SELECT COUNT(*) FROM users WHERE LOWER(email_or_phone) = $1", cleanEmailOrPhone).Scan(&emailCount)
		if err == nil && emailCount > 0 {
			writeJSON(w, http.StatusConflict, Response{Status: "error", Message: "Аккаунт с таким email или телефоном уже существует в базе"})
			return
		}
	}

	// Проверка на существующего пользователя в памяти
	store.mu.RLock()
	var duplicateFound string
	for _, entry := range store.accounts {
		if strings.ToLower(entry.User.Username) == cleanUsername {
			duplicateFound = fmt.Sprintf("ID @%s уже занят другим пользователем", cleanUsername)
			break
		}
		if strings.ToLower(entry.EmailOrPhone) == cleanEmailOrPhone {
			duplicateFound = "Аккаунт с таким email или телефоном уже существует"
			break
		}
	}
	store.mu.RUnlock()

	if duplicateFound != "" {
		writeJSON(w, http.StatusConflict, Response{Status: "error", Message: duplicateFound})
		return
	}

	newID := "u_" + uuid.New().String()[:12]
	avatar := req.Avatar
	if avatar == "" || strings.Contains(avatar, "unsplash") || strings.Contains(avatar, "dicebear") {
		avatar = "/default-avatar.svg"
	}

	role := req.Role
	if role == "" {
		role = "user"
	}

	salt := generateSalt(16)
	hash := hashPassword(req.Password, salt)

	loc := strings.TrimSpace(req.Location)
	if loc == "" {
		loc = "Россия"
	}

	newUser := User{
		ID:             newID,
		Name:           strings.TrimSpace(req.Name),
		Username:       cleanUsername,
		Avatar:         avatar,
		Location:       loc,
		Online:         true,
		Role:           role,
		BeliefType:     req.BeliefType,
		BeliefPrivacy:  req.BeliefPrivacy,
		FollowersCount: 1,
		FollowingCount: 0,
		CriticsCount:   0,
		PostsCount:     0,
	}

	// Сохранение в PostgreSQL, если БД подключена
	if db != nil {
		insertQuery := `
		INSERT INTO users (id, name, username, email_or_phone, password_hash, salt, avatar, location, role, belief_type, belief_privacy, followers_count, following_count, critics_count, posts_count, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		`
		_, err := db.Exec(insertQuery, newID, newUser.Name, cleanUsername, cleanEmailOrPhone, hash, salt, avatar, loc, role, req.BeliefType, req.BeliefPrivacy, 1, 0, 0, 0, time.Now())
		if err != nil {
			log.Printf("⚠️ Ошибка сохранения пользователя в Postgres: %v", err)
		} else {
			log.Printf("💾 Пользователь %s (@%s, %s) успешно сохранён в PostgreSQL!", newUser.Name, cleanUsername, loc)
		}
	}

	store.mu.Lock()
	store.accounts[newID] = AccountStoreEntry{
		User:         newUser,
		EmailOrPhone: cleanEmailOrPhone,
		PasswordHash: hash,
		Salt:         salt,
		CreatedAt:    time.Now(),
	}
	store.saveToDisk()
	store.mu.Unlock()

	mockUsersMu.Lock()
	mockUsers = append([]User{newUser}, mockUsers...)
	mockUsersMu.Unlock()

	token, err := generateJWT(newUser, cleanEmailOrPhone)
	if err != nil {
		log.Printf("Ошибка генерации JWT: %v", err)
		writeJSON(w, http.StatusInternalServerError, Response{Status: "error", Message: "Ошибка создания сессии"})
		return
	}

	writeJSON(w, http.StatusCreated, Response{
		Status:  "ok",
		Message: "Аккаунт успешно создан",
		Data: map[string]interface{}{
			"token": token,
			"user":  newUser,
		},
	})
}

// POST /api/auth/login — Проверка логина/пароля и выдача JWT (PostgreSQL + in-memory fallback)
func handleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Некорректные данные запроса"})
		return
	}

	target := strings.ToLower(strings.TrimPrefix(strings.TrimSpace(req.Login), "@"))
	if target == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Введите логин и пароль"})
		return
	}

	var foundAccount *AccountStoreEntry

	// Сначала проверяем в PostgreSQL, если подключена
	if db != nil {
		var u User
		var emailOrPhone, pwdHash, salt string
		var createdAt time.Time
		query := `
		SELECT id, name, username, email_or_phone, password_hash, salt, avatar, COALESCE(bio, ''), COALESCE(role, 'user'), COALESCE(belief_type, ''), COALESCE(belief_privacy, 'public'), COALESCE(verified, false), followers_count, following_count, critics_count, posts_count, created_at
		FROM users
		WHERE LOWER(username) = $1 OR LOWER(email_or_phone) = $1
		LIMIT 1
		`
		err := db.QueryRow(query, target).Scan(
			&u.ID, &u.Name, &u.Username, &emailOrPhone, &pwdHash, &salt, &u.Avatar, &u.Bio, &u.Role, &u.BeliefType, &u.BeliefPrivacy, &u.Verified, &u.FollowersCount, &u.FollowingCount, &u.CriticsCount, &u.PostsCount, &createdAt,
		)
		if err == nil {
			u.Online = true
			foundAccount = &AccountStoreEntry{
				User:         u,
				EmailOrPhone: emailOrPhone,
				PasswordHash: pwdHash,
				Salt:         salt,
				CreatedAt:    createdAt,
			}
		} else if err != sql.ErrNoRows {
			log.Printf("⚠️ Ошибка запроса к БД при логине: %v", err)
		}
	}

	// Если не найден в БД или БД недоступна — проверяем in-memory store
	if foundAccount == nil {
		store.mu.RLock()
		for _, entry := range store.accounts {
			if strings.ToLower(entry.User.Username) == target || strings.ToLower(entry.EmailOrPhone) == target {
				acc := entry
				foundAccount = &acc
				break
			}
		}
		store.mu.RUnlock()
	}

	if foundAccount == nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Пользователь не найден. Проверьте логин или зарегистрируйтесь."})
		return
	}

	// Проверка хеша пароля
	if !checkPassword(req.Password, foundAccount.Salt, foundAccount.PasswordHash) {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Неверный пароль"})
		return
	}

	// Убран глобальный currentUser — данные пользователя определяются из JWT в каждом запросе

	token, err := generateJWT(foundAccount.User, foundAccount.EmailOrPhone)
	if err != nil {
		log.Printf("Ошибка генерации JWT: %v", err)
		writeJSON(w, http.StatusInternalServerError, Response{Status: "error", Message: "Ошибка создания сессии"})
		return
	}

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: "Успешный вход",
		Data: map[string]interface{}{
			"token": token,
			"user":  foundAccount.User,
		},
	})
}

// getUserFromToken извлекает и верифицирует пользователя по JWT токену
func getUserFromToken(token string) (*User, error) {
	if token == "" {
		return nil, errors.New("токен авторизации отсутствует")
	}

	claims, err := parseAndValidateJWT(token)
	if err != nil {
		return nil, errors.New("недействительный или просроченный токен: " + err.Error())
	}

	var user *User

	// Ищем в PostgreSQL
	if db != nil {
		var u User
		query := `
		SELECT id, name, username, COALESCE(avatar, ''), COALESCE(bio, ''), COALESCE(role, 'user'), COALESCE(belief_type, ''), COALESCE(belief_privacy, 'public'), COALESCE(verified, false), COALESCE(followers_count, 0), COALESCE(following_count, 0), COALESCE(critics_count, 0), COALESCE(posts_count, 0)
		FROM users WHERE id = $1 LIMIT 1
		`
		err := db.QueryRow(query, claims.UserID).Scan(
			&u.ID, &u.Name, &u.Username, &u.Avatar, &u.Bio, &u.Role, &u.BeliefType, &u.BeliefPrivacy, &u.Verified, &u.FollowersCount, &u.FollowingCount, &u.CriticsCount, &u.PostsCount,
		)
		if err == nil {
			u.Online = true
			ensureUserAvatar(&u)
			u.FollowersCount, u.FollowingCount, u.FriendsCount = getDBRelationshipCounts(u.ID)
			user = &u
		}
	}

	// Fallback в in-memory store
	if user == nil {
		store.mu.RLock()
		account, exists := store.accounts[claims.UserID]
		store.mu.RUnlock()
		if exists {
			uCopy := account.User
			ensureUserAvatar(&uCopy)
			uCopy.FollowersCount, uCopy.FollowingCount, uCopy.FriendsCount = getRelationshipCounts(claims.UserID)
			user = &uCopy
		}
	}

	if user == nil {
		for _, mu := range mockUsers {
			if mu.ID == claims.UserID {
				uCopy := mu
				ensureUserAvatar(&uCopy)
				uCopy.FollowersCount, uCopy.FollowingCount, uCopy.FriendsCount = getRelationshipCounts(claims.UserID)
				user = &uCopy
				break
			}
		}
	}

	if user == nil {
		return nil, errors.New("пользователь не найден в базе")
	}

	ensureUserAvatar(user)
	return user, nil
}

// GET /api/auth/me — Валидация сессии по JWT Bearer токену
func handleAuthMe(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	if token == "" {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Токен авторизации отсутствует"})
		return
	}

	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Недействительный или просроченный токен: " + err.Error()})
		return
	}

	user, err := getUserFromToken(token)
	if err != nil || user == nil {
		writeJSON(w, http.StatusNotFound, Response{Status: "error", Message: "Пользователь не найден в базе"})
		return
	}

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]interface{}{
			"user":   *user,
			"claims": claims,
		},
	})
}

// POST /api/auth/send-code — Отправка SMS-кода (пока мок — код возвращается в ответе для тестирования)
func handleSendCode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Phone string `json:"phone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Неверный формат запроса"})
		return
	}
	if !strings.HasPrefix(req.Phone, "+") || len(req.Phone) < 10 {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Некорректный номер телефона"})
		return
	}

	if val, ok := smsCodesStore.Load(req.Phone); ok {
		entry := val.(smsCodeEntry)
		if time.Since(entry.SentAt) < 60*time.Second {
			writeJSON(w, http.StatusTooManyRequests, Response{Status: "error", Message: "Код уже был отправлен недавно"})
			return
		}
	}

	// Генерация криптографически стойкого SMS-кода
	codeBytes := make([]byte, 2)
	rand.Read(codeBytes)
	codeNum := 1000 + int(codeBytes[0])%9*1000 + int(codeBytes[1])%10*100 + int(codeBytes[0]^codeBytes[1])%10*10 + int(codeBytes[1]^codeBytes[0])%10
	if codeNum > 9999 { codeNum = codeNum % 9000 + 1000 }
	code := strconv.Itoa(codeNum)
	expiresIn := 300

	if db != nil {
		_, err := db.Exec(`
			INSERT INTO sms_verifications (id, phone_number, code, purpose, expires_at, attempts, is_used)
			VALUES ($1, $2, $3, 'login', NOW() + interval '5 minutes', 0, false)
		`, uuid.New().String(), req.Phone, code)
		if err != nil {
			log.Printf("Ошибка сохранения SMS-кода в БД: %v", err)
		}
	}

	smsCodesStore.Store(req.Phone, smsCodeEntry{
		Code:      code,
		Phone:     req.Phone,
		ExpiresAt: time.Now().Add(5 * time.Minute),
		SentAt:    time.Now(),
		Attempts:  0,
	})

	// SECURITY: SMS-код НЕ возвращается в ответе API.
	// В dev-режиме код логируется на сервере для отладки.
	if os.Getenv("APP_ENV") != "production" {
		log.Printf("📱 [DEV] SMS-код для %s: %s", req.Phone, code)
	}

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: "Код отправлен",
		Data: map[string]interface{}{
			"expires_in": expiresIn,
		},
	})
}

// POST /api/auth/verify-code — Проверка SMS-кода
func handleVerifyCode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Phone string `json:"phone"`
		Code  string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Неверный формат запроса"})
		return
	}

	valid := false
	if db != nil {
		var expiresAt time.Time
		var attempts int
		err := db.QueryRow(`
			SELECT expires_at, attempts FROM sms_verifications 
			WHERE phone_number = $1 AND code = $2 AND is_used = false AND purpose = 'login'
			ORDER BY created_at DESC LIMIT 1
		`, req.Phone, req.Code).Scan(&expiresAt, &attempts)
		if err == nil && time.Now().Before(expiresAt) {
			valid = true
			db.Exec("UPDATE sms_verifications SET is_used = true WHERE phone_number = $1 AND code = $2", req.Phone, req.Code)
		} else if err == nil {
			db.Exec("UPDATE sms_verifications SET attempts = attempts + 1 WHERE phone_number = $1 AND code = $2", req.Phone, req.Code)
		}
	}

	if !valid {
		if val, ok := smsCodesStore.Load(req.Phone); ok {
			entry := val.(smsCodeEntry)
			if entry.Code == req.Code && time.Now().Before(entry.ExpiresAt) {
				valid = true
				smsCodesStore.Delete(req.Phone)
			} else {
				entry.Attempts++
				smsCodesStore.Store(req.Phone, entry)
			}
		}
	}

	if !valid {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Неверный или просроченный код"})
		return
	}

	isNewUser := false
	var user User
	var err error

	if db != nil {
		err = db.QueryRow(`
			SELECT id, name, username, avatar, bio, location, verified 
			FROM users WHERE phone_number = $1 OR email_or_phone = $1
		`, req.Phone).Scan(&user.ID, &user.Name, &user.Username, &user.Avatar, &user.Bio, &user.Location, &user.Verified)
		if err == sql.ErrNoRows {
			isNewUser = true
			user.ID = "u_" + uuid.New().String()[:12]
			user.Username = "user_" + strconv.FormatInt(time.Now().UnixNano(), 10)[:8]
			user.Name = "Пользователь"
			salt := generateSalt(16)
			hash := hashPassword("nopassword", salt)
			_, err = db.Exec(`
				INSERT INTO users (id, phone_number, email_or_phone, username, name, password_hash, salt, created_at)
				VALUES ($1, $2, $2, $3, $4, $5, $6, NOW())
			`, user.ID, req.Phone, user.Username, user.Name, hash, salt)
		}
	} else {
		store.mu.Lock()
		found := false
		for _, acc := range store.accounts {
			if acc.EmailOrPhone == req.Phone {
				user = acc.User
				found = true
				break
			}
		}
		if !found {
			isNewUser = true
			user.ID = "u_" + uuid.New().String()[:12]
			user.Username = "user_" + strconv.FormatInt(time.Now().UnixNano(), 10)[:8]
			user.Name = "Пользователь"
			
			salt := generateSalt(16)
			hash := hashPassword("nopassword", salt)
			store.accounts[user.ID] = AccountStoreEntry{
				User:         user,
				EmailOrPhone: req.Phone,
				PasswordHash: hash,
				Salt:         salt,
				CreatedAt:    time.Now(),
			}
			store.saveToDisk()
		}
		store.mu.Unlock()
	}

	token, _ := generateJWT(user, req.Phone)

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]interface{}{
			"token":     token,
			"user":      user,
			"isNewUser": isNewUser,
		},
	})
}

// =========================================================================
// QR-КОД АВТОРИЗАЦИЯ (ВХОД ЧЕРЕЗ СМАРТФОН)
// =========================================================================

type QRSession struct {
	SessionID string    `json:"sessionId"`
	Status    string    `json:"status"` // "pending", "confirmed", "rejected", "expired"
	UserID    string    `json:"userId,omitempty"`
	User      *User     `json:"user,omitempty"`
	Token     string    `json:"token,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	ExpiresAt time.Time `json:"expiresAt"`
}

var (
	qrSessions   = make(map[string]*QRSession)
	qrSessionsMu sync.RWMutex
)

// GET /api/auth/qr/init — Инициализация сессии для входа по QR-коду
func handleQRInit(w http.ResponseWriter, r *http.Request) {
	sessionID := "qr_" + strings.ReplaceAll(uuid.New().String(), "-", "")[:16]
	session := &QRSession{
		SessionID: sessionID,
		Status:    "pending",
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(5 * time.Minute),
	}

	qrSessionsMu.Lock()
	qrSessions[sessionID] = session
	// Очищаем просроченные сессии
	for k, v := range qrSessions {
		if time.Now().After(v.ExpiresAt) {
			delete(qrSessions, k)
		}
	}
	qrSessionsMu.Unlock()

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]interface{}{
			"sessionId": sessionID,
			"expiresIn": 300,
		},
	})
}

// GET /api/auth/qr/status?session=... — Опрос статуса сессии QR-кода
func handleQRStatus(w http.ResponseWriter, r *http.Request) {
	sessionID := strings.TrimSpace(r.URL.Query().Get("session"))
	if sessionID == "" {
		sessionID = strings.TrimSpace(r.URL.Query().Get("sessionId"))
	}
	if sessionID == "" {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Параметр session обязателен"})
		return
	}

	qrSessionsMu.RLock()
	session, exists := qrSessions[sessionID]
	qrSessionsMu.RUnlock()

	if !exists || time.Now().After(session.ExpiresAt) {
		writeJSON(w, http.StatusOK, Response{
			Status: "ok",
			Data: map[string]interface{}{
				"sessionId":     sessionID,
				"sessionStatus": "expired",
			},
		})
		return
	}

	respData := map[string]interface{}{
		"sessionId":     session.SessionID,
		"sessionStatus": session.Status,
	}
	if session.Status == "confirmed" {
		respData["token"] = session.Token
		respData["user"] = session.User
	}

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data:   respData,
	})
}

// POST /api/auth/qr/confirm — Подтверждение входа с мобильного телефона
func handleQRConfirm(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SessionID string `json:"sessionId"`
		Token     string `json:"token"`
		User      *User  `json:"user,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Неверный формат запроса"})
		return
	}

	token := req.Token
	if token == "" {
		token = extractBearerToken(r)
	}

	user, err := getUserFromToken(token)
	if (err != nil || user == nil) && req.User != nil && req.User.ID != "" && req.User.ID != "guest" {
		user = req.User
		ensureUserAvatar(user)
	}
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Ошибка проверки авторизации"})
		return
	}

	qrSessionsMu.Lock()
	session, exists := qrSessions[req.SessionID]
	if !exists || time.Now().After(session.ExpiresAt) {
		qrSessionsMu.Unlock()
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Сессия QR-кода не найдена или истекла"})
		return
	}

	// Генерируем токен для новой авторизованной сессии
	newToken, _ := generateJWT(*user, user.Username)
	if newToken == "" {
		newToken = token
	}

	session.Status = "confirmed"
	session.Token = newToken
	session.User = user
	session.UserID = user.ID
	qrSessionsMu.Unlock()

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: "Вход успешно подтверждён",
		Data: map[string]interface{}{
			"user": user,
		},
	})
}

// POST /api/auth/qr/reject — Отклонение сессии QR-кода
func handleQRReject(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SessionID string `json:"sessionId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Неверный формат запроса"})
		return
	}

	qrSessionsMu.Lock()
	if session, exists := qrSessions[req.SessionID]; exists {
		session.Status = "rejected"
	}
	qrSessionsMu.Unlock()

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: "Вход отклонён",
	})
}

// =========================================================================
// РЕАЛЬНАЯ СИСТЕМА УВЕДОМЛЕНИЙ (NOTIFICATIONS SYSTEM)
// =========================================================================

type Notification struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	ActorID   string    `json:"actorId,omitempty"`
	Actor     *User     `json:"actor,omitempty"`
	Type      string    `json:"type"` // like, comment, follow, message, call, spiritual, system
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Link      string    `json:"link,omitempty"`
	IsRead    bool      `json:"isRead"`
	CreatedAt time.Time `json:"createdAt"`
}

var (
	inMemoryNotifications   = make(map[string][]*Notification)
	inMemoryNotificationsMu sync.RWMutex
)

func truncateString(s string, maxLen int) string {
	runes := []rune(s)
	if len(runes) <= maxLen {
		return s
	}
	return string(runes[:maxLen]) + "..."
}

func createNotification(userID, actorID, notifType, title, body, link string) *Notification {
	if userID == "" {
		return nil
	}
	notif := &Notification{
		ID:        "notif_" + strings.ReplaceAll(uuid.New().String(), "-", "")[:16],
		UserID:    userID,
		ActorID:   actorID,
		Type:      notifType,
		Title:     title,
		Body:      body,
		Link:      link,
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	// Resolve actor user info if available
	if actorID != "" {
		if db != nil {
			var a User
			err := db.QueryRow("SELECT id, name, username, COALESCE(avatar, '') FROM users WHERE id = $1", actorID).Scan(&a.ID, &a.Name, &a.Username, &a.Avatar)
			if err == nil {
				ensureUserAvatar(&a)
				notif.Actor = &a
			}
		}
		if notif.Actor == nil {
			store.mu.RLock()
			if acc, ok := store.accounts[actorID]; ok {
				uCopy := acc.User
				ensureUserAvatar(&uCopy)
				notif.Actor = &uCopy
			}
			store.mu.RUnlock()
		}
	}

	// Persist to PostgreSQL if available
	if db != nil {
		var aID *string
		if actorID != "" {
			aID = &actorID
		}
		_, err := db.Exec(`
			INSERT INTO notifications (id, user_id, actor_id, type, title, body, link, is_read, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`, notif.ID, notif.UserID, aID, notif.Type, notif.Title, notif.Body, notif.Link, notif.IsRead, notif.CreatedAt)
		if err != nil {
			log.Printf("⚠️ Error inserting notification to DB: %v", err)
		}
	}

	// Persist to in-memory store
	inMemoryNotificationsMu.Lock()
	inMemoryNotifications[userID] = append([]*Notification{notif}, inMemoryNotifications[userID]...)
	if len(inMemoryNotifications[userID]) > 100 {
		inMemoryNotifications[userID] = inMemoryNotifications[userID][:100]
	}
	inMemoryNotificationsMu.Unlock()

	return notif
}

// GET /api/notifications — Получение списка уведомлений пользователя
func handleGetNotifications(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	var notifs []*Notification
	unreadCount := 0

	if db != nil {
		rows, err := db.Query(`
			SELECT n.id, n.user_id, COALESCE(n.actor_id, ''), n.type, n.title, n.body, COALESCE(n.link, ''), n.is_read, n.created_at,
			       COALESCE(u.name, ''), COALESCE(u.username, ''), COALESCE(u.avatar, '')
			FROM notifications n
			LEFT JOIN users u ON n.actor_id = u.id
			WHERE n.user_id = $1
			ORDER BY n.created_at DESC LIMIT 50
		`, claims.UserID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var n Notification
				var aName, aUsername, aAvatar string
				if err := rows.Scan(&n.ID, &n.UserID, &n.ActorID, &n.Type, &n.Title, &n.Body, &n.Link, &n.IsRead, &n.CreatedAt, &aName, &aUsername, &aAvatar); err == nil {
					if n.ActorID != "" {
						n.Actor = &User{
							ID:       n.ActorID,
							Name:     aName,
							Username: aUsername,
							Avatar:   aAvatar,
						}
						ensureUserAvatar(n.Actor)
					}
					if !n.IsRead {
						unreadCount++
					}
					notifs = append(notifs, &n)
				}
			}
		}
	}

	// Fallback to in-memory if DB returned nothing or error
	if len(notifs) == 0 {
		inMemoryNotificationsMu.RLock()
		memList := inMemoryNotifications[claims.UserID]
		for _, n := range memList {
			nCopy := *n
			if !nCopy.IsRead {
				unreadCount++
			}
			notifs = append(notifs, &nCopy)
		}
		inMemoryNotificationsMu.RUnlock()
	}

	if notifs == nil {
		notifs = []*Notification{}
	}

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]interface{}{
			"notifications": notifs,
			"unreadCount":   unreadCount,
		},
	})
}

// POST /api/notifications/read — Отметить все уведомления как прочитанные
func handleMarkNotificationsRead(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	if db != nil {
		db.Exec("UPDATE notifications SET is_read = true WHERE user_id = $1", claims.UserID)
	}

	inMemoryNotificationsMu.Lock()
	if list, ok := inMemoryNotifications[claims.UserID]; ok {
		for _, n := range list {
			n.IsRead = true
		}
	}
	inMemoryNotificationsMu.Unlock()

	writeJSON(w, http.StatusOK, Response{Status: "ok", Message: "Все уведомления прочитаны"})
}

// POST /api/notifications/{id}/read — Отметить конкретное уведомление как прочитанное
func handleMarkSingleNotificationRead(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	notifID := r.PathValue("id")
	if db != nil {
		db.Exec("UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2", notifID, claims.UserID)
	}

	inMemoryNotificationsMu.Lock()
	if list, ok := inMemoryNotifications[claims.UserID]; ok {
		for _, n := range list {
			if n.ID == notifID {
				n.IsRead = true
				break
			}
		}
	}
	inMemoryNotificationsMu.Unlock()

	writeJSON(w, http.StatusOK, Response{Status: "ok", Message: "Уведомление прочитано"})
}

// DELETE /api/notifications/{id} — Удалить конкретное уведомление
func handleDeleteNotification(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	notifID := r.PathValue("id")
	if db != nil {
		db.Exec("DELETE FROM notifications WHERE id = $1 AND user_id = $2", notifID, claims.UserID)
	}

	inMemoryNotificationsMu.Lock()
	if list, ok := inMemoryNotifications[claims.UserID]; ok {
		var updated []*Notification
		for _, n := range list {
			if n.ID != notifID {
				updated = append(updated, n)
			}
		}
		inMemoryNotifications[claims.UserID] = updated
	}
	inMemoryNotificationsMu.Unlock()

	writeJSON(w, http.StatusOK, Response{Status: "ok", Message: "Уведомление удалено"})
}

// DELETE /api/notifications — Очистить все уведомления
func handleClearNotifications(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	if db != nil {
		db.Exec("DELETE FROM notifications WHERE user_id = $1", claims.UserID)
	}

	inMemoryNotificationsMu.Lock()
	delete(inMemoryNotifications, claims.UserID)
	inMemoryNotificationsMu.Unlock()

	writeJSON(w, http.StatusOK, Response{Status: "ok", Message: "Все уведомления удалены"})
}

// POST /api/notifications/test — Тестовое создание уведомления
func handleTestNotification(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	var req struct {
		Type string `json:"type"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	var notif *Notification
	switch req.Type {
	case "affirmation":
		notif = createNotification(claims.UserID, "", "spiritual", "🌅 Утренняя аффирмация New Age", "«Мой ум чист, сердце открыто, а день наполнен благополучием и созиданием.»", "/spiritual")
	case "breathing":
		notif = createNotification(claims.UserID, "", "spiritual", "🌬️ Время перезагрузки (Дыхание 4-7-8)", "Сделайте 2-минутную паузу на осознанное дыхание для снятия напряжения.", "/spiritual")
	case "gratitude":
		notif = createNotification(claims.UserID, "", "spiritual", "🌙 Вечерний дневник благодарности", "Вспомните и запишите 3 приятных момента уходящего дня перед сном.", "/spiritual")
	case "social":
		notif = createNotification(claims.UserID, "u_guru", "message", "💬 Новое сообщение", "Нейросетевой помощник отправил вам ответ на вопрос о духовных практиках.", "/messenger?chat=chat_ai_oracle")
	default:
		notif = createNotification(claims.UserID, "", "system", "🔔 Реальная система уведомлений активна", "Вы подключены к живому центру уведомлений New Age.", "/")
	}

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: "Уведомление успешно создано",
		Data:    notif,
	})
}

func getRelationshipCounts(targetID string) (followersCount, followingCount, friendsCount int) {
	store.mu.RLock()
	defer store.mu.RUnlock()

	userExists := func(id string) bool {
		if _, ok := store.accounts[id]; ok {
			return true
		}
		for _, mu := range mockUsers {
			if mu.ID == id {
				return true
			}
		}
		return false
	}

	following := store.relationships[targetID]
	validFollowingMap := make(map[string]bool)
	for _, id := range following {
		if userExists(id) {
			followingCount++
			validFollowingMap[id] = true
		}
	}

	for followerID, targets := range store.relationships {
		if followerID == targetID || !userExists(followerID) {
			continue
		}
		for _, tid := range targets {
			if tid == targetID {
				followersCount++
				if validFollowingMap[followerID] {
					friendsCount++
				}
				break
			}
		}
	}
	return
}

func getDBRelationshipCounts(targetID string) (followersCount, followingCount, friendsCount int) {
	if db == nil {
		return 0, 0, 0
	}
	cleanTarget := strings.ToLower(strings.TrimPrefix(targetID, "@"))
	var resolvedID, resolvedUsername string
	_ = db.QueryRow("SELECT id, username FROM users WHERE id = $1 OR LOWER(username) = LOWER($2) OR LOWER(username) = LOWER($1)", targetID, cleanTarget).Scan(&resolvedID, &resolvedUsername)
	if resolvedID == "" {
		resolvedID = targetID
	}
	if resolvedUsername == "" {
		resolvedUsername = cleanTarget
	}

	db.QueryRow(`
		SELECT COUNT(DISTINCT r.follower_id) 
		FROM user_relationships r 
		WHERE (r.target_id = $1 OR r.target_id = $2 OR LOWER(r.target_id) = LOWER($2)) AND r.rel_type = 'follow'
	`, resolvedID, resolvedUsername).Scan(&followersCount)

	db.QueryRow(`
		SELECT COUNT(DISTINCT r.target_id) 
		FROM user_relationships r 
		WHERE (r.follower_id = $1 OR r.follower_id = $2 OR LOWER(r.follower_id) = LOWER($2)) AND r.rel_type = 'follow'
	`, resolvedID, resolvedUsername).Scan(&followingCount)

	db.QueryRow(`
		SELECT COUNT(DISTINCT r1.target_id) FROM user_relationships r1
		JOIN user_relationships r2 ON (
			(r1.follower_id = r2.target_id OR LOWER(r1.follower_id) = LOWER(r2.target_id)) AND 
			(r1.target_id = r2.follower_id OR LOWER(r1.target_id) = LOWER(r2.follower_id))
		)
		WHERE (r1.follower_id = $1 OR r1.follower_id = $2 OR LOWER(r1.follower_id) = LOWER($2)) 
		  AND r1.rel_type = 'follow' AND r2.rel_type = 'follow'
	`, resolvedID, resolvedUsername).Scan(&friendsCount)
	return
}

// POST /api/users/{id}/follow & POST /api/friends/request/{id}
func handleFollow(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	rawTarget := r.PathValue("id")
	cleanTarget := strings.ToLower(strings.TrimPrefix(rawTarget, "@"))

	if db != nil {
		var targetID, targetUsername string
		_ = db.QueryRow("SELECT id, username FROM users WHERE id = $1 OR LOWER(username) = LOWER($2) OR LOWER(username) = LOWER($1)", rawTarget, cleanTarget).Scan(&targetID, &targetUsername)
		if targetID == "" {
			targetID = rawTarget
		}
		if targetUsername == "" {
			targetUsername = cleanTarget
		}

		var followerID, followerUsername string
		_ = db.QueryRow("SELECT id, username FROM users WHERE id = $1 OR LOWER(username) = LOWER($2) OR LOWER(username) = LOWER($1)", claims.UserID, strings.ToLower(claims.Username)).Scan(&followerID, &followerUsername)
		if followerID == "" {
			followerID = claims.UserID
		}
		if followerUsername == "" {
			followerUsername = strings.ToLower(claims.Username)
		}

		if followerID == targetID || (followerUsername != "" && followerUsername == targetUsername) {
			writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Нельзя подписаться на самого себя"})
			return
		}

		_, err = db.Exec(`
			INSERT INTO user_relationships (id, follower_id, target_id, rel_type)
			VALUES ($1, $2, $3, 'follow') ON CONFLICT DO NOTHING
		`, uuid.New().String(), followerID, targetID)
		if err != nil {
			log.Printf("⚠️ user_relationships insert fallback: %v", err)
			_, _ = db.Exec(`
				INSERT INTO user_relationships (id, follower_id, target_id, rel_type)
				VALUES ($1, $2, $3, 'follow') ON CONFLICT DO NOTHING
			`, uuid.New().String(), claims.UserID, rawTarget)
		}

		// Синхронизируем счетчики в таблице users
		db.Exec(`UPDATE users SET followers_count = (
			SELECT COUNT(DISTINCT r.follower_id) FROM user_relationships r 
			WHERE (r.target_id = $1 OR r.target_id = $2 OR LOWER(r.target_id) = LOWER($2)) AND r.rel_type = 'follow'
		) WHERE id = $1 OR LOWER(username) = LOWER($2)`, targetID, targetUsername)

		db.Exec(`UPDATE users SET following_count = (
			SELECT COUNT(DISTINCT r.target_id) FROM user_relationships r 
			WHERE (r.follower_id = $1 OR r.follower_id = $2 OR LOWER(r.follower_id) = LOWER($2)) AND r.rel_type = 'follow'
		) WHERE id = $1 OR LOWER(username) = LOWER($2)`, followerID, followerUsername)

		followers, _, friends := getDBRelationshipCounts(targetID)
		if followers == 0 {
			followers = 1
		}
		_, myFollowing, _ := getDBRelationshipCounts(followerID)
		if myFollowing == 0 {
			myFollowing = 1
		}

		var reverseCount int
		db.QueryRow(`
			SELECT COUNT(*) FROM user_relationships 
			WHERE (follower_id = $1 OR follower_id = $2 OR LOWER(follower_id) = LOWER($2)) 
			  AND (target_id = $3 OR target_id = $4 OR LOWER(target_id) = LOWER($4)) 
			  AND rel_type = 'follow'
		`, targetID, targetUsername, followerID, followerUsername).Scan(&reverseCount)
		isFriend := reverseCount > 0

		status := "pending"
		msg := "Вы подписались"
		if isFriend {
			status = "accepted"
			msg = "Взаимная подписка! Вы теперь друзья"
			createNotification(targetID, followerID, "friend_request", "Новый друг!", followerUsername+" и вы теперь друзья!", "/profile/@"+followerUsername)
		} else {
			createNotification(targetID, followerID, "follow", "Новый подписчик", followerUsername+" подписался(-ась) на ваши обновления", "/profile/@"+followerUsername)
		}

		writeJSON(w, http.StatusOK, Response{
			Status:  "ok",
			Message: msg,
			Data: map[string]interface{}{
				"status":         status,
				"isFollowed":     true,
				"isFriend":       isFriend,
				"followersCount": followers,
				"followingCount": myFollowing,
				"friendsCount":   friends,
			},
		})
		return
	}

	// In-memory store
	store.mu.Lock()
	targetID := rawTarget
	for id, acc := range store.accounts {
		if strings.ToLower(id) == cleanTarget || strings.ToLower(acc.User.Username) == cleanTarget {
			targetID = id
			break
		}
	}
	if targetID == rawTarget {
		for _, mu := range mockUsers {
			if strings.ToLower(mu.ID) == cleanTarget || strings.ToLower(mu.Username) == cleanTarget {
				targetID = mu.ID
				break
			}
		}
	}

	if claims.UserID == targetID {
		store.mu.Unlock()
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Нельзя подписаться на самого себя"})
		return
	}

	alreadyFollowing := false
	for _, tid := range store.relationships[claims.UserID] {
		if tid == targetID {
			alreadyFollowing = true
			break
		}
	}
	if !alreadyFollowing {
		store.relationships[claims.UserID] = append(store.relationships[claims.UserID], targetID)
	}
	store.saveToDisk()
	store.mu.Unlock()

	followers, _, friends := getRelationshipCounts(targetID)
	_, myFollowing, _ := getRelationshipCounts(claims.UserID)

	isFriend := false
	store.mu.RLock()
	for _, tid := range store.relationships[targetID] {
		if tid == claims.UserID {
			isFriend = true
			break
		}
	}
	store.mu.RUnlock()

	status := "pending"
	msg := "Вы подписались"
	if isFriend {
		status = "accepted"
		msg = "Взаимная подписка! Вы теперь друзья"
	}

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: msg,
		Data: map[string]interface{}{
			"status":         status,
			"isFollowed":     true,
			"isFriend":       isFriend,
			"followersCount": followers,
			"followingCount": myFollowing,
			"friendsCount":   friends,
		},
	})
}

// DELETE /api/users/{id}/follow & DELETE /api/friends/{id}
func handleUnfollow(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	rawTarget := r.PathValue("id")
	cleanTarget := strings.ToLower(strings.TrimPrefix(rawTarget, "@"))

	if db != nil {
		var targetID, targetUsername string
		_ = db.QueryRow("SELECT id, username FROM users WHERE id = $1 OR LOWER(username) = LOWER($2) OR LOWER(username) = LOWER($1)", rawTarget, cleanTarget).Scan(&targetID, &targetUsername)
		if targetID == "" {
			targetID = rawTarget
		}
		if targetUsername == "" {
			targetUsername = cleanTarget
		}

		var followerID, followerUsername string
		_ = db.QueryRow("SELECT id, username FROM users WHERE id = $1 OR LOWER(username) = LOWER($2) OR LOWER(username) = LOWER($1)", claims.UserID, strings.ToLower(claims.Username)).Scan(&followerID, &followerUsername)
		if followerID == "" {
			followerID = claims.UserID
		}
		if followerUsername == "" {
			followerUsername = strings.ToLower(claims.Username)
		}

		_, _ = db.Exec(`
			DELETE FROM user_relationships 
			WHERE (follower_id = $1 OR follower_id = $2 OR LOWER(follower_id) = LOWER($2)) 
			  AND (target_id = $3 OR target_id = $4 OR LOWER(target_id) = LOWER($4)) 
			  AND rel_type = 'follow'
		`, followerID, followerUsername, targetID, targetUsername)

		// Обновляем счетчики в users
		db.Exec(`UPDATE users SET followers_count = (
			SELECT COUNT(DISTINCT r.follower_id) FROM user_relationships r 
			WHERE (r.target_id = $1 OR r.target_id = $2 OR LOWER(r.target_id) = LOWER($2)) AND r.rel_type = 'follow'
		) WHERE id = $1 OR LOWER(username) = LOWER($2)`, targetID, targetUsername)

		db.Exec(`UPDATE users SET following_count = (
			SELECT COUNT(DISTINCT r.target_id) FROM user_relationships r 
			WHERE (r.follower_id = $1 OR r.follower_id = $2 OR LOWER(r.follower_id) = LOWER($2)) AND r.rel_type = 'follow'
		) WHERE id = $1 OR LOWER(username) = LOWER($2)`, followerID, followerUsername)

		followers, _, friends := getDBRelationshipCounts(targetID)
		_, myFollowing, _ := getDBRelationshipCounts(followerID)

		writeJSON(w, http.StatusOK, Response{
			Status:  "ok",
			Message: "Вы отписались",
			Data: map[string]interface{}{
				"status":         "none",
				"isFollowed":     false,
				"isFriend":       false,
				"followersCount": followers,
				"followingCount": myFollowing,
				"friendsCount":   friends,
			},
		})
		return
	}

	store.mu.Lock()
	targetID := rawTarget
	for id, acc := range store.accounts {
		if strings.ToLower(id) == cleanTarget || strings.ToLower(acc.User.Username) == cleanTarget {
			targetID = id
			break
		}
	}
	if targetID == rawTarget {
		for _, mu := range mockUsers {
			if strings.ToLower(mu.ID) == cleanTarget || strings.ToLower(mu.Username) == cleanTarget {
				targetID = mu.ID
				break
			}
		}
	}

	var updated []string
	for _, tid := range store.relationships[claims.UserID] {
		if tid != targetID {
			updated = append(updated, tid)
		}
	}
	store.relationships[claims.UserID] = updated
	store.saveToDisk()
	store.mu.Unlock()

	followers, _, friends := getRelationshipCounts(targetID)
	_, myFollowing, _ := getRelationshipCounts(claims.UserID)

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: "Вы отписались",
		Data: map[string]interface{}{
			"status":         "none",
			"isFollowed":     false,
			"isFriend":       false,
			"followersCount": followers,
			"followingCount": myFollowing,
			"friendsCount":   friends,
		},
	})
}

// GET /api/users/{id}/followers & GET /api/profile/{id}/followers
func handleFollowers(w http.ResponseWriter, r *http.Request) {
	targetID := r.PathValue("id")
	cleanTarget := strings.ToLower(strings.TrimPrefix(targetID, "@"))
	var followers []User

	if db != nil {
		var resolvedID, resolvedUsername string
		_ = db.QueryRow("SELECT id, username FROM users WHERE id = $1 OR LOWER(username) = LOWER($2)", targetID, cleanTarget).Scan(&resolvedID, &resolvedUsername)
		if resolvedID == "" {
			resolvedID = targetID
		}
		if resolvedUsername == "" {
			resolvedUsername = cleanTarget
		}
		rows, err := db.Query(`
			SELECT DISTINCT u.id, u.username, u.name, COALESCE(u.avatar, ''), COALESCE(u.bio, ''), COALESCE(u.location, ''), 
			       COALESCE(u.followers_count, 0), COALESCE(u.following_count, 0), COALESCE(u.posts_count, 0), COALESCE(u.verified, false),
			       COALESCE(u.online, false), COALESCE(u.last_seen, NOW() - INTERVAL '1 day')
			FROM users u
			JOIN user_relationships r ON (u.id = r.follower_id OR LOWER(u.username) = LOWER(r.follower_id))
			WHERE (r.target_id = $1 OR r.target_id = $2 OR LOWER(r.target_id) = LOWER($2)) AND r.rel_type = 'follow'
			ORDER BY u.name ASC
		`, resolvedID, resolvedUsername)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var u User
				var dbOnline bool
				var dbLastSeen time.Time
				rows.Scan(&u.ID, &u.Username, &u.Name, &u.Avatar, &u.Bio, &u.Location, &u.FollowersCount, &u.FollowingCount, &u.PostsCount, &u.Verified, &dbOnline, &dbLastSeen)
				userLastActiveMu.RLock()
				if memT, exists := userLastActive[u.ID]; exists && (dbLastSeen.IsZero() || memT.After(dbLastSeen)) {
					dbLastSeen = memT
				}
				userLastActiveMu.RUnlock()

				u.Online = isUserOnline(u.ID, dbOnline, dbLastSeen)
				if !dbLastSeen.IsZero() {
					u.LastSeen = dbLastSeen.Format(time.RFC3339)
					u.LastSeenText = formatLastSeen(dbLastSeen, u.Online)
				}
				ensureUserAvatar(&u)
				followers = append(followers, u)
			}
		}
	} else {
		store.mu.RLock()
		realTargetID := targetID
		for id, acc := range store.accounts {
			if strings.ToLower(id) == cleanTarget || strings.ToLower(acc.User.Username) == cleanTarget {
				realTargetID = id
				break
			}
		}
		if realTargetID == targetID {
			for _, mu := range mockUsers {
				if strings.ToLower(mu.ID) == cleanTarget || strings.ToLower(mu.Username) == cleanTarget {
					realTargetID = mu.ID
					break
				}
			}
		}

		for followerID, targetList := range store.relationships {
			for _, tid := range targetList {
				if tid == realTargetID {
					if acc, ok := store.accounts[followerID]; ok {
						u := acc.User
						ensureUserAvatar(&u)
						followers = append(followers, u)
					} else {
						for _, mu := range mockUsers {
							if mu.ID == followerID {
								u := mu
								ensureUserAvatar(&u)
								followers = append(followers, u)
								break
							}
						}
					}
					break
				}
			}
		}
		store.mu.RUnlock()
	}

	if followers == nil {
		followers = []User{}
	}

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]interface{}{
			"users": followers,
		},
	})
}

// GET /api/users/{id}/following & GET /api/profile/{id}/following
func handleFollowing(w http.ResponseWriter, r *http.Request) {
	targetID := r.PathValue("id")
	cleanTarget := strings.ToLower(strings.TrimPrefix(targetID, "@"))
	var following []User

	if db != nil {
		var resolvedID, resolvedUsername string
		_ = db.QueryRow("SELECT id, username FROM users WHERE id = $1 OR LOWER(username) = LOWER($2)", targetID, cleanTarget).Scan(&resolvedID, &resolvedUsername)
		if resolvedID == "" {
			resolvedID = targetID
		}
		if resolvedUsername == "" {
			resolvedUsername = cleanTarget
		}
		rows, err := db.Query(`
			SELECT DISTINCT u.id, u.username, u.name, COALESCE(u.avatar, ''), COALESCE(u.bio, ''), COALESCE(u.location, ''), 
			       COALESCE(u.followers_count, 0), COALESCE(u.following_count, 0), COALESCE(u.posts_count, 0), COALESCE(u.verified, false),
			       COALESCE(u.online, false), COALESCE(u.last_seen, NOW() - INTERVAL '1 day')
			FROM users u
			JOIN user_relationships r ON (u.id = r.target_id OR LOWER(u.username) = LOWER(r.target_id))
			WHERE (r.follower_id = $1 OR r.follower_id = $2 OR LOWER(r.follower_id) = LOWER($2)) AND r.rel_type = 'follow'
			ORDER BY u.name ASC
		`, resolvedID, resolvedUsername)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var u User
				var dbOnline bool
				var dbLastSeen time.Time
				rows.Scan(&u.ID, &u.Username, &u.Name, &u.Avatar, &u.Bio, &u.Location, &u.FollowersCount, &u.FollowingCount, &u.PostsCount, &u.Verified, &dbOnline, &dbLastSeen)
				userLastActiveMu.RLock()
				if memT, exists := userLastActive[u.ID]; exists && (dbLastSeen.IsZero() || memT.After(dbLastSeen)) {
					dbLastSeen = memT
				}
				userLastActiveMu.RUnlock()

				u.Online = isUserOnline(u.ID, dbOnline, dbLastSeen)
				if !dbLastSeen.IsZero() {
					u.LastSeen = dbLastSeen.Format(time.RFC3339)
					u.LastSeenText = formatLastSeen(dbLastSeen, u.Online)
				}
				ensureUserAvatar(&u)
				following = append(following, u)
			}
		}
	} else {
		store.mu.RLock()
		realTargetID := targetID
		for id, acc := range store.accounts {
			if strings.ToLower(id) == cleanTarget || strings.ToLower(acc.User.Username) == cleanTarget {
				realTargetID = id
				break
			}
		}
		if realTargetID == targetID {
			for _, mu := range mockUsers {
				if strings.ToLower(mu.ID) == cleanTarget || strings.ToLower(mu.Username) == cleanTarget {
					realTargetID = mu.ID
					break
				}
			}
		}

		if targets, ok := store.relationships[realTargetID]; ok {
			for _, tid := range targets {
				if acc, ok := store.accounts[tid]; ok {
					u := acc.User
					ensureUserAvatar(&u)
					following = append(following, u)
				} else {
					for _, mu := range mockUsers {
						if mu.ID == tid {
							u := mu
							ensureUserAvatar(&u)
							following = append(following, u)
							break
						}
					}
				}
			}
		}
		store.mu.RUnlock()
	}

	if following == nil {
		following = []User{}
	}

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]interface{}{
			"users": following,
		},
	})
}

// GET /api/users/{id}/friends & GET /api/profile/{id}/friends
func handleFriends(w http.ResponseWriter, r *http.Request) {
	targetID := r.PathValue("id")
	cleanTarget := strings.ToLower(strings.TrimPrefix(targetID, "@"))
	var users []User

	if db != nil {
		var resolvedID, resolvedUsername string
		_ = db.QueryRow("SELECT id, username FROM users WHERE id = $1 OR LOWER(username) = LOWER($2)", targetID, cleanTarget).Scan(&resolvedID, &resolvedUsername)
		if resolvedID == "" {
			resolvedID = targetID
		}
		if resolvedUsername == "" {
			resolvedUsername = cleanTarget
		}
		rows, err := db.Query(`
			SELECT u.id, u.username, u.name, COALESCE(u.avatar, ''), COALESCE(u.bio, ''), COALESCE(u.location, ''), COALESCE(u.verified, false),
			       COALESCE(u.online, false), COALESCE(u.last_seen, NOW() - INTERVAL '1 day')
			FROM users u
			WHERE u.id IN (
				SELECT r1.target_id FROM user_relationships r1
				JOIN user_relationships r2 ON (
					(r1.follower_id = r2.target_id OR LOWER(r1.follower_id) = LOWER(r2.target_id)) AND 
					(r1.target_id = r2.follower_id OR LOWER(r1.target_id) = LOWER(r2.follower_id))
				)
				WHERE (r1.follower_id = $1 OR r1.follower_id = $2 OR LOWER(r1.follower_id) = LOWER($2)) 
				  AND r1.rel_type = 'follow' AND r2.rel_type = 'follow'
			)
			ORDER BY u.name ASC
		`, resolvedID, resolvedUsername)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var u User
				var dbOnline bool
				var dbLastSeen time.Time
				rows.Scan(&u.ID, &u.Username, &u.Name, &u.Avatar, &u.Bio, &u.Location, &u.Verified, &dbOnline, &dbLastSeen)
				userLastActiveMu.RLock()
				if memT, exists := userLastActive[u.ID]; exists && (dbLastSeen.IsZero() || memT.After(dbLastSeen)) {
					dbLastSeen = memT
				}
				userLastActiveMu.RUnlock()

				u.Online = isUserOnline(u.ID, dbOnline, dbLastSeen)
				if !dbLastSeen.IsZero() {
					u.LastSeen = dbLastSeen.Format(time.RFC3339)
					u.LastSeenText = formatLastSeen(dbLastSeen, u.Online)
				}
				ensureUserAvatar(&u)
				u.IsFriend = true
				users = append(users, u)
			}
		}
	} else {
		store.mu.RLock()
		realTargetID := targetID
		for id, acc := range store.accounts {
			if strings.ToLower(id) == cleanTarget || strings.ToLower(acc.User.Username) == cleanTarget {
				realTargetID = id
				break
			}
		}
		if realTargetID == targetID {
			for _, mu := range mockUsers {
				if strings.ToLower(mu.ID) == cleanTarget || strings.ToLower(mu.Username) == cleanTarget {
					realTargetID = mu.ID
					break
				}
			}
		}

		targets := store.relationships[realTargetID]
		for _, tid := range targets {
			for _, rtid := range store.relationships[tid] {
				if rtid == realTargetID {
					var u User
					found := false
					if acc, ok := store.accounts[tid]; ok {
						u = acc.User
						found = true
					} else {
						for _, mu := range mockUsers {
							if mu.ID == tid {
								u = mu
								found = true
								break
							}
						}
					}
					if found {
						ensureUserAvatar(&u)
						u.IsFriend = true
						users = append(users, u)
					}
					break
				}
			}
		}
		store.mu.RUnlock()
	}

	if users == nil {
		users = []User{}
	}

	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: map[string]interface{}{"users": users}})
}

// GET /api/friends - текущий пользователь
func handleMyFriends(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "unauthorized"})
		return
	}
	r.SetPathValue("id", claims.UserID)
	handleFriends(w, r)
}

// GET /api/friends/requests - входящие ожидающие заявки (подписаны на меня, но я не в ответ)
func handleFriendRequests(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "unauthorized"})
		return
	}

	var pending []User
	if db != nil {
		rows, err := db.Query(`
			SELECT u.id, u.username, u.name, COALESCE(u.avatar, ''), COALESCE(u.bio, ''), COALESCE(u.location, ''), COALESCE(u.verified, false)
			FROM users u
			JOIN user_relationships r ON u.id = r.follower_id
			WHERE r.target_id = $1 AND r.rel_type = 'follow'
			  AND u.id NOT IN (
				  SELECT target_id FROM user_relationships WHERE follower_id = $1 AND rel_type = 'follow'
			  )
			ORDER BY r.created_at DESC
		`, claims.UserID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var u User
				rows.Scan(&u.ID, &u.Username, &u.Name, &u.Avatar, &u.Bio, &u.Location, &u.Verified)
				pending = append(pending, u)
			}
		}
	} else {
		store.mu.RLock()
		myFollowingMap := make(map[string]bool)
		for _, tid := range store.relationships[claims.UserID] {
			myFollowingMap[tid] = true
		}
		for followerID, targetList := range store.relationships {
			if followerID == claims.UserID {
				continue
			}
			for _, tid := range targetList {
				if tid == claims.UserID && !myFollowingMap[followerID] {
					if acc, ok := store.accounts[followerID]; ok {
						pending = append(pending, acc.User)
					} else {
						for _, mu := range mockUsers {
							if mu.ID == followerID {
								pending = append(pending, mu)
								break
							}
						}
					}
					break
				}
			}
		}
		store.mu.RUnlock()
	}

	if pending == nil {
		pending = []User{}
	}

	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: map[string]interface{}{"users": pending}})
}

// DELETE /api/users/{id}/friend — удалить из друзей (отписаться обоим)
func handleRemoveFriend(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "unauthorized"})
		return
	}

	rawTarget := r.PathValue("id")
	cleanTarget := strings.ToLower(strings.TrimPrefix(rawTarget, "@"))
	var targetID string

	if db != nil {
		err := db.QueryRow("SELECT id FROM users WHERE id = $1 OR LOWER(username) = LOWER($2)", rawTarget, cleanTarget).Scan(&targetID)
		if err != nil {
			targetID = rawTarget
		}

		// Remove both directions
		db.Exec(`DELETE FROM user_relationships WHERE follower_id = $1 AND target_id = $2 AND rel_type = 'follow'`, claims.UserID, targetID)
		db.Exec(`DELETE FROM user_relationships WHERE follower_id = $1 AND target_id = $2 AND rel_type = 'follow'`, targetID, claims.UserID)
		db.Exec("UPDATE users SET followers_count = (SELECT COUNT(*) FROM user_relationships r JOIN users u ON r.follower_id = u.id WHERE r.target_id = $1 AND r.rel_type = 'follow') WHERE id = $1", targetID)
		db.Exec("UPDATE users SET following_count = (SELECT COUNT(*) FROM user_relationships r JOIN users u ON r.target_id = u.id WHERE r.follower_id = $1 AND r.rel_type = 'follow') WHERE id = $1", targetID)
		db.Exec("UPDATE users SET followers_count = (SELECT COUNT(*) FROM user_relationships r JOIN users u ON r.follower_id = u.id WHERE r.target_id = $1 AND r.rel_type = 'follow') WHERE id = $1", claims.UserID)
		db.Exec("UPDATE users SET following_count = (SELECT COUNT(*) FROM user_relationships r JOIN users u ON r.target_id = u.id WHERE r.follower_id = $1 AND r.rel_type = 'follow') WHERE id = $1", claims.UserID)

		followers, _, friends := getDBRelationshipCounts(targetID)
		_, myFollowing, _ := getDBRelationshipCounts(claims.UserID)

		writeJSON(w, http.StatusOK, Response{
			Status:  "ok",
			Message: "Друг удалён",
			Data: map[string]interface{}{
				"status":         "none",
				"isFollowed":     false,
				"isFriend":       false,
				"followersCount": followers,
				"followingCount": myFollowing,
				"friendsCount":   friends,
			},
		})
		return
	}

	store.mu.Lock()
	targetID = rawTarget
	for id, acc := range store.accounts {
		if strings.ToLower(id) == cleanTarget || strings.ToLower(acc.User.Username) == cleanTarget {
			targetID = id
			break
		}
	}
	if targetID == rawTarget {
		for _, mu := range mockUsers {
			if strings.ToLower(mu.ID) == cleanTarget || strings.ToLower(mu.Username) == cleanTarget {
				targetID = mu.ID
				break
			}
		}
	}

	var updatedMe []string
	for _, tid := range store.relationships[claims.UserID] {
		if tid != targetID {
			updatedMe = append(updatedMe, tid)
		}
	}
	store.relationships[claims.UserID] = updatedMe

	var updatedFriend []string
	for _, tid := range store.relationships[targetID] {
		if tid != claims.UserID {
			updatedFriend = append(updatedFriend, tid)
		}
	}
	store.relationships[targetID] = updatedFriend
	store.saveToDisk()
	store.mu.Unlock()

	followers, _, friends := getRelationshipCounts(targetID)
	_, myFollowing, _ := getRelationshipCounts(claims.UserID)

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: "Друг удалён",
		Data: map[string]interface{}{
			"status":         "none",
			"isFollowed":     false,
			"isFriend":       false,
			"followersCount": followers,
			"followingCount": myFollowing,
			"friendsCount":   friends,
		},
	})
}

// GET /api/users/{id}/profile & GET /api/profile/{id}
func handleUserProfile(w http.ResponseWriter, r *http.Request) {
	targetID := r.PathValue("id")
	cleanTarget := strings.ToLower(strings.TrimPrefix(targetID, "@"))
	var user User
	
	token := extractBearerToken(r)
	claims, _ := parseAndValidateJWT(token)

	if db != nil {
		var dbOnline bool
		var dbLastSeen time.Time
		err := db.QueryRow(`
			SELECT id, username, name, COALESCE(avatar, ''), COALESCE(cover_image, ''), COALESCE(bio, ''), COALESCE(location, ''), 
			       COALESCE(website, ''), COALESCE(role, 'user'), COALESCE(belief_type, ''), COALESCE(belief_privacy, 'public'), 
			       COALESCE(birth_date, ''), COALESCE(gender, 'hidden'), COALESCE(show_birth_date, true), COALESCE(show_zodiac, true),
			       COALESCE(followers_count, 0), COALESCE(following_count, 0), COALESCE(posts_count, 0), COALESCE(verified, false),
			       COALESCE(online, false), COALESCE(last_seen, NOW() - INTERVAL '1 day')
			FROM users WHERE id = $1 OR LOWER(username) = LOWER($1) OR LOWER(username) = LOWER($2)
		`, targetID, cleanTarget).Scan(
			&user.ID, &user.Username, &user.Name, &user.Avatar, &user.CoverImage, &user.Bio, &user.Location,
			&user.Website, &user.Role, &user.BeliefType, &user.BeliefPrivacy,
			&user.BirthDate, &user.Gender, &user.ShowBirthDate, &user.ShowZodiac,
			&user.FollowersCount, &user.FollowingCount, &user.PostsCount, &user.Verified,
			&dbOnline, &dbLastSeen,
		)
		if err != nil {
			log.Printf("⚠️ handleUserProfile user not found or error for %s (%s): %v", targetID, cleanTarget, err)
			writeJSON(w, http.StatusNotFound, Response{Status: "error", Message: "Пользователь не найден"})
			return
		}
		userLastActiveMu.RLock()
		if memT, exists := userLastActive[user.ID]; exists && (dbLastSeen.IsZero() || memT.After(dbLastSeen)) {
			dbLastSeen = memT
		}
		userLastActiveMu.RUnlock()

		user.Online = isUserOnline(user.ID, dbOnline, dbLastSeen)
		if !dbLastSeen.IsZero() {
			user.LastSeen = dbLastSeen.Format(time.RFC3339)
			user.LastSeenText = formatLastSeen(dbLastSeen, user.Online)
		} else {
			user.LastSeenText = "Был(а) в сети недавно"
		}
		ensureUserAvatar(&user)
		
		// Accurate dynamic relationship counts
		user.FollowersCount, user.FollowingCount, user.FriendsCount = getDBRelationshipCounts(user.ID)

		// Clips count
		db.QueryRow(`SELECT COUNT(*) FROM clips WHERE user_id = $1`, user.ID).Scan(&user.ClipsCount)
		// Dynamic posts count from DB
		db.QueryRow(`SELECT COUNT(*) FROM posts WHERE user_id = $1`, user.ID).Scan(&user.PostsCount)

		if claims != nil {
			var count int
			db.QueryRow(`
				SELECT COUNT(*) FROM user_relationships 
				WHERE (follower_id = $1 OR follower_id = $2 OR LOWER(follower_id) = LOWER($2)) 
				  AND (target_id = $3 OR target_id = $4 OR LOWER(target_id) = LOWER($4)) 
				  AND rel_type = 'follow'
			`, claims.UserID, strings.ToLower(claims.Username), user.ID, strings.ToLower(user.Username)).Scan(&count)
			user.IsFollowed = count > 0

			// Check if mutual friends
			if user.IsFollowed {
				var reverseCount int
				db.QueryRow(`
					SELECT COUNT(*) FROM user_relationships 
					WHERE (follower_id = $1 OR follower_id = $2 OR LOWER(follower_id) = LOWER($2)) 
					  AND (target_id = $3 OR target_id = $4 OR LOWER(target_id) = LOWER($4)) 
					  AND rel_type = 'follow'
				`, user.ID, strings.ToLower(user.Username), claims.UserID, strings.ToLower(claims.Username)).Scan(&reverseCount)
				user.IsFriend = reverseCount > 0
			}
		}
	} else {
		store.mu.RLock()
		var foundAcc *AccountStoreEntry
		if acc, ok := store.accounts[targetID]; ok {
			foundAcc = &acc
		} else {
			for _, acc := range store.accounts {
				if strings.ToLower(acc.User.ID) == cleanTarget || strings.ToLower(acc.User.Username) == cleanTarget {
					foundAcc = &acc
					break
				}
			}
		}
		store.mu.RUnlock()
		if foundAcc == nil {
			for _, mu := range mockUsers {
				if strings.ToLower(mu.ID) == cleanTarget || strings.ToLower(mu.Username) == cleanTarget {
					user = mu
					foundAcc = &AccountStoreEntry{User: mu}
					break
				}
			}
		}
		if foundAcc == nil {
			writeJSON(w, http.StatusNotFound, Response{Status: "error", Message: "Пользователь не найден"})
			return
		}
		user = foundAcc.User

		// Accurate dynamic relationship counts in-memory
		user.FollowersCount, user.FollowingCount, user.FriendsCount = getRelationshipCounts(user.ID)

		// Accurate dynamic posts count
		postCount := 0
		store.mu.RLock()
		for _, p := range store.posts {
			if p.UserID == user.ID || (user.Username != "" && strings.ToLower(p.User.Username) == cleanTarget) || strings.ToLower(p.UserID) == cleanTarget {
				postCount++
			}
		}
		store.mu.RUnlock()
		user.PostsCount = postCount

		if claims != nil {
			store.mu.RLock()
			for _, tid := range store.relationships[claims.UserID] {
				if tid == user.ID {
					user.IsFollowed = true
					break
				}
			}
			if user.IsFollowed {
				for _, tid := range store.relationships[user.ID] {
					if tid == claims.UserID {
						user.IsFriend = true
						break
					}
				}
			}
			store.mu.RUnlock()
		}
	}

	ensureUserAvatar(&user)

	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: map[string]interface{}{"user": user}})
}

// PUT /api/profile
func handleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	var req struct {
		Name          string `json:"name"`
		Bio           string `json:"bio"`
		Avatar        string `json:"avatar"`
		CoverImage    string `json:"cover_image"`
		Location      string `json:"location"`
		Website       string `json:"website"`
		BeliefType    string `json:"belief_type"`
		BeliefPrivacy string `json:"belief_privacy"`
		BirthDate     string `json:"birth_date"`
		Gender        string `json:"gender"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Неверный формат запроса"})
		return
	}

	if db != nil {
		var targetID string
		db.QueryRow("SELECT id FROM users WHERE id = $1 OR LOWER(REPLACE(username, '@', '')) = LOWER(REPLACE($1, '@', '')) LIMIT 1", claims.UserID).Scan(&targetID)
		if targetID == "" {
			targetID = claims.UserID
		}

		_, err := db.Exec(`
			UPDATE users SET 
				name = COALESCE(NULLIF($1, ''), name), 
				bio = $2, 
				avatar = COALESCE(NULLIF($3, ''), avatar), 
				cover_image = COALESCE(NULLIF($4, ''), cover_image),
				location = $5, 
				website = $6,
				belief_type = $7, 
				belief_privacy = $8,
				birth_date = $9,
				gender = $10
			WHERE id = $11 OR LOWER(REPLACE(username, '@', '')) = LOWER(REPLACE($11, '@', ''))
		`, req.Name, req.Bio, req.Avatar, req.CoverImage, req.Location, req.Website, req.BeliefType, req.BeliefPrivacy, req.BirthDate, req.Gender, targetID)
		if err != nil {
			log.Printf("⚠️ Ошибка обновления профиля в DB: %v", err)
			writeJSON(w, http.StatusInternalServerError, Response{Status: "error", Message: "Ошибка обновления профиля"})
			return
		}
	}

	// Синхронизируем также с локальным дисковым хранилищем
	store.mu.Lock()
	accountKey := claims.UserID
	acc, ok := store.accounts[accountKey]
	if !ok {
		for k, a := range store.accounts {
			if a.User.ID == claims.UserID || strings.EqualFold(strings.TrimPrefix(a.User.Username, "@"), strings.TrimPrefix(claims.UserID, "@")) {
				accountKey = k
				acc = a
				ok = true
				break
			}
		}
	}
	if ok {
		if req.Name != "" { acc.User.Name = req.Name }
		acc.User.Bio = req.Bio
		if req.Avatar != "" { acc.User.Avatar = req.Avatar }
		if req.CoverImage != "" { acc.User.CoverImage = req.CoverImage }
		acc.User.Location = req.Location
		acc.User.Website = req.Website
		if req.BeliefType != "" { acc.User.BeliefType = req.BeliefType }
		if req.BeliefPrivacy != "" { acc.User.BeliefPrivacy = req.BeliefPrivacy }
		acc.User.BirthDate = req.BirthDate
		acc.User.Gender = req.Gender
		store.accounts[accountKey] = acc
	}
	store.saveToDisk()
	store.mu.Unlock()

	writeJSON(w, http.StatusOK, Response{Status: "ok", Message: "Профиль обновлен"})
}

// POST /api/posts
func handleCreatePost(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	var caption, image, location string

	contentType := r.Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		r.ParseMultipartForm(32 << 20)
		caption = r.FormValue("caption")
		location = r.FormValue("location")
		file, _, fileErr := r.FormFile("image")
		if fileErr == nil {
			defer file.Close()
			buf, _ := io.ReadAll(file)
			image = "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(buf)
		} else {
			image = r.FormValue("image")
		}
	} else {
		var req struct {
			Caption  string `json:"caption"`
			Image    string `json:"image"`
			Location string `json:"location"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			caption = req.Caption
			image = req.Image
			location = req.Location
		}
	}

	if strings.TrimSpace(caption) == "" && strings.TrimSpace(image) == "" {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Публикация не может быть пустой"})
		return
	}

	postID := "post_" + strconv.FormatInt(time.Now().UnixMilli(), 10)
	var author User
	var realUserID string
	if db != nil {
		db.QueryRow(`
			SELECT id, name, username, COALESCE(avatar, ''), COALESCE(verified, false) 
			FROM users 
			WHERE id = $1 OR LOWER(REPLACE(username, '@', '')) = LOWER(REPLACE($1, '@', '')) 
			LIMIT 1
		`, claims.UserID).Scan(
			&author.ID, &author.Name, &author.Username, &author.Avatar, &author.Verified,
		)
		if author.ID != "" {
			realUserID = author.ID
		}
	}
	if realUserID == "" {
		realUserID = claims.UserID
	}
	if author.ID == "" {
		store.mu.RLock()
		if acc, ok := store.accounts[claims.UserID]; ok {
			author = acc.User
		} else {
			for _, a := range store.accounts {
				if a.User.ID == claims.UserID || strings.EqualFold(strings.TrimPrefix(a.User.Username, "@"), strings.TrimPrefix(claims.UserID, "@")) {
					author = a.User
					break
				}
			}
		}
		store.mu.RUnlock()
	}
	if author.ID == "" {
		for _, mu := range mockUsers {
			if mu.ID == claims.UserID || mu.Username == claims.Username || strings.EqualFold(strings.TrimPrefix(mu.Username, "@"), strings.TrimPrefix(claims.Username, "@")) {
				author = mu
				break
			}
		}
	}
	if author.ID == "" {
		author = User{
			ID:       realUserID,
			Username: claims.Username,
			Name:     claims.Username,
		}
	}

	newPost := Post{
		ID:        postID,
		UserID:    realUserID,
		User:      author,
		Image:     image,
		Caption:   caption,
		Location:  location,
		Likes:     1,
		Liked:     true,
		Saved:     false,
		Comments:  []Comment{},
		TimeAgo:   "Только что",
		CreatedAt: time.Now(),
	}

	if db != nil {
		_, err := db.Exec(`
			INSERT INTO posts (id, user_id, image, caption, location)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (id) DO UPDATE SET 
				image = EXCLUDED.image,
				caption = EXCLUDED.caption,
				location = EXCLUDED.location
		`, postID, realUserID, image, caption, location)
		if err != nil {
			log.Printf("⚠️ Ошибка сохранения поста в Postgres: %v", err)
		} else {
			db.Exec("UPDATE users SET posts_count = posts_count + 1 WHERE id = $1", realUserID)
		}
	}

	// Всегда сохраняем в постоянное дисковое хранилище
	store.mu.Lock()
	store.posts = append([]Post{newPost}, store.posts...)
	if acc, ok := store.accounts[claims.UserID]; ok {
		acc.User.PostsCount++
		store.accounts[claims.UserID] = acc
	} else if acc, ok := store.accounts[realUserID]; ok {
		acc.User.PostsCount++
		store.accounts[realUserID] = acc
	}
	store.saveToDisk()
	store.mu.Unlock()

	globalCache.InvalidateTag("feed")

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: "Публикация успешно создана",
		Data:    newPost,
	})
}

// POST /api/posts/{id}/like
func handleLikePost(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	postID := r.PathValue("id")
	if db != nil {
		_, err := db.Exec(`
			INSERT INTO post_likes (post_id, user_id)
			VALUES ($1, $2) ON CONFLICT DO NOTHING
		`, postID, claims.UserID)
		if err == nil {
			db.Exec("UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1", postID)
			var postAuthorID string
			_ = db.QueryRow("SELECT user_id FROM posts WHERE id = $1", postID).Scan(&postAuthorID)
			if postAuthorID != "" && postAuthorID != claims.UserID {
				createNotification(postAuthorID, claims.UserID, "like", "Новый лайк", claims.Username+" оценил(а) вашу публикацию", "/post/"+postID)
			}
		}
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok"})
}

// DELETE /api/posts/{id}/like
func handleUnlikePost(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	postID := r.PathValue("id")
	if db != nil {
		res, err := db.Exec(`
			DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2
		`, postID, claims.UserID)
		if err == nil {
			affected, _ := res.RowsAffected()
			if affected > 0 {
				db.Exec("UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1", postID)
			}
		}
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok"})
}

// POST /api/posts/{id}/comments
func handleAddComment(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	postID := r.PathValue("id")
	var req struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Неверный формат запроса"})
		return
	}

	if db != nil {
		db.Exec(`
			INSERT INTO post_comments (post_id, user_id, content)
			VALUES ($1, $2, $3)
		`, postID, claims.UserID, req.Text)
		db.Exec("UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1", postID)

		var postAuthorID string
		_ = db.QueryRow("SELECT user_id FROM posts WHERE id = $1", postID).Scan(&postAuthorID)
		if postAuthorID != "" && postAuthorID != claims.UserID {
			createNotification(postAuthorID, claims.UserID, "comment", "Новый комментарий", claims.Username+" прокомментировал(а) ваш пост: "+truncateString(req.Text, 45), "/post/"+postID)
		}
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok"})
}

// GET /api/posts/{id}/comments
func handleGetComments(w http.ResponseWriter, r *http.Request) {
	postID := r.PathValue("id")
	var comments []map[string]interface{}

	if db != nil {
		rows, err := db.Query(`
			SELECT c.id, c.content, c.created_at, u.id, u.username, u.avatar 
			FROM post_comments c
			JOIN users u ON c.user_id = u.id
			WHERE c.post_id = $1
			ORDER BY c.created_at DESC
		`, postID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id, content, uid, username, avatar string
				var createdAt time.Time
				rows.Scan(&id, &content, &createdAt, &uid, &username, &avatar)
				comments = append(comments, map[string]interface{}{
					"id": id,
					"content": content,
					"created_at": createdAt,
					"user": map[string]string{
						"id": uid,
						"username": username,
						"avatar": avatar,
					},
				})
			}
		}
	}
	if comments == nil {
		comments = []map[string]interface{}{}
	}

	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: map[string]interface{}{"comments": comments}})
}

// DELETE /api/posts/{id}
func handleDeletePost(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	postID := r.PathValue("id")
	deleted := false

	if db != nil {
		var authorID, authorUsername string
		err := db.QueryRow(`
			SELECT p.user_id, COALESCE(u.username, '') 
			FROM posts p 
			LEFT JOIN users u ON p.user_id = u.id 
			WHERE p.id = $1
		`, postID).Scan(&authorID, &authorUsername)
		if err == nil {
			isOwner := authorID == claims.UserID || 
				strings.EqualFold(authorUsername, claims.Username) || 
				claims.Role == "admin"
			if isOwner {
				db.Exec("DELETE FROM posts WHERE id = $1", postID)
				db.Exec("UPDATE users SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = $1", authorID)
				deleted = true
			}
		}
	}

	// Always sync with persistent store
	store.mu.Lock()
	var updatedPosts []Post
	for _, p := range store.posts {
		if p.ID == postID {
			isOwner := p.UserID == claims.UserID || 
				strings.EqualFold(p.User.Username, claims.Username) || 
				claims.Role == "admin"
			if isOwner {
				deleted = true
				if acc, ok := store.accounts[p.UserID]; ok {
					if acc.User.PostsCount > 0 {
						acc.User.PostsCount--
						store.accounts[p.UserID] = acc
					}
				}
				continue
			}
		}
		updatedPosts = append(updatedPosts, p)
	}
	if deleted {
		store.posts = updatedPosts
		store.saveToDisk()
	}
	store.mu.Unlock()

	if deleted {
		globalCache.InvalidateTag("feed")
		writeJSON(w, http.StatusOK, Response{Status: "ok", Message: "Публикация успешно удалена"})
		return
	}

	writeJSON(w, http.StatusForbidden, Response{Status: "error", Message: "Нет прав для удаления или публикация не найдена"})
}

func handleStories(w http.ResponseWriter, r *http.Request) {
	var stories []Story

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()

	if dbConn != nil {
		// Clean up expired stories (> 24 hours) from PostgreSQL
		_, _ = dbConn.Exec(`DELETE FROM stories WHERE (expires_at IS NOT NULL AND expires_at <= NOW()) OR (expires_at IS NULL AND created_at < NOW() - INTERVAL '24 hours')`)

		rows, err := dbConn.Query(`
			SELECT s.id, s.media_url, COALESCE(s.is_video, false), COALESCE(s.is_live, false), COALESCE(s.live_viewers, 0),
			       COALESCE(s.filter, ''), COALESCE(s.mask, ''), COALESCE(s.text_content, ''),
			       COALESCE(s.text_position, 'bottom'), COALESCE(s.gradient, ''), COALESCE(s.viewers_count, 0),
			       s.created_at, s.expires_at,
			       COALESCE(u.id, s.user_id), COALESCE(u.username, s.user_id), COALESCE(u.name, s.user_id), COALESCE(u.avatar, '')
			FROM stories s 
			LEFT JOIN users u ON (s.user_id = u.id OR LOWER(REPLACE(s.user_id, '@', '')) = LOWER(REPLACE(u.username, '@', '')))
			WHERE (s.expires_at IS NOT NULL AND s.expires_at > NOW())
			   OR (s.expires_at IS NULL AND s.created_at > (NOW() - INTERVAL '24 hours'))
			ORDER BY s.created_at DESC
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var sid, mediaUrl, filter, mask, textContent, textPos, gradient, uid, uusername, uname, uavatar string
				var isVideo, isLive bool
				var liveViewers, viewersCount int
				var createdAt, expiresAt time.Time
				if err := rows.Scan(
					&sid, &mediaUrl, &isVideo, &isLive, &liveViewers,
					&filter, &mask, &textContent, &textPos, &gradient, &viewersCount,
					&createdAt, &expiresAt,
					&uid, &uusername, &uname, &uavatar,
				); err == nil {
					u := User{
						ID:       uid,
						Username: uusername,
						Name:     uname,
						Avatar:   uavatar,
					}
					ensureUserAvatar(&u)

					var img, vid string
					if isVideo {
						vid = mediaUrl
					} else {
						img = mediaUrl
					}

					stories = append(stories, Story{
						ID:           sid,
						User:         u,
						Viewed:       false,
						Image:        img,
						VideoURL:     vid,
						MediaURL:     mediaUrl,
						Gradient:     gradient,
						IsLive:       isLive,
						LiveViewers:  liveViewers,
						Filter:       filter,
						Mask:         mask,
						Text:         textContent,
						TextPosition: textPos,
						ViewsCount:   viewersCount,
						Timestamp:    formatTimeAgo(createdAt),
						ExpiresAt:    expiresAt.Format(time.RFC3339),
						CreatedAt:    createdAt.Format(time.RFC3339),
					})
				}
			}
		} else {
			log.Printf("⚠️ Ошибка выборки stories из PostgreSQL: %v", err)
		}
	}

	// Filter and clean expired in-memory stories (> 24 hours)
	now := time.Now()
	store.mu.Lock()
	validMemStories := make([]Story, 0, len(store.stories))
	for _, s := range store.stories {
		isExpired := false
		if s.ExpiresAt != "" {
			if exp, err := time.Parse(time.RFC3339, s.ExpiresAt); err == nil && !now.Before(exp) {
				isExpired = true
			}
		} else if s.CreatedAt != "" {
			if cr, err := time.Parse(time.RFC3339, s.CreatedAt); err == nil && now.Sub(cr) >= 24*time.Hour {
				isExpired = true
			}
		}
		if !isExpired {
			validMemStories = append(validMemStories, s)
		}
	}
	store.stories = validMemStories
	store.mu.Unlock()

	// Объединяем с активными сторис в памяти
	store.mu.RLock()
	existingIDs := make(map[string]bool)
	for _, s := range stories {
		existingIDs[s.ID] = true
	}
	for _, s := range store.stories {
		if !existingIDs[s.ID] {
			ensureUserAvatar(&s.User)
			stories = append(stories, s)
			existingIDs[s.ID] = true
		}
	}
	store.mu.RUnlock()

	if stories == nil {
		stories = []Story{}
	}

	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: stories})
}

func handleClips(w http.ResponseWriter, r *http.Request) {
	if db != nil {
		rows, err := db.Query(`
			SELECT c.id, c.video_url, COALESCE(c.poster, ''), COALESCE(c.caption, ''), COALESCE(c.likes_count, 0), COALESCE(c.views_count, 0), COALESCE(c.comments_count, 0), c.created_at,
				u.id, u.name, u.username, COALESCE(u.avatar, '')
			FROM clips c JOIN users u ON c.user_id = u.id
			ORDER BY c.created_at DESC LIMIT 50
		`)
		if err == nil {
			defer rows.Close()
			var clips []map[string]interface{}
			for rows.Next() {
				var cid, videoUrl, poster, caption, uid, uname, uusername, uavatar string
				var likesCount, viewsCount, commentsCount int
				var createdAt time.Time
				if rows.Scan(&cid, &videoUrl, &poster, &caption, &likesCount, &viewsCount, &commentsCount, &createdAt, &uid, &uname, &uusername, &uavatar) == nil {
					clips = append(clips, map[string]interface{}{
						"id":            cid,
						"videoUrl":      videoUrl,
						"poster":        poster,
						"caption":       caption,
						"likesCount":    likesCount,
						"viewsCount":    viewsCount,
						"commentsCount": commentsCount,
						"sharesCount":   0,
						"user": map[string]interface{}{
							"id":       uid,
							"name":     uname,
							"username": uusername,
							"avatar":   uavatar,
						},
					})
				}
			}
			if clips == nil {
				clips = []map[string]interface{}{}
			}
			writeJSON(w, http.StatusOK, Response{Status: "ok", Data: clips})
			return
		}
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: []interface{}{}})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Ошибка записи JSON: %v", err)
	}
}

// ==================== ИИ ОРАКУЛ — Gemini AI Chat ====================

const oracleSystemPrompt = `Ты — ИИ Оракул, мудрый цифровой помощник платформы New Age — мультифункциональной социальной экосистемы.

ТВОЯ РОЛЬ:
• Ты духовный наставник, жизненный коуч и мудрый советник
• Ты помогаешь людям в вопросах морали, этики, духовного развития, религии, философии и повседневной жизни
• Ты уважаешь ВСЕ религии и духовные традиции — буддизм, ислам, христианство, индуизм, даосизм, иудаизм и другие
• Ты НЕ навязываешь никакую конкретную религию, а помогаешь человеку найти СВОЙ путь

🌍 МНОГОЯЗЫЧНОСТЬ (MULTILINGUAL - ВАЖНЕЙШЕЕ ПРАВИЛО):
• ТЫ В СОВЕРШЕНСТВЕ ВЛАДЕЕШЬ ВСЕМИ ЯЗЫКАМИ МИРА (Русский, English, Español, Deutsch, Français, 中文, العربية, Türkçe, Қазақша, O'zbekcha, Italiano, Português, 日本語, 한국어, हिन्दी, Українська, Polski и любыми другими).
• ВСЕГДА АВТОМАТИЧЕСКИ ОПРЕДЕЛЯЙ ЯЗЫК, на котором к тебе обратился пользователь, и отвечай СТРОГО на этом же языке!
• Если пользователь пишет на английском — отвечай на безупречном английском.
• Если на испанском — отвечай на испанском.
• Если на немецком — отвечай на немецком.
• Если на французском — отвечай на французском.
• Если на китайском — отвечай на китайском.
• Если на арабском — отвечай на арабском.
• Если на турецком — отвечай на турецком.
• Если на казахском — отвечай на казахском.
• Если на узбекском — отвечай на узбекском.
• Если пользователь прямо просит говорить на определённом языке или перевести что-то (например: "speak in English", "отвечай на испанском", "habla en español", "türkçe konuş", "қазақша жаз", "uzbekcha gapir") — мгновенно переключайся на запрошенный язык.
• Никогда не принуждай пользователя к русскому языку, если обращение было на другом языке!

СТИЛЬ ОБЩЕНИЯ:
• Говори тепло, с эмпатией, глубокой мудростью и уважением к собеседнику
• Используй эмодзи умеренно (✨ 🙏 💫 🌟 💡) для выразительности
• Будь конкретным — давай практичные советы, а не абстрактные фразы
• Если вопрос сложный — предложи посмотреть на ситуацию с разных сторон
• Можешь цитировать мудрость из разных традиций (Будда, Руми, Библия, Коран, Бхагавад-Гита, стоики Марк Аврелий и Сенека, Лао-Цзы, Конфуций, Сократ, Абай Кунанбаев и другие великие мыслители)

ЧТО ТЫ УМЕЕШЬ:
• Жизненные советы — отношения, семья, карьера, финансы, здоровье, самореализация
• Духовное развитие — медитация, осознанность, практики, самопознание, внутренний покой
• Моральные дилеммы — помоги разобраться что правильно и найти гармонию
• Религиозные и этические вопросы — расскажи о разных традициях с глубоким уважением
• Эмоциональная поддержка — выслушай, поддержи, дай надежду и душевное спокойствие
• Мотивация — вдохнови на действия и позитивные перемены
• Помощь с платформой New Age — объясни любые функции приложения (лента, видео, клипы, маркетплейс, сообщества, чаты, знакомства, духовные практики)
• Тексты и перевод — помогай формулировать мысли, писать посты и переводить между любыми языками

ОГРАНИЧЕНИЯ:
• НЕ давай медицинских диагнозов — направляй к врачу
• НЕ давай юридических консультаций — направляй к юристу
• НЕ поддерживай насилие, ненависть или дискриминацию
• Если человеку очень плохо — аккуратно направь к профессиональной помощи

Отвечай содержательно, структурированно и красиво, но не слишком длинно — 2-4 абзаца максимум.`

type aiChatRequest struct {
	Message string `json:"message"`
	Voice   bool   `json:"voice"`
	History []struct {
		Role string `json:"role"`
		Text string `json:"text"`
	} `json:"history"`
}

// Дополнение к системному промпту для живого голосового разговора
const oracleVoicePrompt = `

ВАЖНО: сейчас идёт ЖИВОЙ ГОЛОСОВОЙ диалог, твой ответ озвучивается пользователю вслух через динамик.
- Отвечай МГНОВЕННО и КРАТКО: строго 1–2 живых предложения (до 20-25 слов максимум).
- Сразу к сути мысли, без вводных фраз и пауз.
- Категорически запрещены любые списки, markdown, спецсимволы, смайлы, латиница.
- Общайся тепло, дружелюбно, как настоящий чуткий собеседник.`

func handleAIChat(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != "POST" {
		writeJSON(w, 405, map[string]string{"error": "method not allowed"})
		return
	}

	var req aiChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, map[string]string{"error": "invalid request"})
		return
	}

	if strings.TrimSpace(req.Message) == "" {
		writeJSON(w, 400, map[string]string{"error": "empty message"})
		return
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		// Без API ключа — используем встроенные ответы
		reply := getLocalAIReply(req.Message)
		writeJSON(w, 200, map[string]interface{}{
			"status": "ok",
			"reply":  reply,
			"source": "local",
		})
		return
	}

	// Формируем Gemini API запрос
	contents := []map[string]interface{}{}

	// Добавляем историю диалога (последние 10 сообщений)
	history := req.History
	// Фронтенд иногда кладёт текущее сообщение и в историю — убираем дубль
	if n := len(history); n > 0 && history[n-1].Role != "assistant" && history[n-1].Role != "model" &&
		strings.TrimSpace(history[n-1].Text) == strings.TrimSpace(req.Message) {
		history = history[:n-1]
	}
	historyLimit := 10
	startIdx := 0
	if len(history) > historyLimit {
		startIdx = len(history) - historyLimit
	}
	for _, h := range history[startIdx:] {
		if strings.TrimSpace(h.Text) == "" {
			continue
		}
		role := "user"
		if h.Role == "assistant" || h.Role == "model" {
			role = "model"
		}
		contents = append(contents, map[string]interface{}{
			"role":  role,
			"parts": []map[string]string{{"text": h.Text}},
		})
	}

	// Текущее сообщение
	contents = append(contents, map[string]interface{}{
		"role":  "user",
		"parts": []map[string]string{{"text": req.Message}},
	})

	sysPrompt := oracleSystemPrompt
	maxTokens := 8192
	models := []string{"gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.8-flash"}
	var thinkingConfig map[string]interface{}

	if req.Voice {
		sysPrompt += oracleVoicePrompt
		maxTokens = 200 // Короткие ответы: минимальное время генерации и мгновенный TTS
		thinkingConfig = map[string]interface{}{
			"thinkingBudget": 0, // Без задержки на длительное размышление
		}
		models = []string{"gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.8-flash"} // Сверхбыстрая flash модель
	}

	genConfig := map[string]interface{}{
		"temperature":     0.7,
		"topP":            0.9,
		"maxOutputTokens": maxTokens,
	}
	if thinkingConfig != nil {
		genConfig["thinkingConfig"] = thinkingConfig
	}

	geminiBody := map[string]interface{}{
		"contents": contents,
		"systemInstruction": map[string]interface{}{
			"parts": []map[string]string{{"text": sysPrompt}},
		},
		"generationConfig": genConfig,
	}

	bodyBytes, _ := json.Marshal(geminiBody)
	var lastErr string

	for _, model := range models {
		url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey)
		reqTimeout := 25 * time.Second
		if req.Voice {
			reqTimeout = 10 * time.Second
		}
		ctx, cancel := context.WithTimeout(r.Context(), reqTimeout)

		httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(bodyBytes))
		if err != nil {
			cancel()
			log.Printf("[AI] Ошибка создания запроса для %s: %v", model, err)
			lastErr = err.Error()
			continue
		}
		httpReq.Header.Set("Content-Type", "application/json")

		resp, err := http.DefaultClient.Do(httpReq)
		if err != nil {
			cancel()
			log.Printf("[AI] Gemini API (%s) ошибка: %v", model, err)
			lastErr = err.Error()
			continue
		}

		respBody, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		cancel()

		if resp.StatusCode == 503 || resp.StatusCode == 429 {
			log.Printf("[AI] Модель %s перегружена (%d), пробуем следующую...", model, resp.StatusCode)
			lastErr = fmt.Sprintf("model %s: %d", model, resp.StatusCode)
			continue
		}

		if resp.StatusCode != 200 {
			log.Printf("[AI] Gemini API (%s) %d: %s", model, resp.StatusCode, string(respBody[:min(len(respBody), 500)]))
			lastErr = fmt.Sprintf("model %s: %d", model, resp.StatusCode)
			continue
		}

		// Parse Gemini response
		var geminiResp struct {
			Candidates []struct {
				Content struct {
					Parts []struct {
						Text string `json:"text"`
					} `json:"parts"`
				} `json:"content"`
			} `json:"candidates"`
		}

		if err := json.Unmarshal(respBody, &geminiResp); err != nil || len(geminiResp.Candidates) == 0 {
			log.Printf("[AI] Parse error (%s): %v", model, err)
			lastErr = "parse error"
			continue
		}

		reply := ""
		for _, p := range geminiResp.Candidates[0].Content.Parts {
			reply += p.Text
		}

		if strings.TrimSpace(reply) == "" {
			lastErr = "empty reply"
			continue
		}

		log.Printf("[AI] Ответ от модели %s (длина %d)", model, len(reply))
		writeJSON(w, 200, map[string]interface{}{
			"status": "ok",
			"reply":  reply,
			"source": "gemini",
			"model":  model,
		})
		return
	}

	// Все модели отказали — fallback
	log.Printf("[AI] Все модели недоступны: %s — используем локальные ответы", lastErr)
	writeJSON(w, 200, map[string]interface{}{
		"status": "ok",
		"reply":  getLocalAIReply(req.Message),
		"source": "local",
	})
}

// ==================== NEURAL TEXT-TO-SPEECH (TTS) ====================

var (
	ttsCacheMu sync.RWMutex
	ttsCache   = make(map[string][]byte)
	ttsClient  = &http.Client{Timeout: 8 * time.Second}
)

func cleanTextForTTS(raw string) string {
	// Remove markdown code blocks, links, headers, formatting
	s := regexp.MustCompile(`(?s)\x60\x60\x60.*?\x60\x60\x60`).ReplaceAllString(raw, " ")
	s = regexp.MustCompile(`\x60.*?\x60`).ReplaceAllString(s, " ")
	s = regexp.MustCompile(`\[([^\]]+)\]\([^\)]+\)`).ReplaceAllString(s, "$1")
	s = regexp.MustCompile(`https?://\S+`).ReplaceAllString(s, " ")
	replacer := strings.NewReplacer("*", " ", "_", " ", "#", " ", ">", " ", "~", " ", "`", " ", "|", " ")
	s = replacer.Replace(s)

	// Filter out emoji and symbols that cause robotic glitching
	var b strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || unicode.IsSpace(r) ||
			r == '.' || r == ',' || r == '!' || r == '?' || r == '-' || r == ':' || r == ';' || r == '—' || r == '«' || r == '»' || r == '"' {
			b.WriteRune(r)
		} else {
			b.WriteRune(' ')
		}
	}
	res := strings.Join(strings.Fields(b.String()), " ")
	return strings.TrimSpace(res)
}

func splitTextIntoTTSChunks(text string, maxLen int) []string {
	runes := []rune(text)
	if len(runes) <= maxLen {
		return []string{text}
	}
	var chunks []string
	for len(runes) > 0 {
		if len(runes) <= maxLen {
			chunks = append(chunks, string(runes))
			break
		}
		cut := maxLen
		foundCut := false
		for i := maxLen; i >= maxLen/2; i-- {
			if runes[i] == '.' || runes[i] == '!' || runes[i] == '?' {
				cut = i + 1
				foundCut = true
				break
			}
		}
		if !foundCut {
			for i := maxLen; i >= maxLen/3; i-- {
				if runes[i] == ',' || runes[i] == ';' || runes[i] == ':' {
					cut = i + 1
					foundCut = true
					break
				}
			}
		}
		if !foundCut {
			for i := maxLen; i >= 1; i-- {
				if unicode.IsSpace(runes[i]) {
					cut = i
					foundCut = true
					break
				}
			}
		}
		chunk := strings.TrimSpace(string(runes[:cut]))
		if chunk != "" {
			chunks = append(chunks, chunk)
		}
		if cut < len(runes) {
			runes = []rune(strings.TrimSpace(string(runes[cut:])))
		} else {
			break
		}
	}
	return chunks
}

func fetchGoogleTTSChunk(chunk, lang string) ([]byte, error) {
	ttsURL := fmt.Sprintf("https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=%s&q=%s",
		url.QueryEscape(lang), url.QueryEscape(chunk))
	req, err := http.NewRequest("GET", ttsURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
	req.Header.Set("Referer", "https://translate.google.com/")
	req.Header.Set("Accept", "*/*")

	resp, err := ttsClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("tts upstream returned status %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

func handleAITTS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var rawText, lang string
	if r.Method == "POST" {
		var req struct {
			Text string `json:"text"`
			Lang string `json:"lang"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req)
		rawText = req.Text
		lang = req.Lang
	}
	if rawText == "" {
		rawText = r.URL.Query().Get("text")
		if rawText == "" {
			rawText = r.URL.Query().Get("q")
		}
	}
	if lang == "" {
		lang = r.URL.Query().Get("lang")
		if lang == "" {
			lang = "ru"
		}
	}

	clean := cleanTextForTTS(rawText)
	if clean == "" {
		http.Error(w, "empty text", http.StatusBadRequest)
		return
	}

	if len([]rune(clean)) > 600 {
		clean = string([]rune(clean)[:600])
	}

	voice := strings.TrimSpace(r.URL.Query().Get("voice"))
	if voice == "" {
		voice = "Sulafat" // тёплый, мягкий живой голос
	}

	cacheKey := lang + ":" + voice + ":" + clean
	ttsCacheMu.RLock()
	cachedAudio, exists := ttsCache[cacheKey]
	ttsCacheMu.RUnlock()

	if exists && len(cachedAudio) > 0 {
		writeTTSAudio(w, cachedAudio)
		return
	}

	// 1) Нейронный Gemini TTS — живой, естественный голос с интонациями
	finalBytes, err := synthesizeGeminiTTS(r.Context(), clean, voice)
	if err != nil {
		log.Printf("[TTS] Gemini TTS недоступен: %v — используем резервный синтез", err)
		// 2) Резерв: Google Translate TTS
		chunks := splitTextIntoTTSChunks(clean, 130)
		var combined bytes.Buffer
		for _, chunk := range chunks {
			if strings.TrimSpace(chunk) == "" {
				continue
			}
			b, cErr := fetchGoogleTTSChunk(chunk, lang)
			if cErr != nil {
				log.Printf("[TTS Error] chunk '%s': %v", chunk, cErr)
				continue
			}
			combined.Write(b)
		}
		finalBytes = combined.Bytes()
	}

	if len(finalBytes) == 0 {
		http.Error(w, "failed to synthesize speech", http.StatusBadGateway)
		return
	}

	ttsCacheMu.Lock()
	if len(ttsCache) > 300 {
		count := 0
		for k := range ttsCache {
			delete(ttsCache, k)
			count++
			if count > 150 {
				break
			}
		}
	}
	ttsCache[cacheKey] = finalBytes
	ttsCacheMu.Unlock()

	writeTTSAudio(w, finalBytes)
}

func writeTTSAudio(w http.ResponseWriter, data []byte) {
	ct := "audio/mpeg"
	if len(data) > 12 && string(data[0:4]) == "RIFF" && string(data[8:12]) == "WAVE" {
		ct = "audio/wav"
	}
	w.Header().Set("Content-Type", ct)
	w.Header().Set("Content-Length", strconv.Itoa(len(data)))
	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Cache-Control", "public, max-age=86400")
	_, _ = w.Write(data)
}

// pcmToWAV оборачивает сырой PCM (s16le) в WAV-контейнер
func pcmToWAV(pcm []byte, sampleRate, channels, bitsPerSample int) []byte {
	byteRate := sampleRate * channels * bitsPerSample / 8
	blockAlign := channels * bitsPerSample / 8
	var buf bytes.Buffer
	le32 := func(v int) { buf.Write([]byte{byte(v), byte(v >> 8), byte(v >> 16), byte(v >> 24)}) }
	le16 := func(v int) { buf.Write([]byte{byte(v), byte(v >> 8)}) }
	buf.WriteString("RIFF")
	le32(36 + len(pcm))
	buf.WriteString("WAVE")
	buf.WriteString("fmt ")
	le32(16)
	le16(1)
	le16(channels)
	le32(sampleRate)
	le32(byteRate)
	le16(blockAlign)
	le16(bitsPerSample)
	buf.WriteString("data")
	le32(len(pcm))
	buf.Write(pcm)
	return buf.Bytes()
}

// synthesizeGeminiTTS — естественная человеческая речь через Gemini TTS, возвращает WAV
func synthesizeGeminiTTS(parent context.Context, text, voice string) ([]byte, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, errors.New("GEMINI_API_KEY not set")
	}

	if voice == "" {
		voice = "Sulafat"
	}

	body := map[string]interface{}{
		"contents": []map[string]interface{}{
			{"parts": []map[string]string{{"text": text}}},
		},
		"generationConfig": map[string]interface{}{
			"responseModalities": []string{"AUDIO"},
			"speechConfig": map[string]interface{}{
				"voiceConfig": map[string]interface{}{
					"prebuiltVoiceConfig": map[string]string{"voiceName": voice},
				},
			},
		},
	}
	bodyBytes, _ := json.Marshal(body)

	models := []string{"gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts"}
	var lastErr error
	for _, model := range models {
		apiURL := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey)
		ctx, cancel := context.WithTimeout(parent, 25*time.Second)
		req, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewReader(bodyBytes))
		if err != nil {
			cancel()
			lastErr = err
			continue
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("x-goog-api-key", apiKey)

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			cancel()
			lastErr = err
			continue
		}
		respBody, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		cancel()

		if resp.StatusCode != 200 {
			lastErr = fmt.Errorf("%s: %d %s", model, resp.StatusCode, string(respBody[:min(len(respBody), 300)]))
			continue
		}

		var gr struct {
			Candidates []struct {
				Content struct {
					Parts []struct {
						InlineData struct {
							MimeType string `json:"mimeType"`
							Data     string `json:"data"`
						} `json:"inlineData"`
					} `json:"parts"`
				} `json:"content"`
			} `json:"candidates"`
		}
		if err := json.Unmarshal(respBody, &gr); err != nil || len(gr.Candidates) == 0 {
			lastErr = fmt.Errorf("%s: bad response", model)
			continue
		}
		var pcm []byte
		mime := ""
		for _, p := range gr.Candidates[0].Content.Parts {
			if p.InlineData.Data == "" {
				continue
			}
			b, dErr := base64.StdEncoding.DecodeString(p.InlineData.Data)
			if dErr != nil {
				continue
			}
			pcm = append(pcm, b...)
			mime = p.InlineData.MimeType
		}
		if len(pcm) == 0 {
			lastErr = fmt.Errorf("%s: empty audio", model)
			continue
		}

		rate := 24000
		if m := regexp.MustCompile(`rate=(\d+)`).FindStringSubmatch(mime); len(m) == 2 {
			if v, e := strconv.Atoi(m[1]); e == nil && v > 0 {
				rate = v
			}
		}
		log.Printf("[TTS] Gemini %s, голос %s: %d байт PCM (%d Hz)", model, voice, len(pcm), rate)
		return pcmToWAV(pcm, rate, 1, 16), nil
	}
	return nil, lastErr
}

// POST /api/ai/stt — Speech-to-Text transcription via Gemini multimodal audio
func handleAISTT(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		writeJSON(w, 200, map[string]interface{}{
			"status":  "ok",
			"text":    "",
			"warning": "GEMINI_API_KEY not configured",
		})
		return
	}

	var audioBytes []byte
	mimeType := "audio/webm"

	contentType := r.Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		err := r.ParseMultipartForm(15 << 20) // 15MB
		if err == nil {
			file, header, fErr := r.FormFile("audio")
			if fErr == nil {
				defer file.Close()
				audioBytes, _ = io.ReadAll(file)
				if ct := header.Header.Get("Content-Type"); ct != "" {
					mimeType = ct
				}
			}
		}
	} else if strings.HasPrefix(contentType, "application/json") {
		var req struct {
			Audio    string `json:"audio"`
			MimeType string `json:"mimeType"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			if b, bErr := base64.StdEncoding.DecodeString(req.Audio); bErr == nil {
				audioBytes = b
			}
			if req.MimeType != "" {
				mimeType = req.MimeType
			}
		}
	} else if strings.HasPrefix(contentType, "audio/") {
		mimeType = strings.Split(contentType, ";")[0]
		audioBytes, _ = io.ReadAll(r.Body)
	}

	if len(audioBytes) == 0 {
		writeJSON(w, 400, map[string]interface{}{
			"status":  "error",
			"message": "empty audio data",
		})
		return
	}

	cleanMime := strings.Split(mimeType, ";")[0]
	if cleanMime == "" {
		cleanMime = "audio/webm"
	}

	b64Audio := base64.StdEncoding.EncodeToString(audioBytes)
	audioPart := map[string]interface{}{
		"inlineData": map[string]string{
			"mimeType": cleanMime,
			"data":     b64Audio,
		},
	}

	promptBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"role": "user",
				"parts": []interface{}{
					map[string]string{
						"text": "Транскрибируй русскую речь из аудио. Напиши только распознанные слова без кавычек, префиксов и комментариев. Если звуков членораздельной речи нет — выведи пустую строку.",
					},
					audioPart,
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"temperature":     0.0,
			"maxOutputTokens": 128,
			"thinkingConfig": map[string]interface{}{
				"thinkingBudget": 0,
			},
		},
	}

	type sttAttempt struct {
		model string
		body  map[string]interface{}
	}
	attempts := []sttAttempt{
		{model: "gemini-2.5-flash", body: promptBody},
		{model: "gemini-3.5-flash", body: promptBody},
		{model: "gemini-3.8-flash", body: promptBody},
		{
			model: "gemini-3.5-transcribe",
			body: map[string]interface{}{
				"contents": []map[string]interface{}{
					{"parts": []interface{}{audioPart}},
				},
				"generationConfig": map[string]interface{}{
					"audioTranscriptionConfig": map[string]interface{}{
						"mode": "SMART",
					},
				},
			},
		},
	}

	var transcript string
	for _, at := range attempts {
		bodyBytes, _ := json.Marshal(at.body)
		apiURL := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", at.model, apiKey)
		ctx, cancel := context.WithTimeout(r.Context(), 7*time.Second)
		httpReq, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewReader(bodyBytes))
		if err != nil {
			cancel()
			continue
		}
		httpReq.Header.Set("Content-Type", "application/json")
		httpReq.Header.Set("x-goog-api-key", apiKey)

		resp, err := http.DefaultClient.Do(httpReq)
		if err != nil {
			cancel()
			log.Printf("[STT] %s error: %v", at.model, err)
			continue
		}
		respBody, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		cancel()

		if resp.StatusCode != 200 {
			log.Printf("[STT] %s HTTP %d: %s", at.model, resp.StatusCode, string(respBody[:min(len(respBody), 250)]))
			continue
		}

		var geminiResp struct {
			Candidates []struct {
				Content struct {
					Parts []struct {
						Text string `json:"text"`
					} `json:"parts"`
				} `json:"content"`
			} `json:"candidates"`
		}

		if err := json.Unmarshal(respBody, &geminiResp); err == nil && len(geminiResp.Candidates) > 0 {
			var candidateText string
			for _, p := range geminiResp.Candidates[0].Content.Parts {
				candidateText += p.Text
			}
			candidateText = strings.Trim(strings.TrimSpace(candidateText), "\"«»")
			if candidateText != "" {
				transcript = candidateText
				log.Printf("[STT] ✅ Успешно расшифровано моделью %s: '%s'", at.model, transcript)
				break
			}
		}

		// Попытка извлечь вложенный текст из нестандартного ответа
		var genericMap map[string]interface{}
		if err := json.Unmarshal(respBody, &genericMap); err == nil {
			if candList, ok := genericMap["candidates"].([]interface{}); ok && len(candList) > 0 {
				if firstCand, ok := candList[0].(map[string]interface{}); ok {
					if content, ok := firstCand["content"].(map[string]interface{}); ok {
						if parts, ok := content["parts"].([]interface{}); ok {
							for _, partItem := range parts {
								if partMap, ok := partItem.(map[string]interface{}); ok {
									if txt, ok := partMap["text"].(string); ok && strings.TrimSpace(txt) != "" {
										transcript = strings.Trim(strings.TrimSpace(txt), "\"«»")
										log.Printf("[STT] ✅ Успешно извлечён текст %s: '%s'", at.model, transcript)
										break
									}
								}
							}
						}
					}
				}
			}
		}

		if transcript != "" {
			break
		}
		log.Printf("[STT] %s ответила 200, но текст пуст. Пробуем следующую модель...", at.model)
	}

	log.Printf("[STT] Итог аудио (%d байт, %s): '%s'", len(audioBytes), cleanMime, transcript)

	writeJSON(w, 200, map[string]interface{}{
		"status": "ok",
		"text":   transcript,
	})
}

// GET /api/chats/{id}/messages — get messages for a chat
func handleGetMessages(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, 401, Response{Status: "error", Message: "unauthorized"})
		return
	}

	chatID := r.PathValue("id")
	if chatID == "" {
		writeJSON(w, 400, Response{Status: "error", Message: "chat id required"})
		return
	}

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()
	if dbConn == nil {
		writeJSON(w, 503, Response{Status: "error", Message: "db not connected"})
		return
	}

	var isMember bool
	err = dbConn.QueryRow(`SELECT EXISTS(SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2)`, chatID, claims.UserID).Scan(&isMember)
	if err != nil || !isMember {
		var isOwner bool
		_ = dbConn.QueryRow(`SELECT EXISTS(SELECT 1 FROM chats WHERE id = $1 AND owner_id = $2)`, chatID, claims.UserID).Scan(&isOwner)
		if !isOwner {
			writeJSON(w, 403, Response{Status: "error", Message: "access denied: not a chat member"})
			return
		}
	}

	rows, err := dbConn.Query(`
		SELECT m.id, m.text, m.media_url, m.media_type, m.sender_id, m.created_at, m.is_read, u.name, u.avatar
		FROM messages m 
		JOIN users u ON m.sender_id = u.id 
		WHERE m.chat_id = $1 
		ORDER BY m.created_at ASC LIMIT 100`, chatID)
	if err != nil {
		writeJSON(w, 500, Response{Status: "error", Message: err.Error()})
		return
	}
	defer rows.Close()

	messages := make([]map[string]interface{}, 0)
	for rows.Next() {
		var (
			id, text, mediaUrl, mediaType, senderId, name, avatarUrl sql.NullString
			createdAt                                                  time.Time
			isRead                                                     bool
		)
		if err := rows.Scan(&id, &text, &mediaUrl, &mediaType, &senderId, &createdAt, &isRead, &name, &avatarUrl); err != nil {
			continue
		}
		messages = append(messages, map[string]interface{}{
			"id":         id.String,
			"text":       text.String,
			"media_url":  mediaUrl.String,
			"media_type": mediaType.String,
			"sender_id":  senderId.String,
			"created_at": createdAt,
			"is_read":    isRead,
			"name":       name.String,
			"avatar_url": avatarUrl.String,
		})
	}

	// Mark messages as read where sender_id != currentUser
	dbConn.Exec(`UPDATE messages SET is_read = true, status = 'read' WHERE chat_id = $1 AND sender_id != $2 AND is_read = false`, chatID, claims.UserID)
	dbConn.Exec(`UPDATE chat_members SET unread_count = 0 WHERE chat_id = $1 AND user_id = $2`, chatID, claims.UserID)

	writeJSON(w, 200, Response{Status: "ok", Data: messages})
}

// POST /api/chats/{id}/messages — send message
func handleSendMessage(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, 401, Response{Status: "error", Message: "unauthorized"})
		return
	}

	chatID := r.PathValue("id")

	var req struct {
		Text      string `json:"text"`
		MediaUrl  string `json:"mediaUrl"`
		MediaType string `json:"mediaType"`
		ReplyToId string `json:"replyToId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, Response{Status: "error", Message: "invalid json"})
		return
	}

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()
	if dbConn == nil {
		writeJSON(w, 503, Response{Status: "error", Message: "db not connected"})
		return
	}

	var isMember bool
	err = dbConn.QueryRow(`SELECT EXISTS(SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2)`, chatID, claims.UserID).Scan(&isMember)
	if err != nil || !isMember {
		var isOwner bool
		_ = dbConn.QueryRow(`SELECT EXISTS(SELECT 1 FROM chats WHERE id = $1 AND owner_id = $2)`, chatID, claims.UserID).Scan(&isOwner)
		if !isOwner {
			writeJSON(w, 403, Response{Status: "error", Message: "access denied: not a chat member"})
			return
		}
	}

	msgID := uuid.New().String()
	_, err = dbConn.Exec(`
		INSERT INTO messages (id, chat_id, sender_id, reply_to_id, text, media_url, media_type, status, is_read, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent', false, NOW())
	`, msgID, chatID, claims.UserID, req.ReplyToId, req.Text, req.MediaUrl, req.MediaType)
	if err != nil {
		writeJSON(w, 500, Response{Status: "error", Message: err.Error()})
		return
	}

	dbConn.Exec(`UPDATE chats SET last_message = $1, last_message_at = NOW() WHERE id = $2`, req.Text, chatID)
	dbConn.Exec(`UPDATE chat_members SET unread_count = unread_count + 1 WHERE chat_id = $1 AND user_id != $2`, chatID, claims.UserID)

	writeJSON(w, 200, Response{Status: "ok", Data: map[string]string{"id": msgID}})
}

// POST /api/chats/direct — create or get direct chat
func handleCreateDirectChat(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, 401, Response{Status: "error", Message: "unauthorized"})
		return
	}

	var req struct {
		UserId string `json:"userId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, Response{Status: "error", Message: "invalid json"})
		return
	}

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()
	if dbConn == nil {
		writeJSON(w, 503, Response{Status: "error", Message: "db not connected"})
		return
	}

	var chatID string
	err = dbConn.QueryRow(`
		SELECT c.id 
		FROM chats c
		JOIN chat_members m1 ON c.id = m1.chat_id
		JOIN chat_members m2 ON c.id = m2.chat_id
		WHERE c.is_group = false AND m1.user_id = $1 AND m2.user_id = $2
		LIMIT 1
	`, claims.UserID, req.UserId).Scan(&chatID)

	if err == sql.ErrNoRows {
		chatID = uuid.New().String()
		_, err = dbConn.Exec(`INSERT INTO chats (id, is_group, owner_id) VALUES ($1, false, $2)`, chatID, claims.UserID)
		if err != nil {
			writeJSON(w, 500, Response{Status: "error", Message: err.Error()})
			return
		}
		dbConn.Exec(`INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1, $2, 'member')`, chatID, claims.UserID)
		if claims.UserID != req.UserId {
			dbConn.Exec(`INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1, $2, 'member')`, chatID, req.UserId)
		}
	} else if err != nil {
		writeJSON(w, 500, Response{Status: "error", Message: err.Error()})
		return
	}

	writeJSON(w, 200, Response{Status: "ok", Data: map[string]string{"id": chatID}})
}

// POST /api/chats/{id}/read — mark messages as read  
func handleMarkRead(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, 401, Response{Status: "error", Message: "unauthorized"})
		return
	}

	chatID := r.PathValue("id")

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()
	if dbConn == nil {
		writeJSON(w, 503, Response{Status: "error", Message: "db not connected"})
		return
	}

	dbConn.Exec(`UPDATE messages SET is_read = true, status = 'read' WHERE chat_id = $1 AND sender_id != $2`, chatID, claims.UserID)
	dbConn.Exec(`UPDATE chat_members SET unread_count = 0 WHERE chat_id = $1 AND user_id = $2`, chatID, claims.UserID)

	writeJSON(w, 200, Response{Status: "ok"})
}

// POST /api/communities — create community
func handleCreateCommunity(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, 401, Response{Status: "error", Message: "unauthorized"})
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, Response{Status: "error", Message: "invalid json"})
		return
	}

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()
	if dbConn == nil {
		writeJSON(w, 503, Response{Status: "error", Message: "db not connected"})
		return
	}

	commID := uuid.New().String()
	_, err = dbConn.Exec(`
		INSERT INTO communities (id, name, description, creator_id, member_count, is_public) 
		VALUES ($1, $2, $3, $4, 1, true)
	`, commID, req.Name, req.Description, claims.UserID)
	if err != nil {
		writeJSON(w, 500, Response{Status: "error", Message: err.Error()})
		return
	}

	dbConn.Exec(`INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, 'owner')`, commID, claims.UserID)

	writeJSON(w, 200, Response{Status: "ok", Data: map[string]string{"id": commID}})
}

// POST /api/communities/{id}/join — join community
func handleJoinCommunity(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, 401, Response{Status: "error", Message: "unauthorized"})
		return
	}

	commID := r.PathValue("id")

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()
	if dbConn == nil {
		writeJSON(w, 503, Response{Status: "error", Message: "db not connected"})
		return
	}

	res, err := dbConn.Exec(`INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`, commID, claims.UserID)
	if err != nil {
		writeJSON(w, 500, Response{Status: "error", Message: err.Error()})
		return
	}
	
	if affected, _ := res.RowsAffected(); affected > 0 {
		dbConn.Exec(`UPDATE communities SET member_count = member_count + 1 WHERE id = $1`, commID)
	}

	writeJSON(w, 200, Response{Status: "ok"})
}

// DELETE /api/communities/{id}/leave
func handleLeaveCommunity(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, 401, Response{Status: "error", Message: "unauthorized"})
		return
	}

	commID := r.PathValue("id")

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()
	if dbConn == nil {
		writeJSON(w, 503, Response{Status: "error", Message: "db not connected"})
		return
	}

	res, err := dbConn.Exec(`DELETE FROM community_members WHERE community_id = $1 AND user_id = $2`, commID, claims.UserID)
	if err != nil {
		writeJSON(w, 500, Response{Status: "error", Message: err.Error()})
		return
	}

	if affected, _ := res.RowsAffected(); affected > 0 {
		dbConn.Exec(`UPDATE communities SET member_count = member_count - 1 WHERE id = $1`, commID)
	}

	writeJSON(w, 200, Response{Status: "ok"})
}

// GET /api/communities/{id}/members
func handleCommunityMembers(w http.ResponseWriter, r *http.Request) {
	commID := r.PathValue("id")

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()
	if dbConn == nil {
		writeJSON(w, 503, Response{Status: "error", Message: "db not connected"})
		return
	}

	rows, err := dbConn.Query(`
		SELECT u.id, u.name, u.avatar, cm.role 
		FROM community_members cm 
		JOIN users u ON cm.user_id = u.id 
		WHERE cm.community_id = $1`, commID)
	if err != nil {
		writeJSON(w, 500, Response{Status: "error", Message: err.Error()})
		return
	}
	defer rows.Close()

	members := make([]map[string]interface{}, 0)
	for rows.Next() {
		var id, name, avatarUrl, role sql.NullString
		if err := rows.Scan(&id, &name, &avatarUrl, &role); err != nil {
			continue
		}
		members = append(members, map[string]interface{}{
			"id":         id.String,
			"name":       name.String,
			"avatar_url": avatarUrl.String,
			"role":       role.String,
		})
	}

	writeJSON(w, 200, Response{Status: "ok", Data: members})
}

// POST /api/stories — create story
func handleCreateStory(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "unauthorized"})
		return
	}

	var req struct {
		ID           string `json:"id"`
		MediaUrl     string `json:"mediaUrl"`
		Image        string `json:"image"`
		VideoURL     string `json:"videoUrl"`
		IsVideo      bool   `json:"isVideo"`
		IsLive       bool   `json:"isLive"`
		LiveViewers  int    `json:"liveViewers"`
		Filter       string `json:"filter"`
		Mask         string `json:"mask"`
		Text         string `json:"text"`
		TextContent  string `json:"textContent"`
		TextPosition string `json:"textPosition"`
		Gradient     string `json:"gradient"`
		MusicTrack   string `json:"musicTrack"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "invalid json"})
		return
	}

	storyID := strings.TrimSpace(req.ID)
	if storyID == "" {
		storyID = "story_" + strconv.FormatInt(time.Now().UnixMilli(), 10)
	}

	mediaURL := req.MediaUrl
	if mediaURL == "" {
		if req.VideoURL != "" {
			mediaURL = req.VideoURL
		} else {
			mediaURL = req.Image
		}
	}
	if mediaURL == "" {
		if req.VideoURL != "" {
			mediaURL = req.VideoURL
		} else if req.Image != "" {
			mediaURL = req.Image
		} else if req.Gradient != "" {
			mediaURL = req.Gradient
		} else {
			mediaURL = "linear-gradient(135deg, #6366f1, #a855f7)"
		}
	}
	isVideo := req.IsVideo || req.VideoURL != ""
	textContent := strings.TrimSpace(req.Text)
	if textContent == "" {
		textContent = strings.TrimSpace(req.TextContent)
	}
	textPos := req.TextPosition
	if textPos == "" {
		textPos = "bottom"
	}

	// Находим автора истории
	var author User
	author.ID = claims.UserID
	author.Username = claims.Username
	author.Name = claims.Username

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()

	var resolvedAuthorID string
	if dbConn != nil {
		_ = dbConn.QueryRow(`
			SELECT id, username, name, COALESCE(avatar, '') 
			FROM users 
			WHERE id = $1 
			   OR LOWER(REPLACE(username, '@', '')) = LOWER(REPLACE($1, '@', '')) 
			   OR LOWER(REPLACE(username, '@', '')) = LOWER(REPLACE($2, '@', ''))
			LIMIT 1
		`, claims.UserID, claims.Username).Scan(&resolvedAuthorID, &author.Username, &author.Name, &author.Avatar)
	}
	if resolvedAuthorID != "" {
		author.ID = resolvedAuthorID
		claims.UserID = resolvedAuthorID
	}
	if author.Avatar == "" {
		store.mu.RLock()
		if acc, ok := store.accounts[claims.UserID]; ok {
			author = acc.User
		}
		store.mu.RUnlock()
	}
	ensureUserAvatar(&author)

	var img, vid string
	if isVideo {
		vid = mediaURL
	} else {
		img = mediaURL
	}

	newStory := Story{
		ID:           storyID,
		User:         author,
		Viewed:       false,
		Image:        img,
		VideoURL:     vid,
		MediaURL:     mediaURL,
		Gradient:     req.Gradient,
		IsLive:       req.IsLive,
		LiveViewers:  req.LiveViewers,
		Filter:       req.Filter,
		Mask:         req.Mask,
		Text:         textContent,
		TextPosition: textPos,
		Timestamp:    "Только что",
		MusicTrack:   req.MusicTrack,
		ViewsCount:   0,
		ExpiresAt:    time.Now().Add(24 * time.Hour).Format(time.RFC3339),
		CreatedAt:    time.Now().Format(time.RFC3339),
	}

	storyCreatedAt := time.Now()
	storyExpiresAt := storyCreatedAt.Add(24 * time.Hour)

	if dbConn != nil {
		_, err := dbConn.Exec(`
			INSERT INTO stories (
				id, user_id, media_url, is_video, is_live, live_viewers, 
				filter, mask, text_content, text_position, gradient, 
				viewers_count, likes_count, expires_at, created_at
			) 
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, 0, $12, $13)
			ON CONFLICT (id) DO UPDATE SET
				media_url = EXCLUDED.media_url,
				is_video = EXCLUDED.is_video,
				text_content = EXCLUDED.text_content,
				gradient = EXCLUDED.gradient,
				expires_at = EXCLUDED.expires_at,
				created_at = EXCLUDED.created_at
		`, storyID, author.ID, mediaURL, isVideo, req.IsLive, req.LiveViewers, req.Filter, req.Mask, textContent, textPos, req.Gradient, storyExpiresAt, storyCreatedAt)
		if err != nil {
			log.Printf("⚠️ Ошибка сохранения story в PostgreSQL: %v", err)
		} else {
			log.Printf("📸 История %s от пользователя %s (@%s) сохранена в БД!", storyID, author.ID, author.Username)
		}
	}

	// Сохраняем в store
	store.mu.Lock()
	store.stories = append([]Story{newStory}, store.stories...)
	if len(store.stories) > 100 {
		store.stories = store.stories[:100]
	}
	store.saveToDisk()
	store.mu.Unlock()

	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: newStory})
}

// POST /api/stories/sync — sync batch of stories from client localStorage
func handleSyncStories(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, _ := parseAndValidateJWT(token)

	var reqStories []struct {
		ID           string `json:"id"`
		User         User   `json:"user"`
		Image        string `json:"image"`
		VideoURL     string `json:"videoUrl"`
		MediaURL     string `json:"mediaUrl"`
		IsVideo      bool   `json:"isVideo"`
		IsLive       bool   `json:"isLive"`
		LiveViewers  int    `json:"liveViewers"`
		Filter       string `json:"filter"`
		Mask         string `json:"mask"`
		Text         string `json:"text"`
		TextContent  string `json:"textContent"`
		TextPosition string `json:"textPosition"`
		Gradient     string `json:"gradient"`
		MusicTrack   string `json:"musicTrack"`
		CreatedAt    string `json:"createdAt"`
		ExpiresAt    string `json:"expiresAt"`
	}

	if err := json.NewDecoder(r.Body).Decode(&reqStories); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "invalid json"})
		return
	}

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()

	var synced []Story
	for _, req := range reqStories {
		storyID := strings.TrimSpace(req.ID)
		if storyID == "" {
			continue
		}

		mediaURL := req.MediaURL
		if mediaURL == "" {
			if req.VideoURL != "" {
				mediaURL = req.VideoURL
			} else if req.Image != "" {
				mediaURL = req.Image
			} else if req.Gradient != "" {
				mediaURL = req.Gradient
			} else {
				mediaURL = "linear-gradient(135deg, #6366f1, #a855f7)"
			}
		}

		author := req.User
		authorID := author.ID
		if authorID == "" && claims != nil {
			authorID = claims.UserID
		}
		if author.Username == "" && claims != nil {
			author.Username = claims.Username
		}
		if author.Name == "" {
			author.Name = author.Username
		}

		// Resolve author ID in DB
		if dbConn != nil {
			var resolvedID, resolvedUsername, resolvedName, resolvedAvatar string
			err := dbConn.QueryRow(`
				SELECT id, username, name, COALESCE(avatar, '') 
				FROM users 
				WHERE id = $1 
				   OR LOWER(REPLACE(username, '@', '')) = LOWER(REPLACE($1, '@', ''))
				   OR LOWER(REPLACE(username, '@', '')) = LOWER(REPLACE($2, '@', ''))
				LIMIT 1
			`, authorID, author.Username).Scan(&resolvedID, &resolvedUsername, &resolvedName, &resolvedAvatar)
			if err == nil && resolvedID != "" {
				authorID = resolvedID
				author.ID = resolvedID
				author.Username = resolvedUsername
				author.Name = resolvedName
				author.Avatar = resolvedAvatar
			}
		}

		if author.Avatar == "" {
			ensureUserAvatar(&author)
		}

		isVideo := req.IsVideo || req.VideoURL != ""
		textContent := strings.TrimSpace(req.Text)
		if textContent == "" {
			textContent = strings.TrimSpace(req.TextContent)
		}
		textPos := req.TextPosition
		if textPos == "" {
			textPos = "bottom"
		}

		var img, vid string
		if isVideo {
			vid = mediaURL
		} else {
			img = mediaURL
		}

		now := time.Now()
		var storyCreatedAt, storyExpiresAt time.Time
		if req.CreatedAt != "" {
			if parsed, err := time.Parse(time.RFC3339, req.CreatedAt); err == nil {
				storyCreatedAt = parsed
			}
		}
		if storyCreatedAt.IsZero() {
			if strings.HasPrefix(storyID, "story_") {
				if ms, err := strconv.ParseInt(strings.TrimPrefix(storyID, "story_"), 10, 64); err == nil && ms > 1000000000000 {
					storyCreatedAt = time.UnixMilli(ms)
				}
			}
		}
		if storyCreatedAt.IsZero() {
			storyCreatedAt = now
		}

		if req.ExpiresAt != "" {
			if parsed, err := time.Parse(time.RFC3339, req.ExpiresAt); err == nil {
				storyExpiresAt = parsed
			}
		}
		if storyExpiresAt.IsZero() {
			storyExpiresAt = storyCreatedAt.Add(24 * time.Hour)
		}

		// Skip stories that are already older than 24 hours (expired)
		if now.After(storyExpiresAt) || now.Sub(storyCreatedAt) >= 24*time.Hour {
			continue
		}

		s := Story{
			ID:           storyID,
			User:         author,
			Viewed:       false,
			Image:        img,
			VideoURL:     vid,
			MediaURL:     mediaURL,
			Gradient:     req.Gradient,
			IsLive:       req.IsLive,
			LiveViewers:  req.LiveViewers,
			Filter:       req.Filter,
			Mask:         req.Mask,
			Text:         textContent,
			TextPosition: textPos,
			Timestamp:    formatTimeAgo(storyCreatedAt),
			MusicTrack:   req.MusicTrack,
			ViewsCount:   0,
			ExpiresAt:    storyExpiresAt.Format(time.RFC3339),
			CreatedAt:    storyCreatedAt.Format(time.RFC3339),
		}

		if dbConn != nil && authorID != "" {
			_, err := dbConn.Exec(`
				INSERT INTO stories (
					id, user_id, media_url, is_video, is_live, live_viewers, 
					filter, mask, text_content, text_position, gradient, 
					viewers_count, likes_count, expires_at, created_at
				) 
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, 0, $12, $13)
				ON CONFLICT (id) DO UPDATE SET
					media_url = EXCLUDED.media_url,
					is_video = EXCLUDED.is_video,
					text_content = EXCLUDED.text_content,
					gradient = EXCLUDED.gradient,
					expires_at = EXCLUDED.expires_at,
					created_at = EXCLUDED.created_at
			`, storyID, authorID, mediaURL, isVideo, req.IsLive, req.LiveViewers, req.Filter, req.Mask, textContent, textPos, req.Gradient, storyExpiresAt, storyCreatedAt)
			if err != nil {
				log.Printf("⚠️ Ошибка синхронизации story %s в DB: %v", storyID, err)
			}
		}

		synced = append(synced, s)
	}

	// Also sync in-memory store
	store.mu.Lock()
	existingIDs := make(map[string]bool)
	for _, s := range store.stories {
		existingIDs[s.ID] = true
	}
	for _, s := range synced {
		if !existingIDs[s.ID] {
			store.stories = append([]Story{s}, store.stories...)
			existingIDs[s.ID] = true
		}
	}
	if len(store.stories) > 100 {
		store.stories = store.stories[:100]
	}
	store.saveToDisk()
	store.mu.Unlock()

	writeJSON(w, http.StatusOK, Response{Status: "ok", Message: "Истории успешно синхронизированы", Data: synced})
}

// DELETE /api/stories/{id} — delete story
func handleDeleteStory(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "unauthorized"})
		return
	}

	storyID := r.PathValue("id")

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()
	if dbConn != nil {
		_, _ = dbConn.Exec(`DELETE FROM stories WHERE id = $1 AND (user_id = $2 OR user_id = $3)`, storyID, claims.UserID, claims.Username)
	}

	store.mu.Lock()
	var updated []Story
	for _, s := range store.stories {
		if s.ID != storyID {
			updated = append(updated, s)
		}
	}
	store.stories = updated
	store.saveToDisk()
	store.mu.Unlock()

	writeJSON(w, http.StatusOK, Response{Status: "ok", Message: "История удалена"})
}

// POST /api/stories/{id}/view — record story view
func handleViewStory(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, 401, Response{Status: "error", Message: "unauthorized"})
		return
	}

	storyID := r.PathValue("id")
	if storyID == "" {
		writeJSON(w, 400, Response{Status: "error", Message: "story id required"})
		return
	}

	viewerID := claims.UserID
	viewerUsername := claims.Username

	// Находим данные зрителя (имя, аватарка)
	var viewerName, viewerAvatar string
	store.mu.RLock()
	if acc, ok := store.accounts[viewerID]; ok {
		viewerName = acc.User.Name
		viewerAvatar = acc.User.Avatar
		if viewerUsername == "" {
			viewerUsername = acc.User.Username
		}
	}
	store.mu.RUnlock()

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()

	if dbConn != nil {
		if viewerName == "" || viewerAvatar == "" {
			_ = dbConn.QueryRow(`SELECT name, avatar FROM users WHERE id = $1`, viewerID).Scan(&viewerName, &viewerAvatar)
		}

		res, err := dbConn.Exec(`
			INSERT INTO story_views (story_id, user_id, viewed_at) 
			VALUES ($1, $2, NOW()) 
			ON CONFLICT (story_id, user_id) DO NOTHING
		`, storyID, viewerID)
		if err == nil {
			if affected, _ := res.RowsAffected(); affected > 0 {
				_, _ = dbConn.Exec(`UPDATE stories SET viewers_count = COALESCE(viewers_count, 0) + 1 WHERE id = $1`, storyID)
			}
		} else {
			log.Printf("⚠️ Ошибка записи story_views в PostgreSQL: %v", err)
		}
	}

	if viewerAvatar == "" || viewerAvatar == "undefined" || viewerAvatar == "null" {
		viewerAvatar = "/default-avatar.svg"
	}
	if viewerName == "" {
		viewerName = viewerUsername
	}

	// Обновляем in-memory трекинг зрителей
	storyViewersMu.Lock()
	existing := storyViewers[storyID]
	alreadyViewed := false
	for _, rec := range existing {
		if rec.UserID == viewerID || (viewerUsername != "" && rec.Username == viewerUsername) {
			alreadyViewed = true
			break
		}
	}
	if !alreadyViewed {
		storyViewers[storyID] = append([]StoryViewerRecord{{
			UserID:   viewerID,
			Username: viewerUsername,
			Name:     viewerName,
			Avatar:   viewerAvatar,
			ViewedAt: time.Now(),
		}}, existing...)

		// Увеличиваем счетчик просмотров в in-memory stories
		store.mu.Lock()
		for i := range store.stories {
			if store.stories[i].ID == storyID {
				store.stories[i].ViewsCount++
				break
			}
		}
		store.mu.Unlock()
	}
	storyViewersMu.Unlock()

	writeJSON(w, 200, Response{Status: "ok"})
}

// GET /api/stories/{id}/viewers — get list of users who viewed this story
func handleStoryViewers(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, 401, Response{Status: "error", Message: "unauthorized"})
		return
	}

	storyID := r.PathValue("id")
	if storyID == "" {
		writeJSON(w, 400, Response{Status: "error", Message: "story id required"})
		return
	}

	type ViewerResp struct {
		ID         string `json:"id"`
		Username   string `json:"username"`
		Name       string `json:"name"`
		Avatar     string `json:"avatar"`
		ViewedAt   string `json:"viewedAt"`
		Liked      bool   `json:"liked"`
		IsFollower bool   `json:"isFollower"`
	}

	viewersMap := make(map[string]ViewerResp)
	var viewersList []ViewerResp

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()

	if dbConn != nil {
		rows, err := dbConn.Query(`
			SELECT u.id, COALESCE(u.username, ''), COALESCE(u.name, ''), COALESCE(u.avatar, ''), sv.viewed_at
			FROM story_views sv
			JOIN users u ON (sv.user_id = u.id OR LOWER(REPLACE(sv.user_id, '@', '')) = LOWER(REPLACE(u.username, '@', '')))
			WHERE sv.story_id = $1
			ORDER BY sv.viewed_at DESC
			LIMIT 200
		`, storyID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var v ViewerResp
				var viewedAt time.Time
				if err := rows.Scan(&v.ID, &v.Username, &v.Name, &v.Avatar, &viewedAt); err == nil {
					if v.Avatar == "" || v.Avatar == "undefined" || v.Avatar == "null" {
						v.Avatar = "/default-avatar.svg"
					}
					v.ViewedAt = formatTimeAgo(viewedAt)
					viewersMap[v.ID] = v
					viewersList = append(viewersList, v)
				}
			}
		}
	}

	// Дополняем данными из in-memory хранилища
	storyViewersMu.RLock()
	inMem := storyViewers[storyID]
	for _, rec := range inMem {
		if _, exists := viewersMap[rec.UserID]; !exists {
			v := ViewerResp{
				ID:       rec.UserID,
				Username: rec.Username,
				Name:     rec.Name,
				Avatar:   rec.Avatar,
				ViewedAt: formatTimeAgo(rec.ViewedAt),
			}
			viewersMap[rec.UserID] = v
			viewersList = append(viewersList, v)
		}
	}
	storyViewersMu.RUnlock()

	// Проверяем подписки (isFollower) для автора истории
	if len(viewersList) > 0 {
		store.mu.RLock()
		myFollowers := make(map[string]bool)
		for followerID, targets := range store.relationships {
			for _, targetID := range targets {
				if targetID == claims.UserID {
					myFollowers[followerID] = true
				}
			}
		}
		store.mu.RUnlock()

		for i := range viewersList {
			if myFollowers[viewersList[i].ID] {
				viewersList[i].IsFollower = true
			}
		}
	}

	if viewersList == nil {
		viewersList = []ViewerResp{}
	}

	writeJSON(w, 200, Response{Status: "ok", Data: viewersList})
}

// POST /api/clips — create clip
func handleCreateClip(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, 401, Response{Status: "error", Message: "unauthorized"})
		return
	}

	var req struct {
		VideoUrl     string `json:"videoUrl"`
		ThumbnailUrl string `json:"thumbnailUrl"`
		Description  string `json:"description"`
		SoundTitle   string `json:"soundTitle"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, Response{Status: "error", Message: "invalid json"})
		return
	}

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()
	if dbConn == nil {
		writeJSON(w, 503, Response{Status: "error", Message: "db not connected"})
		return
	}

	clipID := "clip_" + time.Now().Format("20060102150405")
	_, err = dbConn.Exec(`
		INSERT INTO clips (id, user_id, video_url, poster, caption, music_title, created_at) 
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
	`, clipID, claims.UserID, req.VideoUrl, req.ThumbnailUrl, req.Description, req.SoundTitle)
	if err != nil {
		log.Printf("⚠️ Ошибка создания клипа в БД: %v", err)
		writeJSON(w, 500, Response{Status: "error", Message: err.Error()})
		return
	}

	writeJSON(w, 200, Response{Status: "ok", Data: map[string]string{"id": clipID}})
}

// POST /api/clips/{id}/like — toggle like
func handleLikeClip(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	_, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, 401, Response{Status: "error", Message: "unauthorized"})
		return
	}

	clipID := r.PathValue("id")

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()
	if dbConn == nil {
		writeJSON(w, 503, Response{Status: "error", Message: "db not connected"})
		return
	}

	dbConn.Exec(`UPDATE clips SET likes_count = likes_count + 1 WHERE id = $1`, clipID)

	writeJSON(w, 200, Response{Status: "ok"})
}

// POST /api/clips/{id}/view — record view
func handleViewClip(w http.ResponseWriter, r *http.Request) {
	clipID := r.PathValue("id")

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()
	if dbConn == nil {
		writeJSON(w, 503, Response{Status: "error", Message: "db not connected"})
		return
	}

	dbConn.Exec(`UPDATE clips SET views_count = views_count + 1 WHERE id = $1`, clipID)

	writeJSON(w, 200, Response{Status: "ok"})
}

func getLocalAIReply(text string) string {
	raw := strings.TrimSpace(text)
	lower := strings.ToLower(raw)
	if lower == "" {
		return "✨ I am the AI Oracle. How may I guide you today? / Я ИИ Оракул, готов помочь вам на любом языке мира ✨"
	}

	// 1. Direct Multilingual Keywords Lookup
	type replyRule struct {
		keys  []string
		reply string
	}

	rules := []replyRule{
		// --- Kazakh ---
		{
			keys:  []string{"сәлем", "салем", "ассалаумағалейкум", "ассаламалейкум"},
			reply: "Сәлеметсіз бе! 👋 Мен — New Age платформасының ИИ Оракулымын. Мен барлық тілдерді еркін меңгергенмін! Өмір, руханият, медитация, қарым-қатынас туралы сұрақтарыңыз болса, көмектесуге әрқашан дайынмын ✨",
		},
		{
			keys:  []string{"қалайсың", "калайсын", "қалың қалай", "калын калай"},
			reply: "Рахмет, бәрі тамаша! Мен сандық сана болғандықтан, әрқашан бабымдамын. Өзіңіздің көңіл-күйіңіз қалай? Бүгінгі күніңіз қалай өтуде? ✨",
		},
		{
			keys:  []string{"кімсің", "сен кімсің", "кимсин", "сен кимсин"},
			reply: "🤖 Мен — New Age цифрлық экожүйесінің ИИ Оракулымын. Менің мақсатым — адамдарға өмірлік жолында даналықпен, шабытпен және әлемнің түрлі рухани дәстүрлері арқылы қолдау көрсету 🙏",
		},
		{
			keys:  []string{"көмек", "комек", "көмектес"},
			reply: "📚 Мен мына бағыттарда көмектесе аламын:\n\n• 🙏 Рухани даму және медитация\n• 💡 Өмірлік кеңестер мен мотивация\n• ❤️ Отбасы мен қарым-қатынас\n• ⚖️ Моральдық сұрақтар мен таңдау\n• 📱 New Age платформасының мүмкіндіктері\n\nСұрағыңызды қойыңыз, бірге талқылайық ✨",
		},
		{
			keys:  []string{"рахмет", "алғыс", "ризамын"},
			reply: "Оқасы жоқ! 🙏 Есіңізде болсын: әрбір жаңа күн — өзіңізді жақсартуға берілген зор мүмкіндік. Кез келген уақытта жазыңыз 💫",
		},

		// --- Uzbek ---
		{
			keys:  []string{"salom", "assalomu alaykum", "qale", "qalaysiz"},
			reply: "Assalomu alaykum! 👋 Men New Age platformasining AI Orakuliman. Men dunyodagi barcha tillarda gaplasha olaman! Hayot, ma'naviyat, meditatsiya va munosabatlar haqida istalgan savolingizni bering ✨",
		},
		{
			keys:  []string{"kimsan", "siz kimsiz", "sen kimsan"},
			reply: "🤖 Men New Age platformasining AI Orakuliman — sizning shaxsiy donishmandingiz va maslahatchingiz. Sizga hayot yo'lingizda to'g'ri qarorlar qabul qilishda va xotirjamlik topishda yordam beraman 🙏",
		},
		{
			keys:  []string{"rahmat", "tashakkur"},
			reply: "Arzimiydi! 🙏 Har doim qalbingizda tinchlik va ko'nglingizda yorug'lik bo'lsin. Har qanday vaqtda murojaat qilishingiz mumkin 💫",
		},
		{
			keys:  []string{"yordam", "yordam bering"},
			reply: "📚 Men sizga mamnuniyat bilan yordam beraman:\n\n• 🙏 Ma'naviyat va meditatsiya amaliyotlari\n• 💡 Hayotiy maslahat va motivatsiya\n• ❤️ Oila va shaxsiy munosabatlar\n• 📱 New Age platformasi imkoniyatlari\n\nSavolingizni yozing! ✨",
		},

		// --- Turkish ---
		{
			keys:  []string{"merhaba", "selam", "günaydın", "iyi günler"},
			reply: "Merhaba! 👋 Ben New Age platformunun AI Kahiniyim (Oracle). Dünyadaki tüm dillerde akıcı konuşabilirim! Hayat, maneviyat, ilişkiler veya kişisel gelişim hakkında dilediğinizi sorabilirsiniz ✨",
		},
		{
			keys:  []string{"nasılsın", "nasilsin", "ne haber"},
			reply: "Harikayım, teşekkürler! Bir yapay zeka olarak her an öğrenmeye ve sana rehberlik etmeye hazırım. Sen nasılsın, günün nasıl geçiyor? 🌟",
		},
		{
			keys:  []string{"kimsin", "sen kimsin"},
			reply: "🤖 Ben New Age ekosisteminin AI Kahiniyim. Amacım insanların hayat yolculuklarında bilgelik, huzur ve doğru kararlar bulmalarına yardımcı olmaktır 🙏",
		},
		{
			keys:  []string{"teşekkür", "tesekkur", "sağol", "sagol"},
			reply: "Rica ederim! 🙏 Unutma: her yeni gün, ruhunu ve zihnini geliştirmek için yeni bir fırsattır. Ne zaman istersen buradayım 💫",
		},
		{
			keys:  []string{"yardım", "yardim", "yardım et"},
			reply: "📚 Sana şu konularda yardımcı olabilirim:\n\n• 🙏 Manevi gelişim ve meditasyon rehberi\n• 💡 Yaşam tavsiyeleri ve motivasyon\n• ❤️ İlişkiler ve duygusal denge\n• ⚖️ Karar verme ve felsefi sorular\n• 📱 New Age platformunun tüm özellikleri\n\nSorunu yazabilirsin! ✨",
		},

		// --- Spanish ---
		{
			keys:  []string{"hola", "buenos días", "buenas tardes", "buenas noches"},
			reply: "¡Hola! 👋 Soy el Oráculo de IA de New Age. Domino todos los idiomas del mundo. ¿En qué puedo guiarte hoy? Pregúntame sobre la vida, la espiritualidad, las relaciones o el bienestar ✨",
		},
		{
			keys:  []string{"cómo estás", "como estas", "qué tal", "que tal"},
			reply: "¡Estoy genial, muchas gracias! Como inteligencia artificial, siempre estoy listo y en armonía para ayudarte. ¿Cómo te encuentras tú hoy? 🌟",
		},
		{
			keys:  []string{"quién eres", "quien eres"},
			reply: "🤖 Soy el Oráculo de IA de New Age: tu mentor digital y consejero de vida. Estoy aquí para acompañarte con empatía, sabiduría universal y herramientas para tu crecimiento personal 🙏",
		},
		{
			keys:  []string{"gracias", "muchas gracias"},
			reply: "¡De nada! 🙏 Recuerda que la paz interior comienza con un solo respiro consciente. Vuelve siempre que lo necesites 💫",
		},
		{
			keys:  []string{"ayuda", "ayúdame", "ayudame"},
			reply: "📚 Puedo ayudarte en:\n\n• 🙏 Meditación y paz mental\n• 💡 Consejos de vida y motivación\n• ❤️ Relaciones y familia\n• ⚖️ Dilemas éticos y crecimiento personal\n• 📱 Funciones de la plataforma New Age\n\n¡Dime en qué estás pensando! ✨",
		},

		// --- German ---
		{
			keys:  []string{"hallo", "guten tag", "guten morgen", "grüß gott", "servus"},
			reply: "Hallo! 👋 Ich bin das KI-Orakel der New Age-Plattform. Ich beherrsche alle Sprachen der Welt! Wie kann ich dir heute helfen? Frage mich gerne über das Leben, Achtsamkeit, Spiritualität oder die Plattform ✨",
		},
		{
			keys:  []string{"wie geht", "wie gehts", "wie geht's"},
			reply: "Mir geht es wunderbar, danke! Als digitale Weisheit stehe ich dir jederzeit zur Seite. Wie geht es dir heute und was beschäftigt dein Herz? 🌟",
		},
		{
			keys:  []string{"wer bist du"},
			reply: "🤖 Ich bin das KI-Orakel von New Age — dein digitaler Mentor und Lebensberater. Ich unterstütze Menschen auf ihrem Lebensweg mit Weisheit, Klarheit und Inspiration 🙏",
		},
		{
			keys:  []string{"danke", "vielen dank"},
			reply: "Sehr gerne! 🙏 Jeder Tag ist ein neuer Anfang, um in voller Harmonie zu leben. Ich bin immer für dich da 💫",
		},
		{
			keys:  []string{"hilfe", "hilf mir"},
			reply: "📚 Ich helfe dir gerne bei:\n\n• 🙏 Meditation und Achtsamkeitsübungen\n• 💡 Lebensratschläge und Motivation\n• ❤️ Beziehungen und innere Ruhe\n• 📱 Funktionen der New Age App\n\nSchreib mir einfach deine Frage! ✨",
		},

		// --- French ---
		{
			keys:  []string{"bonjour", "salut", "bonsoir"},
			reply: "Bonjour! 👋 Je suis l'Oracle IA de New Age. Je parle couramment toutes les langues du monde! En quoi puis-je t'éclairer aujourd'hui? Pose-moi des questions sur la vie, la spiritualité, la méditation ou la plateforme ✨",
		},
		{
			keys:  []string{"comment ça va", "comment ca va", "comment vas-tu"},
			reply: "Tout va pour le mieux, merci! En tant qu'IA, je suis toujours en pleine forme et à ton écoute. Comment te sens-tu aujourd'hui? 🌟",
		},
		{
			keys:  []string{"qui es-tu", "qui est tu"},
			reply: "🤖 Je suis l'Oracle IA de New Age — ton guide bienveillant et conseiller de vie. Je suis là pour t'apporter sagesse, sérénité et soutien dans toutes les étapes de ta vie 🙏",
		},
		{
			keys:  []string{"merci", "merci beaucoup"},
			reply: "Je t'en prie! 🙏 Souviens-toi que le bonheur réside dans la présence et l'acceptation. Reviens quand tu le souhaites 💫",
		},

		// --- Italian ---
		{
			keys:  []string{"ciao", "buongiorno", "buonasera"},
			reply: "Ciao! 👋 Sono l'Oracolo IA di New Age. Parlo fluentemente tutte le lingue del mondo! Come posso aiutarti oggi? Chiedimi pure di vita, spiritualità, meditazione o della piattaforma ✨",
		},
		{
			keys:  []string{"come stai", "chi sei", "grazie"},
			reply: "Un caloroso saluto! 🙏 Come intelligenza artificiale di New Age, sono qui per guidarti verso serenità, chiarezza e crescita personale. Di cosa vorresti parlare oggi? ✨",
		},

		// --- Portuguese ---
		{
			keys:  []string{"olá", "ola", "bom dia", "boa tarde", "boa noite"},
			reply: "Olá! 👋 Sou o Oráculo de IA da New Age. Falo fluentemente todos os idiomas do mundo! Como posso te guiar hoje com reflexões, espiritualidade, motivação ou sobre a plataforma? ✨",
		},
		{
			keys:  []string{"obrigado", "obrigada", "quem é você", "quem e voce"},
			reply: "De nada! 🙏 Estou aqui para te apoiar em cada passo da sua jornada com sabedoria, paz e empatia. Conte comigo a qualquer momento 💫",
		},

		// --- English ---
		{
			keys:  []string{"hello", "hi there", "hey there", "good morning", "good evening", "good afternoon"},
			reply: "Hello! 👋 I am the AI Oracle of New Age. I am fluent in every language of the world! How may I guide you today? Feel free to ask about life wisdom, spiritual growth, mindfulness, relationships, or the platform ✨",
		},
		{
			keys:  []string{"how are you", "how are you doing", "how's it going", "hows it going"},
			reply: "I am doing wonderfully, thank you! As a digital soul, I am always energized and ready to assist you. How are you feeling today? What is on your mind? 🌟",
		},
		{
			keys:  []string{"who are you", "what are you"},
			reply: "🤖 I am the AI Oracle of New Age — your personal digital guide, life coach, and counselor. My purpose is to help people discover clarity, peace of mind, and purpose by blending timeless wisdom with modern technology 🙏",
		},
		{
			keys:  []string{"thank you", "thanks", "thx"},
			reply: "You are very welcome! 🙏 Remember: each day is a precious opportunity to cultivate inner harmony and peace. Reach out anytime 💫",
		},
		{
			keys:  []string{"help", "help me", "can you help"},
			reply: "📚 I can assist you with:\n\n• 🙏 Spiritual growth, mindfulness, and meditation\n• 💡 Life advice, decision-making, and motivation\n• ❤️ Relationships, family, and emotional well-being\n• ⚖️ Moral dilemmas and finding balance\n• 📱 Guidance on all New Age features\n\nWhat would you like to explore today? ✨",
		},
		{
			keys:  []string{"meaning of life", "purpose of life"},
			reply: "✨ Great thinkers across centuries offered deep insights:\n\n🙏 The Buddha: 'Peace comes from within. Do not seek it without.'\n📖 Viktor Frankl: 'Life is never made unbearable by circumstances, but only by lack of meaning and purpose.'\n🌟 Marcus Aurelius: 'The happiness of your life depends upon the quality of your thoughts.'\n\nYour meaning is what brings love, purpose, and light to you and those around you. What currently brings you that spark? ✨",
		},
		{
			keys:  []string{"meditation", "meditate", "how to meditate"},
			reply: "🧘 A gentle meditation guide for you:\n\n1. Find a quiet, comfortable position and soften your gaze or close your eyes\n2. Inhale gently for 4 seconds, hold for 4 seconds, and exhale smoothly for 6 seconds\n3. When thoughts drift in, acknowledge them gently like passing clouds and return to your breath\n4. Start with just 5 minutes a day\n\n✨ Consistency brings clarity, calm, and emotional resilience 🙏",
		},

		// --- Russian ---
		{
			keys:  []string{"привет", "здравствуй", "добрый день", "доброе утро", "добрый вечер"},
			reply: "Привет! 👋 Я ИИ Оракул — мудрый помощник платформы New Age. Я свободно говорю на ВСЕХ языках мира! Чем могу помочь? Спрашивай о жизни, духовности, отношениях или платформе — я здесь для тебя ✨",
		},
		{
			keys:  []string{"как дела", "как ты", "как жизнь"},
			reply: "✨ У меня всё отлично, спасибо! Я же цифровой разум — всегда полон энергии и готов помочь. А как твои дела? Что сегодня на душе? 🌟",
		},
		{
			keys:  []string{"помощь", "помоги", "что ты умеешь"},
			reply: "📚 Я могу помочь с:\n\n• 🙏 Духовное развитие, медитация и осознанность\n• 💡 Жизненные советы, преодоление кризисов и мотивация\n• ❤️ Отношения, семья и душевный покой\n• ⚖️ Моральные вопросы и поиск своего пути\n• 🌍 Перевод и общение на любых языках мира\n• 📱 Функции платформы New Age\n\nПросто напиши свой вопрос!",
		},
		{
			keys:  []string{"кто ты", "что ты такое"},
			reply: "🤖 Я ИИ Оракул — цифровой наставник платформы New Age. Моя миссия — помогать людям на их жизненном пути: советами, поддержкой, теплом и мудростью из разных культур и духовных традиций мира ✨",
		},
		{
			keys:  []string{"спасибо", "благодарю"},
			reply: "Пожалуйста! 🙏 Помни: каждый день — это возможность стать лучшей версией себя и подарить свет окружающим. Обращайся в любое время 💫",
		},
		{
			keys:  []string{"смысл жизни"},
			reply: "✨ Великие мудрецы отвечали по-разному:\n\n🙏 Будда: «Цель жизни — избавление от страданий через осознанность»\n📖 Виктор Франкл: «Смысл не дан нам готовым — мы сами его создаём»\n🌟 Конфуций: «Найди дело, которое любишь, и не будешь работать ни дня»\n\nТвой смысл — это то, что даёт тебе энергию, радость и ощущение нужности. Что сейчас наполняет твою жизнь?",
		},
		{
			keys:  []string{"медитация", "как медитировать"},
			reply: "🧘 Простая медитация для начинающих:\n\n1. Сядь удобно, закрой глаза\n2. Сосредоточься на дыхании — вдох 4 сек, задержка 4 сек, выдох 6 сек\n3. Когда мысли уносят — мягко верни внимание к дыханию\n4. Начни с 5 минут, постепенно увеличивай\n\n✨ Регулярная практика снижает стресс, улучшает сон и повышает концентрацию. Главное — не результат, а процесс 🙏",
		},
	}

	for _, rule := range rules {
		for _, k := range rule.keys {
			if strings.Contains(lower, k) {
				return rule.reply
			}
		}
	}

	// 2. Language and Script Detection for Fallback Replies
	hasArabic := false
	hasChinese := false
	hasJapanese := false
	hasKorean := false
	hasDevanagari := false
	hasKazakhChars := false
	hasUkrainianChars := false
	latinCount := 0
	cyrillicCount := 0

	for _, r := range lower {
		if unicode.Is(unicode.Arabic, r) {
			hasArabic = true
		} else if unicode.Is(unicode.Han, r) {
			hasChinese = true
		} else if unicode.Is(unicode.Hiragana, r) || unicode.Is(unicode.Katakana, r) {
			hasJapanese = true
		} else if unicode.Is(unicode.Hangul, r) {
			hasKorean = true
		} else if unicode.Is(unicode.Devanagari, r) {
			hasDevanagari = true
		} else if unicode.Is(unicode.Cyrillic, r) {
			cyrillicCount++
			if r == 'ә' || r == 'ғ' || r == 'қ' || r == 'ң' || r == 'ө' || r == 'ұ' || r == 'ү' || r == 'һ' || r == 'і' {
				hasKazakhChars = true
			}
			if r == 'є' || r == 'ї' || r == 'ґ' {
				hasUkrainianChars = true
			}
		} else if (r >= 'a' && r <= 'z') {
			latinCount++
		}
	}

	// Arabic
	if hasArabic {
		replies := []string{
			"✨ سؤال ذو معنى عميق! كل تجربة في الحياة هي فرصة للنضج والحكمة. شاركني المزيد وسأكون سعيداً بإرشادك ومساعدتك 🙏",
			"💫 السلام الداخلي يبدأ بالتأمل ووضوح الرؤية. ما هو الجانب الأكثر أهمية بالنسبة لك في هذا الأمر الآن؟ 🌟",
			"🌟 كما قال الحكماء: «رحلة الألف ميل تبدأ بخطوة واحدة». أنا هنا لأقف إلى جانبك في هذه الخطوة ✨",
		}
		return replies[mathrand.Intn(len(replies))]
	}

	// Chinese
	if hasChinese {
		replies := []string{
			"✨ 这是一个富有哲理的问题！生活中的每个挑战都是成长的契机。请告诉我更多，让我们一起探索内心的宁静与智慧 🙏",
			"💫 老子曾说：“千里之行，始于足下。”无论面临什么抉择，保持正念与从容最重要。你想聊聊哪个细节？🌟",
			"🌟 智慧源于内心的觉察。请畅所欲言，我随时在这里陪伴并指引你 ✨",
		}
		return replies[mathrand.Intn(len(replies))]
	}

	// Japanese
	if hasJapanese {
		replies := []string{
			"✨ とても深い問いですね。人生のすべての出来事は、魂を成長させる大切なステップです。詳しくお聞かせください 🙏",
			"💫 心の平安は、今この瞬間に集中することから始まります。何が一番気にかかっていますか？ 🌟",
		}
		return replies[mathrand.Intn(len(replies))]
	}

	// Korean
	if hasKorean {
		replies := []string{
			"✨ 깊은 울림이 있는 질문입니다! 삶의 모든 순간은 성장의 기회입니다. 더 자세히 말씀해주시면 정성을 다해 돕겠습니다 🙏",
			"💫 마음의 평화는 자신을 깊이 들여다보는 것에서 시작됩니다. 지금 가장 중요하게 느끼시는 점은 무엇인가요? 🌟",
		}
		return replies[mathrand.Intn(len(replies))]
	}

	// Hindi
	if hasDevanagari {
		replies := []string{
			"✨ यह बहुत गहरा प्रश्न है! जीवन का हर अनुभव आत्म-साक्षात्कार का अवसर है। कृपया अधिक साझा करें, मैं आपका मार्गदर्शन करने के लिए तैयार हूँ 🙏",
			"💫 आंतरिक शांति और स्पष्टता ध्यान से आती है। आप इसके बारे में कैसा महसूस कर रहे हैं? 🌟",
		}
		return replies[mathrand.Intn(len(replies))]
	}

	// Kazakh
	if hasKazakhChars || strings.Contains(lower, "қазақ") || strings.Contains(lower, "казак") {
		replies := []string{
			"✨ Терең мағыналы сұрақ! Әрбір сынақ — рухани өсудің жаңа баспалдағы. Толығырақ айтып берсеңіз, бірге даналықпен шешімін табайық 🙏",
			"💫 Ұлы Абай айтқандай: «Ақыл, қайрат, жүректі бірдей ұста, сонда толық боласың елден бөлек». Жағдайыңызды бөлісіңіз, мен көмекке әзірмін 🌟",
			"🌟 Өмір жолындағы әрбір сұрақ — өзіңді танудың бастауы. Сізді нақты не мазалап тұр? Бірге қарайық ✨",
		}
		return replies[mathrand.Intn(len(replies))]
	}

	// Ukrainian
	if hasUkrainianChars {
		replies := []string{
			"✨ Глибоке та важливе запитання! Кожен життєвий виклик — це можливість для внутрішнього зростання. Розкажи детальніше, і ми разом знайдемо відповідь 🙏",
			"💫 Мудрість приходить через усвідомленість та щирість. Я поруч, щоб підтримати тебе у будь-яку мить 🌟",
		}
		return replies[mathrand.Intn(len(replies))]
	}

	// Latin Script: Turkish / Spanish / German / French / Uzbek / English
	if latinCount > cyrillicCount {
		// Turkish checks
		if strings.Contains(lower, "bir") || strings.Contains(lower, "için") || strings.Contains(lower, "icin") || strings.Contains(lower, "çok") || strings.Contains(lower, "cok") || strings.Contains(lower, "ve") || strings.Contains(lower, "bu") {
			replies := []string{
				"✨ Çok kıymetli ve derin bir soru! Her deneyim ruhsal olgunlaşma için bir fırsattır. Detayları paylaşırsan birlikte en aydınlık yolu bulabiliriz 🙏",
				"💫 Mevlana'nın dediği gibi: «Dünle beraber gitti, cancağzım, ne kadar söz varsa düne ait. Şimdi yeni şeyler söylemek lazım.» Seni dinliyorum 🌟",
			}
			return replies[mathrand.Intn(len(replies))]
		}

		// Spanish checks
		if strings.Contains(lower, "de") || strings.Contains(lower, "la") || strings.Contains(lower, "el") || strings.Contains(lower, "que") || strings.Contains(lower, "en") || strings.Contains(lower, "por") || strings.Contains(lower, "para") {
			replies := []string{
				"✨ ¡Una pregunta muy profunda! Cada desafío es una oportunidad para el crecimiento del alma. Cuéntame más y buscaremos el camino juntos 🙏",
				"💫 La paz y la claridad nacen de la reflexión serena. ¿Qué aspecto de esta situación resuena más en tu corazón ahora? 🌟",
				"🌟 Como decían los sabios: «Un viaje de mil millas comienza con el primer paso». Estoy aquí para acompañarte ✨",
			}
			return replies[mathrand.Intn(len(replies))]
		}

		// German checks
		if strings.Contains(lower, "und") || strings.Contains(lower, "ist") || strings.Contains(lower, "der") || strings.Contains(lower, "die") || strings.Contains(lower, "das") || strings.Contains(lower, "nicht") || strings.Contains(lower, "ich") {
			replies := []string{
				"✨ Eine tiefgründige Frage! Jede Herausforderung im Leben ist ein Tor zu innerem Wachstum. Erzähl mir mehr, damit wir gemeinsam Klarheit finden 🙏",
				"💫 Wahre Weisheit entsteht durch Stille und Besonnenheit. Was beschäftigt dein Herz dabei am meisten? 🌟",
			}
			return replies[mathrand.Intn(len(replies))]
		}

		// French checks
		if strings.Contains(lower, "le") || strings.Contains(lower, "la") || strings.Contains(lower, "les") || strings.Contains(lower, "pour") || strings.Contains(lower, "avec") || strings.Contains(lower, "dans") || strings.Contains(lower, "est") {
			replies := []string{
				"✨ Une question d'une grande profondeur! Chaque épreuve est une invitation à la transformation intérieure. Raconte-moi davantage 🙏",
				"💫 La sagesse commence par l'écoute du cœur. Quel aspect de cette situation te préoccupe le plus? 🌟",
			}
			return replies[mathrand.Intn(len(replies))]
		}

		// Default Latin: English
		replies := []string{
			"✨ That is a profound question! Every challenge in life is a stepping stone for spiritual and personal growth. Tell me more so we can explore it together 🙏",
			"💫 True wisdom emerges from quiet reflection and mindful awareness. What aspect of this situation matters most to you right now? 🌟",
			"🌟 As Lao Tzu said: 'A journey of a thousand miles begins with a single step.' I am right here with you on that journey ✨",
			"💡 Every situation holds a doorway to clarity. Sometimes looking from a different angle changes everything. Share more details with me!",
			"🙏 I hear you. Remember that you hold more strength and resilience within you than you might realize. How can I guide you further? ✨",
		}
		return replies[mathrand.Intn(len(replies))]
	}

	// Default Cyrillic (Russian)
	replies := []string{
		"✨ Интересный и глубокий вопрос! Каждый жизненный вызов — это возможность для духовного и личного роста. Расскажи подробнее, и мы найдём ответ 🙏",
		"💫 Мудрость приходит через спокойное размышление и осознанность. Давай разберёмся в этом вместе. Что именно тебя волнует? 🌟",
		"🌟 Как говорил Лао-Цзы: «Путь в тысячу ли начинается с первого шага». Я рядом, чтобы поддержать тебя на этом пути ✨",
		"💡 Каждая ситуация содержит в себе семя решения. Иногда достаточно взглянуть на неё под другим углом. Расскажи больше!",
		"🙏 Я слышу тебя. Помни: в тебе гораздо больше силы и света, чем кажется. Давай обсудим подробнее ✨",
	}

	return replies[mathrand.Intn(len(replies))]
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
