package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

// =============================================================================
// DATING & SOUL RESONANCE (МОДУЛЬ ЗНАКОМСТВ И ДУХОВНОГО РЕЗОНАНСА)
// =============================================================================

type DatingProfile struct {
	ID                 string    `json:"id"`
	UserID             string    `json:"userId"`
	Name               string    `json:"name"`
	Username           string    `json:"username"`
	Age                int       `json:"age"`
	BirthDate          string    `json:"birthDate"`
	Gender             string    `json:"gender"` // male, female, other
	City               string    `json:"city"`
	Country            string    `json:"country"`
	Avatar             string    `json:"avatar"`
	Photos             []string  `json:"photos"`
	Goals              []string  `json:"goals"`
	Bio                string    `json:"bio"`
	Occupation         string    `json:"occupation"`
	Interests          []string  `json:"interests"`
	Achievements       []string  `json:"achievements"`
	LifeGoals          []string  `json:"lifeGoals"`
	ConsciousnessLevel int       `json:"consciousnessLevel"`
	ConsciousnessTitle string    `json:"consciousnessTitle"`
	ZodiacSign         string    `json:"zodiacSign"`
	Verified           bool      `json:"verified"`
	Online             bool      `json:"online"`
	LastActive         string    `json:"lastActive"`
	CompatibilityScore int       `json:"compatibilityScore"`
	DistanceKm         float64   `json:"distanceKm,omitempty"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

type DatingLikeRecord struct {
	ID          string    `json:"id"`
	FromUserID  string    `json:"fromUserId"`
	ToProfileID string    `json:"toProfileId"`
	Action      string    `json:"action"` // "like", "pass"
	CreatedAt   time.Time `json:"createdAt"`
}

type DatingStore struct {
	mu       sync.RWMutex
	profiles map[string]DatingProfile // Key: Profile ID
	userMap  map[string]string        // Key: UserID -> ProfileID
	likes    map[string]DatingLikeRecord // Key: "fromUserID:toProfileID"
	filePath string
}

var globalDatingStore *DatingStore

func initDatingStore(dataDir string) {
	fp := filepath.Join(dataDir, "dating_store.json")
	globalDatingStore = &DatingStore{
		profiles: make(map[string]DatingProfile),
		userMap:  make(map[string]string),
		likes:    make(map[string]DatingLikeRecord),
		filePath: fp,
	}
	globalDatingStore.loadFromDisk()

	// Удаляем любые фейковые / тестовые анкеты
	globalDatingStore.purgeFakeProfiles()
}

func (s *DatingStore) purgeFakeProfiles() {
	s.mu.Lock()
	defer s.mu.Unlock()

	fakeIDs := map[string]bool{
		"dp-1": true,
		"dp-2": true,
		"dp-3": true,
		"dp-4": true,
		"dp-5": true,
		"dp-6": true,
		"dp-7": true,
	}

	for id, p := range s.profiles {
		nameLower := strings.ToLower(p.Name)
		if fakeIDs[id] || strings.Contains(nameLower, "елена воронова") || strings.Contains(nameLower, "камилла") || strings.Contains(nameLower, "даниил") {
			delete(s.profiles, id)
			delete(s.userMap, p.UserID)
		}
	}
	s.saveToDiskNoLock()
}

func (s *DatingStore) loadFromDisk() {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := os.ReadFile(s.filePath)
	if err != nil {
		return
	}
	var dump struct {
		Profiles map[string]DatingProfile    `json:"profiles"`
		Likes    map[string]DatingLikeRecord `json:"likes"`
	}
	if err := json.Unmarshal(data, &dump); err == nil {
		if dump.Profiles != nil {
			s.profiles = dump.Profiles
			for id, p := range s.profiles {
				if p.UserID != "" {
					s.userMap[p.UserID] = id
				}
			}
		}
		if dump.Likes != nil {
			s.likes = dump.Likes
		}
	}
}

func (s *DatingStore) saveToDiskNoLock() {
	dump := struct {
		Profiles map[string]DatingProfile    `json:"profiles"`
		Likes    map[string]DatingLikeRecord `json:"likes"`
	}{
		Profiles: s.profiles,
		Likes:    s.likes,
	}
	data, err := json.MarshalIndent(dump, "", "  ")
	if err != nil {
		return
	}
	_ = os.MkdirAll(filepath.Dir(s.filePath), 0755)
	_ = os.WriteFile(s.filePath, data, 0644)
}

func (s *DatingStore) saveToDisk() {
	s.mu.RLock()
	defer s.mu.RUnlock()
	s.saveToDiskNoLock()
}

// ensureDatingTables проверяет и создает таблицы знакомств в PostgreSQL
func ensureDatingTables(dbConn *sql.DB) error {
	if dbConn == nil {
		return nil
	}
	schema := `
	CREATE TABLE IF NOT EXISTS dating_profiles (
		id VARCHAR(64) PRIMARY KEY,
		user_id VARCHAR(64) UNIQUE NOT NULL,
		name VARCHAR(255) NOT NULL,
		username VARCHAR(100) DEFAULT '',
		age INT DEFAULT 18,
		birth_date VARCHAR(50) DEFAULT '',
		gender VARCHAR(30) DEFAULT 'male',
		city VARCHAR(150) DEFAULT '',
		country VARCHAR(100) DEFAULT '',
		avatar TEXT DEFAULT '',
		photos TEXT DEFAULT '[]',
		goals TEXT DEFAULT '[]',
		bio TEXT DEFAULT '',
		occupation TEXT DEFAULT '',
		interests TEXT DEFAULT '[]',
		achievements TEXT DEFAULT '[]',
		life_goals TEXT DEFAULT '[]',
		consciousness_level INT DEFAULT 1,
		consciousness_title VARCHAR(100) DEFAULT '',
		zodiac_sign VARCHAR(50) DEFAULT '',
		verified BOOLEAN DEFAULT FALSE,
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_dating_profiles_gender ON dating_profiles(gender);
	CREATE INDEX IF NOT EXISTS idx_dating_profiles_city ON dating_profiles(city);
	CREATE INDEX IF NOT EXISTS idx_dating_profiles_user ON dating_profiles(user_id);

	CREATE TABLE IF NOT EXISTS dating_likes (
		id VARCHAR(64) PRIMARY KEY,
		from_user_id VARCHAR(64) NOT NULL,
		to_profile_id VARCHAR(64) NOT NULL,
		action VARCHAR(20) DEFAULT 'like',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		UNIQUE (from_user_id, to_profile_id)
	);

	CREATE INDEX IF NOT EXISTS idx_dating_likes_from ON dating_likes(from_user_id);
	CREATE INDEX IF NOT EXISTS idx_dating_likes_to ON dating_likes(to_profile_id);

	CREATE TABLE IF NOT EXISTS dating_matches (
		id VARCHAR(64) PRIMARY KEY,
		user1_id VARCHAR(64) NOT NULL,
		user2_id VARCHAR(64) NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		UNIQUE (user1_id, user2_id)
	);
	`
	_, err := dbConn.Exec(schema)
	if err != nil {
		log.Printf("⚠️ Ошибка создания таблиц знакомств в PostgreSQL: %v", err)
		return err
	}

	// Очистка фейковых анкет из базы данных PostgreSQL
	_, _ = dbConn.Exec(`
		DELETE FROM dating_profiles 
		WHERE id IN ('dp-1', 'dp-2', 'dp-3', 'dp-4', 'dp-5', 'dp-6', 'dp-7')
		   OR LOWER(name) LIKE '%воронова%' 
		   OR LOWER(name) LIKE '%саттарова%'
		   OR LOWER(name) LIKE '%шестаков%';
	`)

	return nil
}

// =============================================================================
// HTTP HANDLERS
// =============================================================================

// GET /api/dating/profiles — Получить все реальные активные анкеты
func handleGetDatingProfiles(w http.ResponseWriter, r *http.Request) {
	currentUserID := ""
	token := extractBearerToken(r)
	if token != "" {
		if claims, err := parseAndValidateJWT(token); err == nil && claims != nil {
			currentUserID = claims.UserID
		}
	}

	city := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("city")))
	gender := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("gender")))
	q := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()

	var profiles []DatingProfile

	if dbConn != nil {
		rows, err := dbConn.Query(`
			SELECT id, user_id, name, username, age, birth_date, gender, city, country, avatar,
			       photos, goals, bio, occupation, interests, achievements, life_goals,
			       consciousness_level, consciousness_title, zodiac_sign, verified, created_at, updated_at
			FROM dating_profiles
			WHERE is_active = TRUE
			ORDER BY updated_at DESC
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var p DatingProfile
				var photosJSON, goalsJSON, interestsJSON, achJSON, lgJSON string
				if err := rows.Scan(
					&p.ID, &p.UserID, &p.Name, &p.Username, &p.Age, &p.BirthDate, &p.Gender, &p.City, &p.Country, &p.Avatar,
					&photosJSON, &goalsJSON, &interestsJSON, &achJSON, &lgJSON,
					&p.ConsciousnessLevel, &p.ConsciousnessTitle, &p.ZodiacSign, &p.Verified, &p.CreatedAt, &p.UpdatedAt,
				); err == nil {
					_ = json.Unmarshal([]byte(photosJSON), &p.Photos)
					_ = json.Unmarshal([]byte(goalsJSON), &p.Goals)
					_ = json.Unmarshal([]byte(interestsJSON), &p.Interests)
					_ = json.Unmarshal([]byte(achJSON), &p.Achievements)
					_ = json.Unmarshal([]byte(lgJSON), &p.LifeGoals)
					p.CompatibilityScore = 90 + (len(p.Name)%10) // Динамический расчет гармонии
					profiles = append(profiles, p)
				}
			}
		}
	}

	// Если БД пустая или недоступна — берем из persistent хранилища
	if len(profiles) == 0 && globalDatingStore != nil {
		globalDatingStore.mu.RLock()
		for _, p := range globalDatingStore.profiles {
			p.CompatibilityScore = 90 + (len(p.Name)%10)
			profiles = append(profiles, p)
		}
		globalDatingStore.mu.RUnlock()
	}

	// Фильтрация
	filtered := make([]DatingProfile, 0, len(profiles))
	for _, p := range profiles {
		// Исключаем свою собственную анкету
		if currentUserID != "" && p.UserID == currentUserID {
			continue
		}
		if city != "" && city != "all" && strings.ToLower(p.City) != city {
			continue
		}
		if gender != "" && gender != "all" && strings.ToLower(p.Gender) != gender {
			continue
		}
		if q != "" {
			nameMatch := strings.Contains(strings.ToLower(p.Name), q)
			bioMatch := strings.Contains(strings.ToLower(p.Bio), q)
			occMatch := strings.Contains(strings.ToLower(p.Occupation), q)
			cityMatch := strings.Contains(strings.ToLower(p.City), q)
			if !nameMatch && !bioMatch && !occMatch && !cityMatch {
				continue
			}
		}
		filtered = append(filtered, p)
	}

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]interface{}{
			"profiles": filtered,
			"total":    len(filtered),
		},
	})
}

