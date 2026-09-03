package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
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

// User — пользователь.
type User struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Username       string `json:"username"`
	Avatar         string `json:"avatar"`
	Bio            string `json:"bio,omitempty"`
	Online         bool   `json:"online"`
	FollowersCount int    `json:"followersCount"`
	FollowingCount int    `json:"followingCount"`
	PostsCount     int    `json:"postsCount"`
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

var currentUser = User{
	ID:             "me",
	Name:           "Алексей Миронов",
	Username:       "alex_mironov",
	Avatar:         "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
	Bio:            "Fullstack разработчик на React + Go. Создатель светлой соцсети «Демо».",
	Online:         true,
	FollowersCount: 1420,
	FollowingCount: 382,
	PostsCount:     24,
}

var mockUsers = []User{
	currentUser,
	{ID: "1", Name: "Алиса Иванова", Username: "alice_iv", Avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80", Bio: "Product Designer & Фотограф", Online: true, FollowersCount: 8420, FollowingCount: 430, PostsCount: 156},
	{ID: "2", Name: "Максим Петров", Username: "max_p", Avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", Bio: "Frontend Architect & Автор подкастов", Online: true, FollowersCount: 15300, FollowingCount: 290, PostsCount: 84},
	{ID: "3", Name: "Екатерина Смирнова", Username: "kate_s", Avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", Bio: "UX Исследования & Дизайн мышление", Online: false, FollowersCount: 6890, FollowingCount: 512, PostsCount: 62},
	{ID: "4", Name: "Дмитрий Козлов", Username: "dima_k", Avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80", Bio: "Tech Entrepreneur & Инновации", Online: true, FollowersCount: 22400, FollowingCount: 190, PostsCount: 110},
}

func main() {
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
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: mockUsers})
}

func handleSearch(w http.ResponseWriter, r *http.Request) {
	q := strings.ToLower(r.URL.Query().Get("q"))
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
				{ID: "e1", Title: "React 19 vs современные фреймворки в 2026", Duration: "48:20", Date: "1 сен 2026"},
				{ID: "e2", Title: "Путь Senior разработчика", Duration: "39:15", Date: "25 авг 2026"},
			},
		},
	}
	writeJSON(w, http.StatusOK, Response{Status: "ok", Data: podcasts})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Ошибка записи JSON: %v", err)
	}
}
