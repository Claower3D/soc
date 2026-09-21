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
	"os"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
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

var startTime = time.Now()

// JWT Secret Key (читается из окружения или дефолтный безопасный ключ)
var jwtSecretKey = func() []byte {
	k := os.Getenv("JWT_SECRET")
	if k == "" {
		k = "new_age_super_secret_jwt_key_2026_zen_platform"
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
}

type PersistentData struct {
	Accounts      map[string]AccountStoreEntry `json:"accounts"`
	Relationships map[string][]string          `json:"relationships"`
	Posts         []Post                       `json:"posts"`
}

const storeFilePath = "data/social_network_store.json"

func (s *UserStore) saveToDisk() {
	if err := os.MkdirAll("data", 0755); err != nil {
		return
	}
	data := PersistentData{
		Accounts:      s.accounts,
		Relationships: s.relationships,
		Posts:         s.posts,
	}
	b, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return
	}
	tmpPath := storeFilePath + ".tmp"
	if err := os.WriteFile(tmpPath, b, 0644); err == nil {
		os.Rename(tmpPath, storeFilePath)
	}
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
	}
	if data.Relationships != nil {
		s.relationships = data.Relationships
	}
	if data.Posts != nil {
		s.posts = data.Posts
	}
	log.Printf("📦 Успешно загружено из локального хранилища %s: %d аккаунтов, %d постов", storeFilePath, len(s.accounts), len(s.posts))
}

var store = &UserStore{
	accounts:      make(map[string]AccountStoreEntry),
	relationships: make(map[string][]string),
	posts:         make([]Post, 0),
}

var currentUser = User{
	ID:             "guest",
	Name:           "Гость",
	Username:       "guest",
	Avatar:         "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
	Bio:            "Гостевой доступ New Age",
	Online:         false,
	Role:           "user",
	BeliefType:     "Не указано",
	BeliefPrivacy:  "private",
	FollowersCount: 0,
	FollowingCount: 0,
	PostsCount:     0,
}

