package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

// =============================================================================
// RETREATS & BOOKINGS (КАРТА РЕТРИТОВ И ОНЛАЙН-БРОНИРОВАНИЕ)
// =============================================================================

type Retreat struct {
	ID                string    `json:"id"`
	Title             string    `json:"title"`
	OrganizerID       string    `json:"organizerId"`
	OrganizerName     string    `json:"organizerName"`
	OrganizerAvatar   string    `json:"organizerAvatar"`
	OrganizerTitle    string    `json:"organizerTitle"`
	OrganizerVerified bool      `json:"organizerVerified"`
	Category          string    `json:"category"` // yoga, meditation, art, soundhealing, nature, vipassana, spiritual
	CategoryTitle     string    `json:"categoryTitle"`
	Badge             string    `json:"badge"` // e.g. "Премиум ретрит"
	Status            string    `json:"status"` // "upcoming", "ongoing", "completed", "cancelled"
	LocationCity      string    `json:"locationCity"`
	LocationAddress   string    `json:"locationAddress"`
	Country           string    `json:"country"`
	Latitude          float64   `json:"latitude"`
	Longitude         float64   `json:"longitude"`
	Price             float64   `json:"price"`
	Currency          string    `json:"currency"` // "KZT", "RUB", "USD", "EUR"
	DurationDays      int       `json:"durationDays"`
	StartDate         string    `json:"startDate"`
	EndDate           string    `json:"endDate"`
	Rating            float64   `json:"rating"`
	ReviewsCount      int       `json:"reviewsCount"`
	Images            []string  `json:"images"`
	CoverImage        string    `json:"coverImage"`
	Description       string    `json:"description"`
	Program           string    `json:"program"`
	Included          string    `json:"included"`
	MaxSpots          int       `json:"maxSpots"`
	BookedSpots       int       `json:"bookedSpots"`
	DistanceKm        float64   `json:"distanceKm,omitempty"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

type RetreatBooking struct {
	ID         string    `json:"id"`
	RetreatID  string    `json:"retreatId"`
	UserID     string    `json:"userId"`
	Retreat    *Retreat  `json:"retreat,omitempty"`
	FullName   string    `json:"fullName"`
	Phone      string    `json:"phone"`
	Email      string    `json:"email"`
	SeatsCount int       `json:"seatsCount"`
	Comment    string    `json:"comment"`
	TotalPrice float64   `json:"totalPrice"`
	Currency   string    `json:"currency"`
	Status     string    `json:"status"` // "pending", "approved", "rejected", "cancelled"
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

type RetreatStore struct {
	mu       sync.RWMutex
	retreats map[string]Retreat
	bookings map[string]RetreatBooking // Реальные заявки пользователей (без тестового мусора)
	filePath string
}

var globalRetreatStore *RetreatStore

func initRetreatStore(dataDir string) {
	fp := filepath.Join(dataDir, "retreats_store.json")
	globalRetreatStore = &RetreatStore{
		retreats: make(map[string]Retreat),
		bookings: make(map[string]RetreatBooking),
		filePath: fp,
	}
	globalRetreatStore.loadFromDisk()

	// Полная очистка фейковых мероприятий: оставляем только реальные мероприятия пользователей
	globalRetreatStore.purgeFakeRetreats()

	// Удаляем любые тестовые заявки, если они когда-либо были записаны
	globalRetreatStore.cleanTestBookings()
}

func (s *RetreatStore) cleanTestBookings() {
	s.mu.Lock()
	defer s.mu.Unlock()
	cleaned := make(map[string]RetreatBooking)
	for id, b := range s.bookings {
		// Оставляем только валидные заявки от настоящих пользователей с заполненными контактами
		if strings.TrimSpace(b.FullName) != "" && strings.TrimSpace(b.Phone) != "" && !strings.Contains(strings.ToLower(b.FullName), "тест") {
			cleaned[id] = b
		}
	}
	s.bookings = cleaned
	s.saveToDiskNoLock()
}

func (s *RetreatStore) loadFromDisk() {
	s.mu.Lock()
	defer s.mu.Unlock()
	data, err := os.ReadFile(s.filePath)
	if err != nil {
		return
	}
	var dump struct {
		Retreats map[string]Retreat        `json:"retreats"`
		Bookings map[string]RetreatBooking `json:"bookings"`
	}
	if err := json.Unmarshal(data, &dump); err == nil {
		if dump.Retreats != nil {
			s.retreats = dump.Retreats
		}
		if dump.Bookings != nil {
			s.bookings = dump.Bookings
		}
	}
}

func (s *RetreatStore) saveToDiskNoLock() {
	dump := struct {
		Retreats map[string]Retreat        `json:"retreats"`
		Bookings map[string]RetreatBooking `json:"bookings"`
	}{
		Retreats: s.retreats,
		Bookings: s.bookings,
	}
	data, err := json.MarshalIndent(dump, "", "  ")
	if err != nil {
		return
	}
	_ = os.MkdirAll(filepath.Dir(s.filePath), 0755)
	_ = os.WriteFile(s.filePath, data, 0644)
}

func (s *RetreatStore) saveToDisk() {
	s.mu.RLock()
	defer s.mu.RUnlock()
	s.saveToDiskNoLock()
}

func (s *RetreatStore) purgeFakeRetreats() {
	s.mu.Lock()
	defer s.mu.Unlock()
	fakeIDs := map[string]bool{
		"ret_karaganda_yoga":    true,
		"ret_karaganda_mindful": true,
		"ret_almaty_kolsai":     true,
		"ret_sochi_krasnaya":    true,
		"ret_bali_ubud":         true,
		"ret_altai_shambhala":   true,
		"ret_turkey_oludeniz":   true,
	}
	fakeOrganizers := map[string]bool{
		"u_aliya_yoga":    true,
		"u_karaganda_eco": true,
		"u_almaty_zen":    true,
		"u_sochi_healer":  true,
		"u_bali_guru":     true,
		"u_altai_shaman":  true,
		"u_turkey_travel": true,
	}
	for id, item := range s.retreats {
		if fakeIDs[id] || fakeOrganizers[item.OrganizerID] {
			delete(s.retreats, id)
		}
	}
	s.saveToDiskNoLock()
}

func (s *RetreatStore) seedDefaults() {
	// Дефолтные фейковые мероприятия удалены. Хранилище содержит только реальные мероприятия пользователей.
}

// ensureRetreatsTables проверяет и создаёт таблицы в PostgreSQL
func ensureRetreatsTables(dbConn *sql.DB) error {
	if dbConn == nil {
		return nil
	}
	schema := `
	CREATE TABLE IF NOT EXISTS retreats (
		id VARCHAR(64) PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		organizer_id VARCHAR(64) NOT NULL,
		organizer_name VARCHAR(255) DEFAULT '',
		organizer_avatar TEXT DEFAULT '',
		organizer_title VARCHAR(255) DEFAULT '',
		organizer_verified BOOLEAN DEFAULT FALSE,
		category VARCHAR(100) DEFAULT 'yoga',
		category_title VARCHAR(100) DEFAULT 'Йога & Пранаяма',
		badge VARCHAR(100) DEFAULT '',
		status VARCHAR(30) DEFAULT 'upcoming',
		location_city VARCHAR(150) DEFAULT '',
		location_address TEXT DEFAULT '',
		country VARCHAR(100) DEFAULT '',
		latitude DOUBLE PRECISION NOT NULL DEFAULT 0.0,
		longitude DOUBLE PRECISION NOT NULL DEFAULT 0.0,
		price NUMERIC(12, 2) DEFAULT 0,
		currency VARCHAR(10) DEFAULT 'KZT',
		duration_days INT DEFAULT 2,
		start_date VARCHAR(50) DEFAULT '',
		end_date VARCHAR(50) DEFAULT '',
		rating NUMERIC(3, 2) DEFAULT 4.95,
		reviews_count INT DEFAULT 0,
		images JSONB DEFAULT '[]'::jsonb,
		cover_image TEXT DEFAULT '',
		description TEXT DEFAULT '',
		program TEXT DEFAULT '',
		included TEXT DEFAULT '',
		max_spots INT DEFAULT 15,
		booked_spots INT DEFAULT 0,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_retreats_category ON retreats(category);
	CREATE INDEX IF NOT EXISTS idx_retreats_status ON retreats(status);
	CREATE INDEX IF NOT EXISTS idx_retreats_city ON retreats(location_city);

	CREATE TABLE IF NOT EXISTS retreat_bookings (
		id VARCHAR(64) PRIMARY KEY,
		retreat_id VARCHAR(64) NOT NULL,
		user_id VARCHAR(64) NOT NULL,
		full_name VARCHAR(255) NOT NULL,
		phone VARCHAR(50) NOT NULL,
		email VARCHAR(255) DEFAULT '',
		seats_count INT DEFAULT 1,
		comment TEXT DEFAULT '',
		total_price NUMERIC(12, 2) DEFAULT 0,
		currency VARCHAR(10) DEFAULT 'KZT',
		status VARCHAR(30) DEFAULT 'pending',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_retreat_bookings_retreat ON retreat_bookings(retreat_id);
	CREATE INDEX IF NOT EXISTS idx_retreat_bookings_user ON retreat_bookings(user_id);
	`
	_, err := dbConn.Exec(schema)
	if err != nil {
		log.Printf("⚠️ Ошибка создания таблиц ретритов в PostgreSQL: %v", err)
		return err
	}

	// Удаление любых фейковых ретритов из базы данных PostgreSQL
	_, _ = dbConn.Exec(`
		DELETE FROM retreats 
		WHERE id IN ('ret_karaganda_yoga', 'ret_karaganda_mindful', 'ret_almaty_kolsai', 'ret_sochi_krasnaya', 'ret_bali_ubud', 'ret_altai_shambhala', 'ret_turkey_oludeniz')
		   OR organizer_id IN ('u_aliya_yoga', 'u_karaganda_eco', 'u_almaty_zen', 'u_sochi_healer', 'u_bali_guru', 'u_altai_shaman', 'u_turkey_travel')
	`)

	return nil
}

// calculateDistanceKm вычисляет расстояние между двумя гео-координатами в км (Haversine formula)
func calculateDistanceKm(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371.0 // Радиус Земли в км
	dLat := (lat2 - lat1) * (math.Pi / 180.0)
	dLon := (lon2 - lon1) * (math.Pi / 180.0)
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*(math.Pi/180.0))*math.Cos(lat2*(math.Pi/180.0))*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

// =============================================================================
// HTTP HANDLERS ДЛЯ РЕТРИТОВ И БРОНИРОВАНИЙ
// =============================================================================

// GET /api/retreats — Список ретритов с поддержкой фильтров, радиуса, поиска и сортировки
func handleGetRetreats(w http.ResponseWriter, r *http.Request) {
	q := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))
	cat := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("category")))
	status := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("status")))
	sortBy := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("sort"))) // nearby, date, rating, price_asc, price_desc
	radiusStr := r.URL.Query().Get("radius")
	latStr := r.URL.Query().Get("lat")
	lngStr := r.URL.Query().Get("lng")

	var userLat, userLng float64
	hasUserGeo := false
	if latStr != "" && lngStr != "" {
		if lat, err := strconv.ParseFloat(latStr, 64); err == nil {
			if lng, err2 := strconv.ParseFloat(lngStr, 64); err2 == nil {
				userLat = lat
				userLng = lng
				hasUserGeo = true
			}
		}
	}

	var maxRadius float64 = 0
	if radiusStr != "" && radiusStr != "all" && radiusStr != "world" {
		if rKm, err := strconv.ParseFloat(radiusStr, 64); err == nil && rKm > 0 {
			maxRadius = rKm
		}
	}

	globalRetreatStore.mu.RLock()
	results := make([]Retreat, 0, len(globalRetreatStore.retreats))

	for _, ret := range globalRetreatStore.retreats {
		// Фильтр по категории
		if cat != "" && cat != "all" && cat != "все" {
			if strings.ToLower(ret.Category) != cat && !strings.Contains(strings.ToLower(ret.CategoryTitle), cat) {
				continue
			}
		}

		// Фильтр по статусу
		if status != "" && status != "all" {
			if strings.ToLower(ret.Status) != status {
				continue
			}
		}

		// Фильтр по текстовому запросу
		if q != "" {
			match := strings.Contains(strings.ToLower(ret.Title), q) ||
				strings.Contains(strings.ToLower(ret.LocationCity), q) ||
				strings.Contains(strings.ToLower(ret.LocationAddress), q) ||
				strings.Contains(strings.ToLower(ret.Country), q) ||
				strings.Contains(strings.ToLower(ret.Description), q) ||
				strings.Contains(strings.ToLower(ret.CategoryTitle), q)
			if !match {
				continue
			}
		}

		// Расчёт дистанции, если есть координаты пользователя
		if hasUserGeo {
			ret.DistanceKm = calculateDistanceKm(userLat, userLng, ret.Latitude, ret.Longitude)
			if maxRadius > 0 && ret.DistanceKm > maxRadius {
				continue
			}
		}

		results = append(results, ret)
	}
	globalRetreatStore.mu.RUnlock()

	// Сортировка результатов
	switch sortBy {
	case "nearby", "рядом":
		if hasUserGeo {
			sort.Slice(results, func(i, j int) bool {
				return results[i].DistanceKm < results[j].DistanceKm
			})
		}
	case "date", "по дате":
		sort.Slice(results, func(i, j int) bool {
			return results[i].StartDate < results[j].StartDate
		})
	case "rating", "по рейтингу":
		sort.Slice(results, func(i, j int) bool {
			return results[i].Rating > results[j].Rating
		})
	case "price_asc":
		sort.Slice(results, func(i, j int) bool {
			return results[i].Price < results[j].Price
		})
	case "price_desc":
		sort.Slice(results, func(i, j int) bool {
			return results[i].Price > results[j].Price
		})
	default:
		// По умолчанию: Караганда и ближайшие в топ
		sort.Slice(results, func(i, j int) bool {
			return results[i].CreatedAt.After(results[j].CreatedAt)
		})
	}

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]interface{}{
			"retreats": results,
			"total":    len(results),
			"online":   len(results),
		},
	})
}

// GET /api/retreats/{id} — Детальная информация об одном ретрите
func handleGetRetreatByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/retreats/")
	id = strings.Split(id, "/")[0]
	if id == "" {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "ID ретрита не указан"})
		return
	}

	globalRetreatStore.mu.RLock()
	ret, ok := globalRetreatStore.retreats[id]
	globalRetreatStore.mu.RUnlock()

	if !ok {
		writeJSON(w, http.StatusNotFound, Response{Status: "error", Message: "Ретрит не найден"})
		return
	}

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data:   ret,
	})
}

// POST /api/retreats — Создание нового ретрита организатором
func handleCreateRetreat(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	user, err := getUserFromToken(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	var req Retreat
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Неверный формат запроса"})
		return
	}

	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.LocationAddress) == "" {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Название и локация обязательны"})
		return
	}

	newID := "ret_" + uuid.New().String()[:12]
	req.ID = newID
	req.OrganizerID = user.ID
	req.OrganizerName = user.Name
	req.OrganizerAvatar = user.Avatar
	req.OrganizerTitle = user.Role
	req.OrganizerVerified = user.Verified
	if req.Rating == 0 {
		req.Rating = 5.0
	}
	if req.Currency == "" {
		req.Currency = "KZT"
	}
	if req.MaxSpots <= 0 {
		req.MaxSpots = 15
	}
	if req.Status == "" {
		req.Status = "upcoming"
	}
	if req.DurationDays <= 0 {
		req.DurationDays = 2
	}
	if req.CoverImage == "" && len(req.Images) > 0 {
		req.CoverImage = req.Images[0]
	}
	if req.CoverImage == "" {
		req.CoverImage = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80"
		req.Images = []string{req.CoverImage}
	}
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()

	// Сохранение в Postgres
	if db != nil {
		imgsJSON, _ := json.Marshal(req.Images)
		_, err := db.Exec(`
			INSERT INTO retreats (id, title, organizer_id, organizer_name, organizer_avatar, organizer_title, organizer_verified,
			category, category_title, badge, status, location_city, location_address, country, latitude, longitude, price, currency,
			duration_days, start_date, end_date, rating, reviews_count, images, cover_image, description, program, included, max_spots, booked_spots, created_at, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)
		`, req.ID, req.Title, req.OrganizerID, req.OrganizerName, req.OrganizerAvatar, req.OrganizerTitle, req.OrganizerVerified,
			req.Category, req.CategoryTitle, req.Badge, req.Status, req.LocationCity, req.LocationAddress, req.Country, req.Latitude, req.Longitude, req.Price, req.Currency,
			req.DurationDays, req.StartDate, req.EndDate, req.Rating, req.ReviewsCount, string(imgsJSON), req.CoverImage, req.Description, req.Program, req.Included, req.MaxSpots, req.BookedSpots, req.CreatedAt, req.UpdatedAt)
		if err != nil {
			log.Printf("⚠️ Ошибка записи ретрита в БД: %v", err)
		}
	}

	globalRetreatStore.mu.Lock()
	globalRetreatStore.retreats[newID] = req
	globalRetreatStore.saveToDiskNoLock()
	globalRetreatStore.mu.Unlock()

	writeJSON(w, http.StatusCreated, Response{
		Status:  "ok",
		Message: "Ретрит успешно опубликован на карте",
		Data:    req,
	})
}

// DELETE /api/retreats/{id} — Удаление ретрита (организатором или администратором)
func handleDeleteRetreat(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	user, err := getUserFromToken(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/retreats/")
	id = strings.Split(id, "/")[0]

	globalRetreatStore.mu.Lock()
	ret, exists := globalRetreatStore.retreats[id]
	if !exists {
		globalRetreatStore.mu.Unlock()
		writeJSON(w, http.StatusNotFound, Response{Status: "error", Message: "Ретрит не найден"})
		return
	}

	// Разрешено только создателю или администратору платформы
	if ret.OrganizerID != user.ID && user.Role != "admin" {
		globalRetreatStore.mu.Unlock()
		writeJSON(w, http.StatusForbidden, Response{Status: "error", Message: "У вас нет прав на удаление этого ретрита"})
		return
	}

	delete(globalRetreatStore.retreats, id)
	globalRetreatStore.saveToDiskNoLock()
	globalRetreatStore.mu.Unlock()

	if db != nil {
		_, _ = db.Exec("DELETE FROM retreats WHERE id = $1", id)
		_, _ = db.Exec("DELETE FROM retreat_bookings WHERE retreat_id = $1", id)
	}

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: "Ретрит успешно удалён",
	})
}

// POST /api/retreats/{id}/book — Создание РЕАЛЬНОЙ заявки на бронирование места
func handleBookRetreat(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/retreats/")
	id = strings.TrimSuffix(id, "/book")
	id = strings.Split(id, "/")[0]

	token := extractBearerToken(r)
	user, _ := getUserFromToken(token) // Может бронировать авторизованный или гость с контактами

	var req struct {
		FullName   string `json:"fullName"`
		Phone      string `json:"phone"`
		Email      string `json:"email"`
		SeatsCount int    `json:"seatsCount"`
		Comment    string `json:"comment"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Некорректные данные заявки"})
		return
	}

	cleanName := strings.TrimSpace(req.FullName)
	cleanPhone := strings.TrimSpace(req.Phone)
	if cleanName == "" || cleanPhone == "" {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Укажите ваше имя и контактный номер телефона"})
		return
	}

	if req.SeatsCount <= 0 {
		req.SeatsCount = 1
	}

	globalRetreatStore.mu.Lock()
	retreat, exists := globalRetreatStore.retreats[id]
	if !exists {
		globalRetreatStore.mu.Unlock()
		writeJSON(w, http.StatusNotFound, Response{Status: "error", Message: "Ретрит не найден"})
		return
	}

	// Проверка наличия свободных мест
	if retreat.MaxSpots > 0 && retreat.BookedSpots+req.SeatsCount > retreat.MaxSpots {
		globalRetreatStore.mu.Unlock()
		writeJSON(w, http.StatusConflict, Response{Status: "error", Message: "К сожалению, осталось меньше свободных мест, чем указано в заявке"})
		return
	}

	userID := "guest"
	if user != nil {
		userID = user.ID
	}

	totalPrice := retreat.Price * float64(req.SeatsCount)
	bookingID := "book_" + uuid.New().String()[:12]

	newBooking := RetreatBooking{
		ID:         bookingID,
		RetreatID:  id,
		UserID:     userID,
		FullName:   cleanName,
		Phone:      cleanPhone,
		Email:      strings.TrimSpace(req.Email),
		SeatsCount: req.SeatsCount,
		Comment:    strings.TrimSpace(req.Comment),
		TotalPrice: totalPrice,
		Currency:   retreat.Currency,
		Status:     "pending",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	// Увеличиваем счётчик забронированных мест
	retreat.BookedSpots += req.SeatsCount
	globalRetreatStore.retreats[id] = retreat
	globalRetreatStore.bookings[bookingID] = newBooking
	globalRetreatStore.saveToDiskNoLock()
	globalRetreatStore.mu.Unlock()

	// Сохранение в Postgres
	if db != nil {
		_, _ = db.Exec(`
			INSERT INTO retreat_bookings (id, retreat_id, user_id, full_name, phone, email, seats_count, comment, total_price, currency, status, created_at, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
		`, newBooking.ID, newBooking.RetreatID, newBooking.UserID, newBooking.FullName, newBooking.Phone, newBooking.Email,
			newBooking.SeatsCount, newBooking.Comment, newBooking.TotalPrice, newBooking.Currency, newBooking.Status, newBooking.CreatedAt, newBooking.UpdatedAt)

		_, _ = db.Exec("UPDATE retreats SET booked_spots = booked_spots + $1 WHERE id = $2", req.SeatsCount, id)
	}

	log.Printf("🧘 Новая бронь ретрита: '%s' на сумму %.2f %s от %s (%s)", retreat.Title, totalPrice, retreat.Currency, cleanName, cleanPhone)

	writeJSON(w, http.StatusCreated, Response{
		Status:  "ok",
		Message: "Ваше место успешно забронировано! Организатор свяжется с вами для подтверждения деталей заезда.",
		Data:    newBooking,
	})
}

// GET /api/retreats/{id}/bookings — Список реальных заявок для организатора ретрита
func handleGetRetreatBookings(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	user, err := getUserFromToken(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/retreats/")
	id = strings.TrimSuffix(id, "/bookings")
	id = strings.Split(id, "/")[0]

	globalRetreatStore.mu.RLock()
	ret, exists := globalRetreatStore.retreats[id]
	if !exists {
		globalRetreatStore.mu.RUnlock()
		writeJSON(w, http.StatusNotFound, Response{Status: "error", Message: "Ретрит не найден"})
		return
	}

	if ret.OrganizerID != user.ID && user.Role != "admin" {
		globalRetreatStore.mu.RUnlock()
		writeJSON(w, http.StatusForbidden, Response{Status: "error", Message: "Только организатор может просматривать заявки на свой ретрит"})
		return
	}

	list := make([]RetreatBooking, 0)
	for _, b := range globalRetreatStore.bookings {
		if b.RetreatID == id {
			list = append(list, b)
		}
	}
	globalRetreatStore.mu.RUnlock()

	sort.Slice(list, func(i, j int) bool {
		return list[i].CreatedAt.After(list[j].CreatedAt)
	})

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data:   list,
	})
}

// GET /api/my-bookings — Список бронирований текущего пользователя
func handleGetMyBookings(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	user, err := getUserFromToken(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	globalRetreatStore.mu.RLock()
	list := make([]RetreatBooking, 0)
	for _, b := range globalRetreatStore.bookings {
		if b.UserID == user.ID {
			copyB := b
			if ret, ok := globalRetreatStore.retreats[b.RetreatID]; ok {
				copyB.Retreat = &ret
			}
			list = append(list, copyB)
		}
	}
	globalRetreatStore.mu.RUnlock()

	sort.Slice(list, func(i, j int) bool {
		return list[i].CreatedAt.After(list[j].CreatedAt)
	})

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data:   list,
	})
}