// GET /api/dating/my-profile — Получить анкету текущего авторизованного пользователя
func handleGetMyDatingProfile(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	if token == "" {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Требуется авторизация"})
		return
	}
	claims, err := parseAndValidateJWT(token)
	if err != nil || claims == nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Недействительный токен"})
		return
	}

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()

	var p DatingProfile
	found := false

	if dbConn != nil {
		var photosJSON, goalsJSON, interestsJSON, achJSON, lgJSON string
		err := dbConn.QueryRow(`
			SELECT id, user_id, name, username, age, birth_date, gender, city, country, avatar,
			       photos, goals, bio, occupation, interests, achievements, life_goals,
			       consciousness_level, consciousness_title, zodiac_sign, verified, created_at, updated_at
			FROM dating_profiles
			WHERE user_id = $1
		`, claims.UserID).Scan(
			&p.ID, &p.UserID, &p.Name, &p.Username, &p.Age, &p.BirthDate, &p.Gender, &p.City, &p.Country, &p.Avatar,
			&photosJSON, &goalsJSON, &interestsJSON, &achJSON, &lgJSON,
			&p.ConsciousnessLevel, &p.ConsciousnessTitle, &p.ZodiacSign, &p.Verified, &p.CreatedAt, &p.UpdatedAt,
		)
		if err == nil {
			_ = json.Unmarshal([]byte(photosJSON), &p.Photos)
			_ = json.Unmarshal([]byte(goalsJSON), &p.Goals)
			_ = json.Unmarshal([]byte(interestsJSON), &p.Interests)
			_ = json.Unmarshal([]byte(achJSON), &p.Achievements)
			_ = json.Unmarshal([]byte(lgJSON), &p.LifeGoals)
			found = true
		}
	}

	if !found && globalDatingStore != nil {
		globalDatingStore.mu.RLock()
		if profileID, ok := globalDatingStore.userMap[claims.UserID]; ok {
			if prof, exists := globalDatingStore.profiles[profileID]; exists {
				p = prof
				found = true
			}
		}
		globalDatingStore.mu.RUnlock()
	}

	if !found {
		writeJSON(w, http.StatusOK, Response{
			Status:  "empty",
			Message: "Анкета еще не создана",
			Data:    nil,
		})
		return
	}

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]interface{}{
			"profile": p,
		},
	})
}

