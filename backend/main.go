package main

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	_ "github.com/lib/pq"
)

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
}

// User — пользователь платформы New Age.
type User struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Username       string `json:"username"`
	Avatar         string `json:"avatar"`
	Bio            string `json:"bio,omitempty"`
	Online         bool   `json:"online"`
	Role           string `json:"role,omitempty"`
	BeliefType     string `json:"beliefType,omitempty"`
	BeliefPrivacy  string `json:"beliefPrivacy,omitempty"`
	Verified       bool   `json:"verified,omitempty"`
	FollowersCount int    `json:"followersCount"`
	FollowingCount int    `json:"followingCount"`
	CriticsCount   int    `json:"criticsCount,omitempty"`
	PostsCount     int    `json:"postsCount"`
}

// AccountStoreEntry — внутренняя запись пользователя с хешем пароля.
type AccountStoreEntry struct {
	User         User
	EmailOrPhone string
	PasswordHash string
	Salt         string
	CreatedAt    time.Time
}

// Post — пост в ленте.
type Post struct {
	ID      string `json:"id"`
	User    User   `json:"user"`
	Image   string `json:"image"`
	Caption string `json:"caption"`
	Likes   int    `json:"likes"`
	TimeAgo string `json:"timeAgo"`
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

// Глобальное подключение к PostgreSQL (если задана DATABASE_URL)
var db *sql.DB

func initDB() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Println("ℹ️ Переменная DATABASE_URL не задана. Работа в in-memory режиме.")
		return
	}

	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Printf("⚠️ Ошибка открытия соединения с PostgreSQL: %v", err)
		return
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Printf("⚠️ Не удалось связаться с PostgreSQL (%v). Используется in-memory хранилище.", err)
		return
	}

	log.Println("✅ Успешное подключение к PostgreSQL на Railway!")

	// Создание таблицы пользователей при первом запуске
	createTableQuery := `
	CREATE TABLE IF NOT EXISTS users (
		id VARCHAR(64) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		username VARCHAR(100) UNIQUE NOT NULL,
		email_or_phone VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		salt VARCHAR(64) NOT NULL,
		avatar TEXT,
		cover_image TEXT,
		bio TEXT,
		website TEXT,
		location TEXT,
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
	CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
	CREATE INDEX IF NOT EXISTS idx_users_email_or_phone ON users(email_or_phone);
	`
	if _, err := db.Exec(createTableQuery); err != nil {
		log.Printf("⚠️ Ошибка создания таблицы users: %v", err)
	} else {
		log.Println("✅ Схема базы данных users проверена и готова к работе.")
	}
}

// Хранилище аккаунтов (In-memory + fallback)
type UserStore struct {
	mu       sync.RWMutex
	accounts map[string]AccountStoreEntry // key: userID
}

var store = &UserStore{
	accounts: make(map[string]AccountStoreEntry),
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
	// Инициализация подключения к PostgreSQL (если предоставлена DATABASE_URL на Railway)
	initDB()

	mux := http.NewServeMux()

	// API-маршруты
	mux.HandleFunc("GET /api/health", handleHealth)
	mux.HandleFunc("GET /api/feed", handleFeed)
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
		fs := http.FileServer(http.Dir(distDir))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/api") {
				http.NotFound(w, r)
				return
			}
			filePath := distDir + r.URL.Path
			if fi, err := os.Stat(filePath); err == nil && !fi.IsDir() {
				fs.ServeHTTP(w, r)
				return
			}
			http.ServeFile(w, r, distDir+"/index.html")
		})
		log.Printf("📁 Раздача статических файлов фронтенда из: %s", distDir)
	}

	// CORS middleware
	handler := corsMiddleware(mux)

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