// PUT /api/retreats/bookings/{id}/status — Изменение статуса заявки (approved/rejected/cancelled)
func handleUpdateBookingStatus(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	user, err := getUserFromToken(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Необходима авторизация"})
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/retreats/bookings/")
	id = strings.TrimSuffix(id, "/status")
	id = strings.Split(id, "/")[0]

	var req struct {
		Status string `json:"status"` // approved, rejected, cancelled
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Неверный формат запроса"})
		return
	}

	globalRetreatStore.mu.Lock()
	booking, exists := globalRetreatStore.bookings[id]
	if !exists {
		globalRetreatStore.mu.Unlock()
		writeJSON(w, http.StatusNotFound, Response{Status: "error", Message: "Заявка не найдена"})
		return
	}

	ret := globalRetreatStore.retreats[booking.RetreatID]
	if ret.OrganizerID != user.ID && user.Role != "admin" && booking.UserID != user.ID {
		globalRetreatStore.mu.Unlock()
		writeJSON(w, http.StatusForbidden, Response{Status: "error", Message: "Нет прав на изменение этой заявки"})
		return
	}

	booking.Status = req.Status
	booking.UpdatedAt = time.Now()
	globalRetreatStore.bookings[id] = booking
	globalRetreatStore.saveToDiskNoLock()
	globalRetreatStore.mu.Unlock()

	if db != nil {
		_, _ = db.Exec("UPDATE retreat_bookings SET status = $1, updated_at = NOW() WHERE id = $2", req.Status, id)
	}

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: "Статус заявки обновлён",
		Data:    booking,
	})
}