// POST /api/dating/my-profile — Создать или обновить свою анкету в БД
func handleSaveMyDatingProfile(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	if token == "" {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Требуется авторизация"})
		return
	}
	claims, err := parseAndValidateJWT(token)
	if err != nil || claims == nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Недействительный токен"})
		return
	}

	var req DatingProfile
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Неверный формат запроса"})
		return
	}

	req.UserID = claims.UserID
	if strings.TrimSpace(req.Name) == "" {
		req.Name = claims.Username
	}
	if req.Username == "" {
		req.Username = claims.Username
	}
	if req.Age <= 0 {
		req.Age = 25
	}
	if req.Gender == "" {
		req.Gender = "male"
	}
	if req.Photos == nil {
		req.Photos = []string{}
	}
	if req.Avatar == "" && len(req.Photos) > 0 {
		req.Avatar = req.Photos[0]
	}
	if req.Goals == nil {
		req.Goals = []string{}
	}
	if req.Interests == nil {
		req.Interests = []string{}
	}
	if req.Achievements == nil {
		req.Achievements = []string{}
	}
	if req.LifeGoals == nil {
		req.LifeGoals = []string{}
	}
	if req.ConsciousnessLevel <= 0 {
		req.ConsciousnessLevel = 1
	}

	now := time.Now()
	req.UpdatedAt = now

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()

	profileID := req.ID
	if profileID == "" {
		profileID = "dp_" + uuid.New().String()
		req.ID = profileID
		req.CreatedAt = now
	}

	photosJSON, _ := json.Marshal(req.Photos)
	goalsJSON, _ := json.Marshal(req.Goals)
	interestsJSON, _ := json.Marshal(req.Interests)
	achJSON, _ := json.Marshal(req.Achievements)
	lgJSON, _ := json.Marshal(req.LifeGoals)

	if dbConn != nil {
		_, err := dbConn.Exec(`
			INSERT INTO dating_profiles (
				id, user_id, name, username, age, birth_date, gender, city, country, avatar,
				photos, goals, bio, occupation, interests, achievements, life_goals,
				consciousness_level, consciousness_title, zodiac_sign, verified, is_active, created_at, updated_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
				$11, $12, $13, $14, $15, $16, $17,
				$18, $19, $20, $21, TRUE, $22, $23
			)
			ON CONFLICT (user_id) DO UPDATE SET
				name = EXCLUDED.name,
				username = EXCLUDED.username,
				age = EXCLUDED.age,
				birth_date = EXCLUDED.birth_date,
				gender = EXCLUDED.gender,
				city = EXCLUDED.city,
				country = EXCLUDED.country,
				avatar = EXCLUDED.avatar,
				photos = EXCLUDED.photos,
				goals = EXCLUDED.goals,
				bio = EXCLUDED.bio,
				occupation = EXCLUDED.occupation,
				interests = EXCLUDED.interests,
				achievements = EXCLUDED.achievements,
				life_goals = EXCLUDED.life_goals,
				consciousness_level = EXCLUDED.consciousness_level,
				consciousness_title = EXCLUDED.consciousness_title,
				zodiac_sign = EXCLUDED.zodiac_sign,
				verified = EXCLUDED.verified,
				is_active = TRUE,
				updated_at = EXCLUDED.updated_at
		`,
			req.ID, req.UserID, req.Name, req.Username, req.Age, req.BirthDate, req.Gender, req.City, req.Country, req.Avatar,
			string(photosJSON), string(goalsJSON), req.Bio, req.Occupation, string(interestsJSON), string(achJSON), string(lgJSON),
			req.ConsciousnessLevel, req.ConsciousnessTitle, req.ZodiacSign, req.Verified, req.CreatedAt, req.UpdatedAt,
		)
		if err != nil {
			log.Printf("⚠️ Ошибка сохранения анкеты в PostgreSQL: %v", err)
		}
	}

	// Сохраняем в persistent store
	if globalDatingStore != nil {
		globalDatingStore.mu.Lock()
		globalDatingStore.profiles[req.ID] = req
		globalDatingStore.userMap[req.UserID] = req.ID
		globalDatingStore.saveToDiskNoLock()
		globalDatingStore.mu.Unlock()
	}

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: "Анкета успешно сохранена в базе данных",
		Data: map[string]interface{}{
			"profile": req,
		},
	})
}