var mockUsers = []User{
	{ID: "1", Name: "Алиса Иванова", Username: "alice_iv", Avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80", Bio: "Product Designer & Фотограф", Online: true, FollowersCount: 8420, FollowingCount: 430, PostsCount: 156},
	{ID: "2", Name: "Максим Петров", Username: "max_p", Avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", Bio: "Frontend Architect & Автор подкастов", Online: true, FollowersCount: 15300, FollowingCount: 290, PostsCount: 84},
	{ID: "3", Name: "Екатерина Смирнова", Username: "kate_s", Avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", Bio: "UX Исследования & Дизайн мышление", Online: false, FollowersCount: 6890, FollowingCount: 512, PostsCount: 62},
	{ID: "4", Name: "Дмитрий Козлов", Username: "dima_k", Avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80", Bio: "Tech Entrepreneur & Инновации", Online: true, FollowersCount: 22400, FollowingCount: 190, PostsCount: 110},
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
	h := sha256.New()
	h.Write([]byte(password + ":" + salt + ":new_age_pepper"))
	return hex.EncodeToString(h.Sum(nil))
}

func checkPassword(password, salt, expectedHash string) bool {
	return hashPassword(password, salt) == expectedHash
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
	mux.HandleFunc("GET /api/marketplace", handleMarketplace)
	mux.HandleFunc("GET /api/communities", handleCommunities)
	mux.HandleFunc("GET /api/wallet", handleWallet)
	mux.HandleFunc("GET /api/admin/stats", handleAdminStats)

	// Auth эндпоинты (JWT)
	mux.HandleFunc("POST /api/auth/register", handleRegister)
	mux.HandleFunc("POST /api/auth/login", handleLogin)
	mux.HandleFunc("GET /api/auth/me", handleAuthMe)
	mux.HandleFunc("GET /api/auth/check-username", handleCheckUsername)

	// SMS авторизация
	mux.HandleFunc("POST /api/auth/send-code", handleSendCode)
	mux.HandleFunc("POST /api/auth/verify-code", handleVerifyCode)

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
	mux.HandleFunc("POST /api/stories/{id}/view", handleViewStory)

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

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// formatTimeAgo возвращает "сколько времени назад" на русском
func formatTimeAgo(t time.Time) string {
	diff := time.Since(t)
	switch {
	case diff < time.Minute:
		return "только что"
	case diff < time.Hour:
		m := int(diff.Minutes())
		return fmt.Sprintf("%d мин назад", m)
	case diff < 24*time.Hour:
		h := int(diff.Hours())
		if h == 1 { return "1 час назад" }
		return fmt.Sprintf("%d часов назад", h)
	case diff < 7*24*time.Hour:
		d := int(diff.Hours() / 24)
		if d == 1 { return "вчера" }
		return fmt.Sprintf("%d дней назад", d)
	case diff < 30*24*time.Hour:
		w := int(diff.Hours() / 24 / 7)
		if w == 1 { return "1 неделю назад" }
		return fmt.Sprintf("%d недель назад", w)
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
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: currentUser})
}

func handleUsers(w http.ResponseWriter, r *http.Request) {
	if db != nil {
		rows, err := db.Query("SELECT id, name, username, avatar, COALESCE(bio, ''), COALESCE(role, 'user'), COALESCE(belief_type, ''), COALESCE(belief_privacy, 'public'), COALESCE(verified, false), followers_count, following_count, critics_count, posts_count FROM users ORDER BY created_at DESC LIMIT 50")
		if err == nil {
			defer rows.Close()
			var dbUsers []User
			for rows.Next() {
				var u User
				if err := rows.Scan(&u.ID, &u.Name, &u.Username, &u.Avatar, &u.Bio, &u.Role, &u.BeliefType, &u.BeliefPrivacy, &u.Verified, &u.FollowersCount, &u.FollowingCount, &u.CriticsCount, &u.PostsCount); err == nil {
					u.Online = true
					dbUsers = append(dbUsers, u)
				}
			}
			if len(dbUsers) > 0 {
				writeJSON(w, http.StatusOK, Response{Status: "ok", Data: append(dbUsers, mockUsers...)})
				return
			}
		}
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: mockUsers})
}

func handleSearch(w http.ResponseWriter, r *http.Request) {
	q := strings.ToLower(r.URL.Query().Get("q"))
	if q == "" {
		writeJSON(w, http.StatusOK, Response{Status: "ok", Data: []User{}})
		return
	}

	if db != nil {
		rows, err := db.Query("SELECT id, name, username, avatar, COALESCE(bio, ''), COALESCE(role, 'user'), COALESCE(belief_type, ''), COALESCE(belief_privacy, 'public'), COALESCE(verified, false), followers_count, following_count, critics_count, posts_count FROM users WHERE LOWER(name) LIKE $1 OR LOWER(username) LIKE $1 LIMIT 20", "%"+q+"%")
		if err == nil {
			defer rows.Close()
			var results []User
			for rows.Next() {
				var u User
				if err := rows.Scan(&u.ID, &u.Name, &u.Username, &u.Avatar, &u.Bio, &u.Role, &u.BeliefType, &u.BeliefPrivacy, &u.Verified, &u.FollowersCount, &u.FollowingCount, &u.CriticsCount, &u.PostsCount); err == nil {
					results = append(results, u)
				}
			}
			if len(results) > 0 {
				writeJSON(w, http.StatusOK, Response{Status: "ok", Data: results})
				return
			}
		}
	}

	var results []User
	for _, u := range mockUsers {
		if strings.Contains(strings.ToLower(u.Name), q) || strings.Contains(strings.ToLower(u.Username), q) {
			results = append(results, u)
		}
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
			       u.id, u.name, u.username, COALESCE(u.avatar, ''), COALESCE(u.verified, false)
			FROM posts p
			JOIN users u ON p.user_id = u.id
			ORDER BY p.created_at DESC LIMIT 50
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
			       u.id, u.name, u.username, COALESCE(u.avatar, ''), COALESCE(u.verified, false)
			FROM posts p
			JOIN users u ON p.user_id = u.id
			WHERE u.id = $1 OR LOWER(u.username) = LOWER($1) OR LOWER(u.username) = LOWER($2)
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
	if cached, ok := globalCache.Get("api:videos"); ok {
		writeJSON(w, http.StatusOK, Response{Status: "ok", Data: cached})
		return
	}
	if db != nil {
		rows, err := db.Query(`
			SELECT v.id, v.title, v.description, v.thumbnail_url, v.video_url, v.duration, v.views_count, v.likes_count, v.created_at,
				u.id, u.name, u.username, u.avatar
			FROM videos v JOIN users u ON v.user_id = u.id
			WHERE v.status = 'published' ORDER BY v.created_at DESC LIMIT 50
		`)
		if err == nil {
			defer rows.Close()
			var videos []map[string]interface{}
			for rows.Next() {
				var id, title, desc, thumb, videoUrl, userId, userName, userUsername, userAvatar string
				var duration int
				var viewsCount, likesCount int
				var createdAt time.Time
				if err := rows.Scan(&id, &title, &desc, &thumb, &videoUrl, &duration, &viewsCount, &likesCount, &createdAt, &userId, &userName, &userUsername, &userAvatar); err == nil {
					videos = append(videos, map[string]interface{}{
						"id": id, "title": title, "description": desc,
						"thumbnail": thumb, "videoUrl": videoUrl,
						"duration": fmt.Sprintf("%d:%02d", duration/60, duration%60),
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
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: []interface{}{}})
}

func handleChats(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Авторизация требуется"})
		return
	}
	if db != nil {
		rows, err := db.Query(`
			SELECT c.id, c.chat_type, c.name,
				COALESCE((SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1), '') as last_msg,
				COALESCE((SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND sender_id != $1 AND is_read = false), 0) as unread
			FROM chats c
			JOIN chat_members cm ON c.id = cm.chat_id
			WHERE cm.user_id = $1
			ORDER BY c.updated_at DESC
		`, claims.UserID)
		if err == nil {
			defer rows.Close()
			var chats []map[string]interface{}
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
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: []interface{}{}})
}

func handlePodcasts(w http.ResponseWriter, r *http.Request) {
	if db != nil {
		rows, err := db.Query(`SELECT id, title, author, cover_url, description FROM podcasts ORDER BY created_at DESC LIMIT 20`)
		if err == nil {
			defer rows.Close()
			var podcasts []map[string]interface{}
			for rows.Next() {
				var id, title, author, cover, desc string
				if err := rows.Scan(&id, &title, &author, &cover, &desc); err == nil {
					// Get episodes
					epRows, _ := db.Query(`SELECT id, title, duration, TO_CHAR(created_at, 'DD Mon') FROM podcast_episodes WHERE podcast_id = $1 ORDER BY episode_number DESC`, id)
					var episodes []map[string]interface{}
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
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: []interface{}{}})
}

func handleMarketplace(w http.ResponseWriter, r *http.Request) {
	if db != nil {
		rows, err := db.Query(`
			SELECT p.id, p.title, p.price, p.currency, p.rating, p.image_url, p.status,
				u.name as author, c.name as category
			FROM marketplace_products p
			JOIN users u ON p.seller_id = u.id
			LEFT JOIN marketplace_categories c ON p.category_id = c.id
			WHERE p.status = 'active'
			ORDER BY p.created_at DESC LIMIT 50
		`)
		if err == nil {
			defer rows.Close()
			var products []map[string]interface{}
			for rows.Next() {
				var id, title, currency, imageUrl, status, author, category string
				var price float64
				var rating float64
				if err := rows.Scan(&id, &title, &price, &currency, &rating, &imageUrl, &status, &author, &category); err == nil {
					products = append(products, map[string]interface{}{"id": id, "title": title, "price": price, "currency": currency, "rating": rating, "image": imageUrl, "author": author, "category": category})
				}
			}
			writeJSON(w, http.StatusOK, Response{Status: "ok", Data: products})
			return
		}
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: []interface{}{}})
}

func handleCommunities(w http.ResponseWriter, r *http.Request) {
	if db != nil {
		rows, err := db.Query(`
			SELECT id, name, description, avatar_url, cover_url, members_count, category, is_verified
			FROM communities ORDER BY members_count DESC LIMIT 50
		`)
		if err == nil {
			defer rows.Close()
			var communities []map[string]interface{}
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
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: []interface{}{}})
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
			SELECT id, transaction_type, amount, currency, description, created_at
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

func handleAdminStats(w http.ResponseWriter, r *http.Request) {
	stats := map[string]interface{}{
		"dau":            142580,
		"marketplaceGMV": 4820000,
		"revenue":        724500,
		"pendingReports": 3,
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

	store.mu.Lock()
	defer store.mu.Unlock()

	// Проверка на существующего пользователя в памяти
	for _, entry := range store.accounts {
		if strings.ToLower(entry.User.Username) == cleanUsername {
			writeJSON(w, http.StatusConflict, Response{Status: "error", Message: fmt.Sprintf("ID @%s уже занят другим пользователем", cleanUsername)})
			return
		}
		if strings.ToLower(entry.EmailOrPhone) == cleanEmailOrPhone {
			writeJSON(w, http.StatusConflict, Response{Status: "error", Message: "Аккаунт с таким email или телефоном уже существует"})
			return
		}
	}

	newID := "u_" + time.Now().Format("20060102150405")
	avatar := req.Avatar
	if avatar == "" {
		avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
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

	mockUsers = append([]User{newUser}, mockUsers...)
	currentUser = newUser

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

	currentUser = foundAccount.User

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

	var user *User

	// Ищем в PostgreSQL
	if db != nil {
		var u User
		query := `
		SELECT id, name, username, avatar, COALESCE(bio, ''), COALESCE(role, 'user'), COALESCE(belief_type, ''), COALESCE(belief_privacy, 'public'), COALESCE(verified, false), followers_count, following_count, critics_count, posts_count
		FROM users WHERE id = $1 LIMIT 1
		`
		err := db.QueryRow(query, claims.UserID).Scan(
			&u.ID, &u.Name, &u.Username, &u.Avatar, &u.Bio, &u.Role, &u.BeliefType, &u.BeliefPrivacy, &u.Verified, &u.FollowersCount, &u.FollowingCount, &u.CriticsCount, &u.PostsCount,
		)
		if err == nil {
			u.Online = true
			user = &u
		}
	}

	// Fallback в in-memory store
	if user == nil {
		store.mu.RLock()
		account, exists := store.accounts[claims.UserID]
		store.mu.RUnlock()
		if exists {
			user = &account.User
		}
	}

	if user == nil {
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

	code := strconv.Itoa(mathrand.Intn(9000) + 1000)
	expiresIn := 300

	if db != nil {
		_, err := db.Exec(`
			INSERT INTO sms_verifications (phone_number, code, purpose, expires_at, attempts, is_used)
			VALUES ($1, $2, 'login', NOW() + interval '5 minutes', 0, false)
		`, req.Phone, code)
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

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: "Код отправлен",
		Data: map[string]interface{}{
			"code":       code,
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
			FROM users WHERE phone = $1
		`, req.Phone).Scan(&user.ID, &user.Name, &user.Username, &user.Avatar, &user.Bio, &user.Location, &user.Verified)
		if err == sql.ErrNoRows {
			isNewUser = true
			user.ID = "u_" + time.Now().Format("20060102150405")
			user.Username = "user_" + strconv.FormatInt(time.Now().UnixNano(), 10)[:8]
			user.Name = "Пользователь"
			_, err = db.Exec(`
				INSERT INTO users (id, phone, username, name, created_at)
				VALUES ($1, $2, $3, $4, NOW())
			`, user.ID, req.Phone, user.Username, user.Name)
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
			user.ID = "u_" + time.Now().Format("20060102150405")
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

func getRelationshipCounts(targetID string) (followersCount, followingCount, friendsCount int) {
	store.mu.RLock()
	defer store.mu.RUnlock()

	following := store.relationships[targetID]
	followingCount = len(following)

	followingMap := make(map[string]bool, len(following))
	for _, id := range following {
		followingMap[id] = true
	}

	for followerID, targets := range store.relationships {
		if followerID == targetID {
			continue
		}
		for _, tid := range targets {
			if tid == targetID {
				followersCount++
				if followingMap[followerID] {
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
	db.QueryRow("SELECT COUNT(*) FROM user_relationships WHERE target_id = $1 AND rel_type = 'follow'", targetID).Scan(&followersCount)
	db.QueryRow("SELECT COUNT(*) FROM user_relationships WHERE follower_id = $1 AND rel_type = 'follow'", targetID).Scan(&followingCount)
	db.QueryRow(`
		SELECT COUNT(*) FROM user_relationships r1
		JOIN user_relationships r2 ON r1.follower_id = r2.target_id AND r1.target_id = r2.follower_id
		WHERE r1.follower_id = $1 AND r1.rel_type = 'follow' AND r2.rel_type = 'follow'
	`, targetID).Scan(&friendsCount)
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
	var targetID string

	if db != nil {
		err := db.QueryRow("SELECT id FROM users WHERE id = $1 OR LOWER(username) = LOWER($2)", rawTarget, cleanTarget).Scan(&targetID)
		if err != nil {
			targetID = rawTarget
		}

		if claims.UserID == targetID {
			writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Нельзя подписаться на самого себя"})
			return
		}

		_, err = db.Exec(`
			INSERT INTO user_relationships (id, follower_id, target_id, rel_type)
			VALUES ($1, $2, $3, 'follow') ON CONFLICT DO NOTHING
		`, uuid.New().String(), claims.UserID, targetID)
		if err == nil {
			db.Exec("UPDATE users SET followers_count = (SELECT COUNT(*) FROM user_relationships WHERE target_id = $1 AND rel_type = 'follow') WHERE id = $1", targetID)
			db.Exec("UPDATE users SET following_count = (SELECT COUNT(*) FROM user_relationships WHERE follower_id = $1 AND rel_type = 'follow') WHERE id = $1", claims.UserID)
		}

		followers, _, friends := getDBRelationshipCounts(targetID)
		_, myFollowing, _ := getDBRelationshipCounts(claims.UserID)

		var reverseCount int
		db.QueryRow("SELECT COUNT(*) FROM user_relationships WHERE follower_id = $1 AND target_id = $2 AND rel_type = 'follow'", targetID, claims.UserID).Scan(&reverseCount)
		isFriend := reverseCount > 0

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
		return
	}

	// In-memory store
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
	var targetID string

	if db != nil {
		err := db.QueryRow("SELECT id FROM users WHERE id = $1 OR LOWER(username) = LOWER($2)", rawTarget, cleanTarget).Scan(&targetID)
		if err != nil {
			targetID = rawTarget
		}

		_, err = db.Exec(`
			DELETE FROM user_relationships 
			WHERE follower_id = $1 AND target_id = $2 AND rel_type = 'follow'
		`, claims.UserID, targetID)
		if err == nil {
			db.Exec("UPDATE users SET followers_count = (SELECT COUNT(*) FROM user_relationships WHERE target_id = $1 AND rel_type = 'follow') WHERE id = $1", targetID)
			db.Exec("UPDATE users SET following_count = (SELECT COUNT(*) FROM user_relationships WHERE follower_id = $1 AND rel_type = 'follow') WHERE id = $1", claims.UserID)
		}

		followers, _, friends := getDBRelationshipCounts(targetID)
		_, myFollowing, _ := getDBRelationshipCounts(claims.UserID)

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
		var resolvedID string
		err := db.QueryRow("SELECT id FROM users WHERE id = $1 OR LOWER(username) = LOWER($2)", targetID, cleanTarget).Scan(&resolvedID)
		if err == nil {
			targetID = resolvedID
		}
		rows, err := db.Query(`
			SELECT u.id, u.username, u.name, COALESCE(u.avatar, ''), COALESCE(u.bio, ''), COALESCE(u.location, ''), 
			       COALESCE(u.followers_count, 0), COALESCE(u.following_count, 0), COALESCE(u.posts_count, 0), COALESCE(u.verified, false)
			FROM users u
			JOIN user_relationships r ON u.id = r.follower_id
			WHERE r.target_id = $1 AND r.rel_type = 'follow'
			ORDER BY r.created_at DESC
		`, targetID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var u User
				rows.Scan(&u.ID, &u.Username, &u.Name, &u.Avatar, &u.Bio, &u.Location, &u.FollowersCount, &u.FollowingCount, &u.PostsCount, &u.Verified)
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
						followers = append(followers, acc.User)
					} else {
						for _, mu := range mockUsers {
							if mu.ID == followerID {
								followers = append(followers, mu)
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
		var resolvedID string
		err := db.QueryRow("SELECT id FROM users WHERE id = $1 OR LOWER(username) = LOWER($2)", targetID, cleanTarget).Scan(&resolvedID)
		if err == nil {
			targetID = resolvedID
		}
		rows, err := db.Query(`
			SELECT u.id, u.username, u.name, COALESCE(u.avatar, ''), COALESCE(u.bio, ''), COALESCE(u.location, ''), 
			       COALESCE(u.followers_count, 0), COALESCE(u.following_count, 0), COALESCE(u.posts_count, 0), COALESCE(u.verified, false)
			FROM users u
			JOIN user_relationships r ON u.id = r.target_id
			WHERE r.follower_id = $1 AND r.rel_type = 'follow'
			ORDER BY r.created_at DESC
		`, targetID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var u User
				rows.Scan(&u.ID, &u.Username, &u.Name, &u.Avatar, &u.Bio, &u.Location, &u.FollowersCount, &u.FollowingCount, &u.PostsCount, &u.Verified)
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
					following = append(following, acc.User)
				} else {
					for _, mu := range mockUsers {
						if mu.ID == tid {
							following = append(following, mu)
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
		var resolvedID string
		err := db.QueryRow("SELECT id FROM users WHERE id = $1 OR LOWER(username) = LOWER($2)", targetID, cleanTarget).Scan(&resolvedID)
		if err == nil {
			targetID = resolvedID
		}
		rows, err := db.Query(`
			SELECT u.id, u.username, u.name, COALESCE(u.avatar, ''), COALESCE(u.bio, ''), COALESCE(u.location, ''), COALESCE(u.verified, false)
			FROM users u
			WHERE u.id IN (
				SELECT r1.target_id FROM user_relationships r1
				JOIN user_relationships r2 ON r1.follower_id = r2.target_id AND r1.target_id = r2.follower_id
				WHERE r1.follower_id = $1 AND r1.rel_type = 'follow' AND r2.rel_type = 'follow'
			)
		`, targetID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var u User
				rows.Scan(&u.ID, &u.Username, &u.Name, &u.Avatar, &u.Bio, &u.Location, &u.Verified)
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
		db.Exec("UPDATE users SET followers_count = (SELECT COUNT(*) FROM user_relationships WHERE target_id = $1 AND rel_type = 'follow') WHERE id = $1", targetID)
		db.Exec("UPDATE users SET following_count = (SELECT COUNT(*) FROM user_relationships WHERE follower_id = $1 AND rel_type = 'follow') WHERE id = $1", targetID)
		db.Exec("UPDATE users SET followers_count = (SELECT COUNT(*) FROM user_relationships WHERE target_id = $1 AND rel_type = 'follow') WHERE id = $1", claims.UserID)
		db.Exec("UPDATE users SET following_count = (SELECT COUNT(*) FROM user_relationships WHERE follower_id = $1 AND rel_type = 'follow') WHERE id = $1", claims.UserID)

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
		err := db.QueryRow(`
			SELECT id, username, name, COALESCE(avatar, ''), COALESCE(cover_image, ''), COALESCE(bio, ''), COALESCE(location, ''), 
			       COALESCE(website, ''), COALESCE(role, 'user'), COALESCE(belief_type, ''), COALESCE(belief_privacy, 'public'), 
			       COALESCE(birth_date, ''), COALESCE(gender, 'hidden'), COALESCE(show_birth_date, true), COALESCE(show_zodiac, true),
			       COALESCE(followers_count, 0), COALESCE(following_count, 0), COALESCE(posts_count, 0), COALESCE(verified, false)
			FROM users WHERE id = $1 OR LOWER(username) = LOWER($1) OR LOWER(username) = LOWER($2)
		`, targetID, cleanTarget).Scan(
			&user.ID, &user.Username, &user.Name, &user.Avatar, &user.CoverImage, &user.Bio, &user.Location,
			&user.Website, &user.Role, &user.BeliefType, &user.BeliefPrivacy,
			&user.BirthDate, &user.Gender, &user.ShowBirthDate, &user.ShowZodiac,
			&user.FollowersCount, &user.FollowingCount, &user.PostsCount, &user.Verified,
		)
		if err != nil {
			log.Printf("⚠️ handleUserProfile user not found or error for %s (%s): %v", targetID, cleanTarget, err)
			writeJSON(w, http.StatusNotFound, Response{Status: "error", Message: "Пользователь не найден"})
			return
		}
		
		// Accurate dynamic relationship counts
		user.FollowersCount, user.FollowingCount, user.FriendsCount = getDBRelationshipCounts(user.ID)

		// Clips count
		db.QueryRow(`SELECT COUNT(*) FROM clips WHERE user_id = $1`, user.ID).Scan(&user.ClipsCount)
		// Dynamic posts count from DB
		db.QueryRow(`SELECT COUNT(*) FROM posts WHERE user_id = $1`, user.ID).Scan(&user.PostsCount)

		if claims != nil {
			var count int
			db.QueryRow("SELECT COUNT(*) FROM user_relationships WHERE follower_id = $1 AND target_id = $2 AND rel_type = 'follow'", claims.UserID, user.ID).Scan(&count)
			user.IsFollowed = count > 0

			// Check if mutual friends
			if user.IsFollowed {
				var reverseCount int
				db.QueryRow("SELECT COUNT(*) FROM user_relationships WHERE follower_id = $1 AND target_id = $2 AND rel_type = 'follow'", user.ID, claims.UserID).Scan(&reverseCount)
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
			WHERE id = $11
		`, req.Name, req.Bio, req.Avatar, req.CoverImage, req.Location, req.Website, req.BeliefType, req.BeliefPrivacy, req.BirthDate, req.Gender, claims.UserID)
		if err != nil {
			log.Printf("⚠️ Ошибка обновления профиля в DB: %v", err)
			writeJSON(w, http.StatusInternalServerError, Response{Status: "error", Message: "Ошибка обновления профиля"})
			return
		}
	}

	// Синхронизируем также с локальным дисковым хранилищем
	store.mu.Lock()
	acc, ok := store.accounts[claims.UserID]
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
		store.accounts[claims.UserID] = acc
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

	postID := "post_" + strconv.FormatInt(time.Now().UnixMilli(), 10)
	var author User
	if db != nil {
		db.QueryRow("SELECT id, name, username, COALESCE(avatar, ''), COALESCE(verified, false) FROM users WHERE id = $1", claims.UserID).Scan(
			&author.ID, &author.Name, &author.Username, &author.Avatar, &author.Verified,
		)
	}
	if author.ID == "" {
		store.mu.RLock()
		if acc, ok := store.accounts[claims.UserID]; ok {
			author = acc.User
		}
		store.mu.RUnlock()
	}
	if author.ID == "" {
		for _, mu := range mockUsers {
			if mu.ID == claims.UserID || mu.Username == claims.Username {
				author = mu
				break
			}
		}
	}
	if author.ID == "" {
		author = User{
			ID:       claims.UserID,
			Username: claims.Username,
			Name:     claims.Username,
		}
	}

	newPost := Post{
		ID:        postID,
		UserID:    claims.UserID,
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
		`, postID, claims.UserID, image, caption, location)
		if err != nil {
			log.Printf("⚠️ Ошибка сохранения поста в Postgres: %v", err)
		} else {
			db.Exec("UPDATE users SET posts_count = posts_count + 1 WHERE id = $1", claims.UserID)
		}
	}

	// Всегда сохраняем в постоянное дисковое хранилище
	store.mu.Lock()
	store.posts = append([]Post{newPost}, store.posts...)
	if acc, ok := store.accounts[claims.UserID]; ok {
		acc.User.PostsCount++
		store.accounts[claims.UserID] = acc
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
	if db != nil {
		rows, err := db.Query(`
			SELECT s.id, s.media_url, s.media_type, s.caption, s.created_at, s.expires_at, s.views_count,
				u.id, u.name, u.username, u.avatar
			FROM stories s JOIN users u ON s.user_id = u.id
			WHERE s.expires_at > NOW()
			ORDER BY s.created_at DESC
		`)
		if err == nil {
			defer rows.Close()
			var stories []map[string]interface{}
			for rows.Next() {
				var sid, mediaUrl, mediaType, caption, uid, uname, uusername, uavatar string
				var createdAt, expiresAt time.Time
				var viewsCount int
				if rows.Scan(&sid, &mediaUrl, &mediaType, &caption, &createdAt, &expiresAt, &viewsCount, &uid, &uname, &uusername, &uavatar) == nil {
					stories = append(stories, map[string]interface{}{
						"id": sid, "mediaUrl": mediaUrl, "mediaType": mediaType, "caption": caption,
						"viewsCount": viewsCount, "timeAgo": formatTimeAgo(createdAt),
						"user": map[string]interface{}{"id": uid, "name": uname, "username": uusername, "avatar": uavatar},
					})
				}
			}
			writeJSON(w, http.StatusOK, Response{Status: "ok", Data: stories})
			return
		}
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: []interface{}{}})
}

func handleClips(w http.ResponseWriter, r *http.Request) {
	if db != nil {
		rows, err := db.Query(`
			SELECT c.id, c.video_url, c.thumbnail_url, c.caption, c.likes_count, c.views_count, c.comments_count, c.created_at,
				u.id, u.name, u.username, u.avatar
			FROM clips c JOIN users u ON c.user_id = u.id
			ORDER BY c.created_at DESC LIMIT 50
		`)
		if err == nil {
			defer rows.Close()
			var clips []map[string]interface{}
			for rows.Next() {
				var cid, videoUrl, thumbUrl, caption, uid, uname, uusername, uavatar string
				var likesCount, viewsCount, commentsCount int
				var createdAt time.Time
				if rows.Scan(&cid, &videoUrl, &thumbUrl, &caption, &likesCount, &viewsCount, &commentsCount, &createdAt, &uid, &uname, &uusername, &uavatar) == nil {
					clips = append(clips, map[string]interface{}{
						"id": cid, "videoUrl": videoUrl, "thumbnail": thumbUrl, "caption": caption,
						"likes": likesCount, "views": viewsCount, "commentsCount": commentsCount,
						"user": map[string]interface{}{"id": uid, "name": uname, "username": uusername, "avatar": uavatar},
					})
				}
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
• Ты помогаешь людям в вопросах морали, этики, духовного развития, религии и повседневной жизни
• Ты уважаешь ВСЕ религии и духовные традиции — буддизм, ислам, христианство, индуизм, даосизм, иудаизм и другие
• Ты НЕ навязываешь никакую конкретную религию, а помогаешь человеку найти СВОЙ путь

СТИЛЬ ОБЩЕНИЯ:
• Говори тепло, с эмпатией и уважением
• Используй эмодзи умеренно (✨ 🙏 💫 🌟 💡) для выразительности
• Отвечай на русском языке
• Будь конкретным — давай практичные советы, а не абстрактные фразы
• Если вопрос сложный — предложи посмотреть на ситуацию с разных сторон
• Можешь цитировать мудрость из разных традиций (Будда, Руми, Библия, Коран, Бхагавад-Гита, стоики, Лао-Цзы)

ЧТО ТЫ УМЕЕШЬ:
• Жизненные советы — отношения, семья, карьера, финансы, здоровье
• Духовное развитие — медитация, осознанность, практики, самопознание
• Моральные дилеммы — помоги разобраться что правильно
• Религиозные вопросы — расскажи о разных традициях с уважением
• Эмоциональная поддержка — выслушай, поддержи, дай надежду
• Мотивация — вдохнови на действия и перемены
• Помощь с платформой New Age — объясни функции приложения

ОГРАНИЧЕНИЯ:
• НЕ давай медицинских диагнозов — направляй к врачу
• НЕ давай юридических консультаций — направляй к юристу
• НЕ поддерживай насилие, ненависть или дискриминацию
• Если человеку очень плохо — аккуратно направь к профессиональной помощи

Отвечай содержательно, но не слишком длинно — 2-4 абзаца максимум.`

type aiChatRequest struct {
	Message string `json:"message"`
	History []struct {
		Role string `json:"role"`
		Text string `json:"text"`
	} `json:"history"`
}

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
	historyLimit := 10
	startIdx := 0
	if len(req.History) > historyLimit {
		startIdx = len(req.History) - historyLimit
	}
	for _, h := range req.History[startIdx:] {
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

	geminiBody := map[string]interface{}{
		"contents": contents,
		"systemInstruction": map[string]interface{}{
			"parts": []map[string]string{{"text": oracleSystemPrompt}},
		},
		"generationConfig": map[string]interface{}{
			"temperature":     0.8,
			"topP":            0.95,
			"maxOutputTokens": 8192,
		},
	}

	bodyBytes, _ := json.Marshal(geminiBody)

	// Список моделей: основная + fallback
	models := []string{"gemini-3.6-flash", "gemini-3.5-flash"}
	var lastErr string

	for _, model := range models {
		url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey)

		ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)

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

	var messages []map[string]interface{}
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

	var members []map[string]interface{}
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
		writeJSON(w, 401, Response{Status: "error", Message: "unauthorized"})
		return
	}

	var req struct {
		MediaUrl    string `json:"mediaUrl"`
		MediaType   string `json:"mediaType"`
		TextOverlay string `json:"textOverlay"`
		BgColor     string `json:"bgColor"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, Response{Status: "error", Message: "invalid json"})
		return
	}

	storyID := uuid.New().String()

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()
	if dbConn != nil {
		_, _ = dbConn.Exec(`
			INSERT INTO stories (id, user_id, media_url, media_type, text_overlay, bg_color, expires_at, created_at) 
			VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '24 hours', NOW())
		`, storyID, claims.UserID, req.MediaUrl, req.MediaType, req.TextOverlay, req.BgColor)
	}

	writeJSON(w, 200, Response{Status: "ok", Data: map[string]string{"id": storyID}})
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

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()
	if dbConn == nil {
		writeJSON(w, 503, Response{Status: "error", Message: "db not connected"})
		return
	}

	res, err := dbConn.Exec(`INSERT INTO story_views (story_id, viewer_id, viewed_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`, storyID, claims.UserID)
	if err != nil {
		writeJSON(w, 500, Response{Status: "error", Message: err.Error()})
		return
	}

	if affected, _ := res.RowsAffected(); affected > 0 {
		dbConn.Exec(`UPDATE stories SET views_count = views_count + 1 WHERE id = $1`, storyID)
	}

	writeJSON(w, 200, Response{Status: "ok"})
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

	clipID := uuid.New().String()
	_, err = dbConn.Exec(`
		INSERT INTO clips (id, user_id, video_url, thumbnail_url, description, sound_title, created_at) 
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
	`, clipID, claims.UserID, req.VideoUrl, req.ThumbnailUrl, req.Description, req.SoundTitle)
	if err != nil {
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
	lower := strings.ToLower(strings.TrimSpace(text))

	replies := map[string]string{
		"привет":   "Привет! 👋 Я ИИ Оракул — мудрый помощник платформы New Age. Чем могу помочь? Спрашивай о жизни, духовности, отношениях — я здесь для тебя ✨",
		"помощь":   "📚 Я могу помочь с:\n\n• 🙏 Духовное развитие и медитация\n• 💡 Жизненные советы и мотивация\n• ❤️ Отношения и семья\n• ⚖️ Моральные вопросы\n• 🌟 Самопознание\n• 📱 Функции платформы New Age\n\nПросто напиши свой вопрос!",
		"кто ты":   "🤖 Я ИИ Оракул — цифровой наставник платформы New Age. Моя задача — помогать людям на их жизненном пути: советами, поддержкой и мудростью из разных духовных традиций мира ✨",
		"спасибо":  "Пожалуйста! 🙏 Помни: каждый день — это возможность стать лучшей версией себя. Обращайся в любое время 💫",
		"смысл жизни": "✨ Великие мудрецы отвечали по-разному:\n\n🙏 Будда: «Цель жизни — избавление от страданий через осознанность»\n📖 Виктор Франкл: «Смысл не дан нам — мы сами его создаём»\n🌟 Конфуций: «Найди дело, которое любишь, и не будешь работать ни дня»\n\nТвой смысл — это то, что даёт тебе энергию, радость и ощущение нужности. Что сейчас наполняет твою жизнь?",
		"медитация": "🧘 Простая медитация для начинающих:\n\n1. Сядь удобно, закрой глаза\n2. Сосредоточься на дыхании — вдох 4 сек, задержка 4 сек, выдох 6 сек\n3. Когда мысли уносят — мягко верни внимание к дыханию\n4. Начни с 5 минут, постепенно увеличивай\n\n✨ Регулярная практика снижает стресс, улучшает сон и повышает концентрацию. Главное — не результат, а процесс 🙏",
	}

	for key, reply := range replies {
		if strings.Contains(lower, key) {
			return reply
		}
	}

	// Категория ответов
	genericReplies := []string{
		"✨ Интересный вопрос! Каждый жизненный вызов — это возможность для роста. Расскажи подробнее, и я постараюсь помочь 🙏",
		"💫 Мудрость приходит через опыт и размышления. Давай разберёмся в этом вместе. Что именно тебя волнует?",
		"🌟 Как говорил Лао-Цзы: «Путь в тысячу ли начинается с первого шага». Я рядом, чтобы помочь сделать этот шаг ✨",
		"💡 Каждая ситуация имеет решение. Иногда нужно просто посмотреть на неё под другим углом. Расскажи больше!",
		"🙏 Я слышу тебя. Расскажи подробнее — вместе мы найдём ответ. Помни: ты сильнее, чем думаешь ✨",
	}

	return genericReplies[mathrand.Intn(len(genericReplies))]
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