func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: HealthCheck{
			Uptime:    time.Since(startTime).String(),
			Timestamp: time.Now().Format(time.RFC3339),
		},
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
	posts := []Post{
		{ID: "p0", User: currentUser, Image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80", Caption: "Релиз обновленного интерфейса! 💻", Likes: 312, TimeAgo: "15 минут назад"},
		{ID: "p1", User: mockUsers[1], Image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80", Caption: "Утренний кофе и вдохновение ☕✨", Likes: 842, TimeAgo: "2 часа назад"},
		{ID: "p2", User: mockUsers[4], Image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80", Caption: "Закат в горах Кавказа 🏔️", Likes: 1450, TimeAgo: "5 часов назад"},
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: posts})
}

func handleVideos(w http.ResponseWriter, r *http.Request) {
	videos := []Video{
		{ID: "v1", Title: "Как создать полнофункциональную соцсеть на React + Go", Channel: mockUsers[2], Thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80", Views: "128K просмотров", Duration: "45:20", TimeAgo: "3 дня назад", Description: "Архитектура современного приложения"},
		{ID: "v2", Title: "React 19 & TypeScript: современные паттерны и фичи", Channel: mockUsers[1], Thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80", Views: "94K просмотров", Duration: "18:42", TimeAgo: "1 неделю назад", Description: "Обзор новых возможностей"},
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: videos})
}

func handleChats(w http.ResponseWriter, r *http.Request) {
	chats := []ChatPreview{
		{ID: "ch1", User: mockUsers[1], LastMessage: "Привет! Как продвигается разработка профилей и конференций?", Time: "12:45", Unread: 2},
		{ID: "ch2", User: mockUsers[2], LastMessage: "Подключись в конференцию в 16:00, обсудим релиз", Time: "11:20", Unread: 1},
		{ID: "ch3", User: mockUsers[3], LastMessage: "Макеты светлого интерфейса отличные! 👍", Time: "Вчера", Unread: 0},
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: chats})
}

func handlePodcasts(w http.ResponseWriter, r *http.Request) {
	podcasts := []Podcast{
		{
			ID: "pod1", Title: "Код и Кофе", Author: "Артём Волков",
			Cover: "https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=400&q=80",
			Description: "Еженедельный подкаст об архитектуре ПО и Go",
			Episodes: []Episode{
				{ID: "ep1", Title: "Выпуск #1: Архитектура соцсети на Go и React", Duration: "42:15", Date: "12 мая"},
				{ID: "ep2", Title: "Выпуск #2: Микросервисы или монолит в 2026?", Duration: "38:40", Date: "5 мая"},
			},
		},
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: podcasts})
}

func handleMarketplace(w http.ResponseWriter, r *http.Request) {
	products := []map[string]interface{}{
		{
			"id":       "prod1",
			"title":    "Мини-курс: Практика Дыхания и Пранаяма",
			"price":    1990,
			"currency": "RUB",
			"rating":   4.9,
			"author":   "Мастер Самадхи",
			"image":    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80",
			"category": "Медитации",
		},
		{
			"id":       "prod2",
			"title":    "Индивидуальный разбор Натальной карты",
			"price":    4500,
			"currency": "RUB",
			"rating":   5.0,
			"author":   "Астролог Аэлита",
			"image":    "https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?auto=format&fit=crop&w=600&q=80",
			"category": "Астрология",
		},
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: products})
}

func handleCommunities(w http.ResponseWriter, r *http.Request) {
	communities := []map[string]interface{}{
		{
			"id":           "com1",
			"name":         "Осознанность и Дзен",
			"avatar":       "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=300&q=80",
			"membersCount": 12450,
			"isPrivate":    false,
		},
		{
			"id":           "com2",
			"name":         "Клуб Астрологии и Human Design",
			"avatar":       "https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?auto=format&fit=crop&w=300&q=80",
			"membersCount": 8400,
			"isPrivate":    false,
		},
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: communities})
}

func handleWallet(w http.ResponseWriter, r *http.Request) {
	walletData := map[string]interface{}{
		"balance":  14850,
		"currency": "RUB",
		"status":   "active",
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: walletData})
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

	newUser := User{
		ID:             newID,
		Name:           strings.TrimSpace(req.Name),
		Username:       cleanUsername,
		Avatar:         avatar,
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
		INSERT INTO users (id, name, username, email_or_phone, password_hash, salt, avatar, role, belief_type, belief_privacy, followers_count, following_count, critics_count, posts_count, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		`
		_, err := db.Exec(insertQuery, newID, newUser.Name, cleanUsername, cleanEmailOrPhone, hash, salt, avatar, role, req.BeliefType, req.BeliefPrivacy, 1, 0, 0, 0, time.Now())
		if err != nil {
			log.Printf("⚠️ Ошибка сохранения пользователя в Postgres: %v", err)
		} else {
			log.Printf("💾 Пользователь %s (@%s) успешно сохранён в PostgreSQL!", newUser.Name, cleanUsername)
		}
	}

	store.accounts[newID] = AccountStoreEntry{
		User:         newUser,
		EmailOrPhone: cleanEmailOrPhone,
		PasswordHash: hash,
		Salt:         salt,
		CreatedAt:    time.Now(),
	}

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

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Ошибка записи JSON: %v", err)
	}
}