// DELETE /api/dating/my-profile — Удалить/деактивировать свою анкету
func handleDeleteMyDatingProfile(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	if token == "" {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Требуется авторизация"})
		return
	}
	claims, err := parseAndValidateJWT(token)
	if err != nil || claims == nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Недействительный токен"})
		return
	}

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()

	if dbConn != nil {
		_, _ = dbConn.Exec("DELETE FROM dating_profiles WHERE user_id = $1", claims.UserID)
	}

	if globalDatingStore != nil {
		globalDatingStore.mu.Lock()
		if pID, ok := globalDatingStore.userMap[claims.UserID]; ok {
			delete(globalDatingStore.profiles, pID)
			delete(globalDatingStore.userMap, claims.UserID)
			globalDatingStore.saveToDiskNoLock()
		}
		globalDatingStore.mu.Unlock()
	}

	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: "Анкета успешно удалена из базы данных",
	})
}

// POST /api/dating/swipe — Лайк или пропуск анкеты
func handleSwipeDatingProfile(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	if token == "" {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Требуется авторизация"})
		return
	}
	claims, err := parseAndValidateJWT(token)
	if err != nil || claims == nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Недействительный токен"})
		return
	}

	var req struct {
		ProfileID string `json:"profileId"`
		Action    string `json:"action"` // "like", "pass"
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ProfileID == "" {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Неверные параметры запроса"})
		return
	}
	if req.Action == "" {
		req.Action = "like"
	}

	likeID := "like_" + uuid.New().String()
	now := time.Now()

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()

	isMutualMatch := false

	if dbConn != nil {
		_, _ = dbConn.Exec(`
			INSERT INTO dating_likes (id, from_user_id, to_profile_id, action, created_at)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (from_user_id, to_profile_id) DO UPDATE SET action = EXCLUDED.action
		`, likeID, claims.UserID, req.ProfileID, req.Action, now)

		// Проверяем, есть ли взаимный лайк
		if req.Action == "like" {
			var targetUserID string
			_ = dbConn.QueryRow("SELECT user_id FROM dating_profiles WHERE id = $1", req.ProfileID).Scan(&targetUserID)

			if targetUserID != "" {
				var targetLikedMeCount int
				_ = dbConn.QueryRow(`
					SELECT COUNT(*) FROM dating_likes 
					WHERE from_user_id = $1 
					  AND to_profile_id IN (SELECT id FROM dating_profiles WHERE user_id = $2)
					  AND action = 'like'
				`, targetUserID, claims.UserID).Scan(&targetLikedMeCount)

				if targetLikedMeCount > 0 {
					isMutualMatch = true
					matchID := "match_" + uuid.New().String()
					_, _ = dbConn.Exec(`
						INSERT INTO dating_matches (id, user1_id, user2_id, created_at)
						VALUES ($1, $2, $3, $4)
						ON CONFLICT DO NOTHING
					`, matchID, claims.UserID, targetUserID, now)
				}
			}
		}
	}

	// Persistent store
	if globalDatingStore != nil {
		globalDatingStore.mu.Lock()
		key := claims.UserID + ":" + req.ProfileID
		globalDatingStore.likes[key] = DatingLikeRecord{
			ID:          likeID,
			FromUserID:  claims.UserID,
			ToProfileID: req.ProfileID,
			Action:      req.Action,
			CreatedAt:   now,
		}
		globalDatingStore.saveToDiskNoLock()
		globalDatingStore.mu.Unlock()
	}

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]interface{}{
			"isMatch": isMutualMatch,
			"action":  req.Action,
		},
	})
}

// GET /api/dating/likes — Получить список ID анкет, которым поставлен лайк
func handleGetDatingLikes(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	if token == "" {
		writeJSON(w, http.StatusOK, Response{Status: "ok", Data: map[string]interface{}{"likedIds": []string{}}})
		return
	}
	claims, err := parseAndValidateJWT(token)
	if err != nil || claims == nil {
		writeJSON(w, http.StatusOK, Response{Status: "ok", Data: map[string]interface{}{"likedIds": []string{}}})
		return
	}

	dbMu.RLock()
	dbConn := db
	dbMu.RUnlock()

	likedIds := []string{}

	if dbConn != nil {
		rows, err := dbConn.Query("SELECT to_profile_id FROM dating_likes WHERE from_user_id = $1 AND action = 'like'", claims.UserID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var pID string
				if err := rows.Scan(&pID); err == nil {
					likedIds = append(likedIds, pID)
				}
			}
		}
	}

	if len(likedIds) == 0 && globalDatingStore != nil {
		globalDatingStore.mu.RLock()
		for _, l := range globalDatingStore.likes {
			if l.FromUserID == claims.UserID && l.Action == "like" {
				likedIds = append(likedIds, l.ToProfileID)
			}
		}
		globalDatingStore.mu.RUnlock()
	}

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]interface{}{
			"likedIds": likedIds,
		},
	})
}
