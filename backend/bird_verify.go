package main

// Email-верификация через Bird Verify API (https://eu1.platform.bird.com).
// Используется при регистрации (подтверждение почты) и при восстановлении доступа к аккаунту.

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"
)

const birdVerifyBaseURL = "https://eu1.platform.bird.com/v1/verify/verifications"

var (
	birdHTTPClient = &http.Client{Timeout: 15 * time.Second}
	emailRegexp    = regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$`)

	// verifiedEmails — email, успешно подтверждённые для регистрации (email -> срок действия).
	verifiedEmails sync.Map
	// emailCodeSentAt — защита от частой повторной отправки кода (email -> время отправки).
	emailCodeSentAt sync.Map
)

func birdAPIKey() string {
	if k := strings.TrimSpace(os.Getenv("BIRD_API_KEY")); k != "" {
		return k
	}
	// TODO: убрать после настройки переменной окружения BIRD_API_KEY на сервере.
	return "bk_eu1_TFUiTGE4lM3evEsNXRlyCUj3bkQmQ"
}

func normalizeEmail(s string) string { return strings.ToLower(strings.TrimSpace(s)) }

func isValidEmail(s string) bool { return len(s) <= 254 && emailRegexp.MatchString(s) }

func birdPost(url string, payload interface{}) (int, []byte, error) {
	body, _ := json.Marshal(payload)
	req, err := http.NewRequest(http.MethodPost, url, strings.NewReader(string(body)))
	if err != nil {
		return 0, nil, err
	}
	req.Header.Set("Authorization", "Bearer "+birdAPIKey())
	req.Header.Set("Content-Type", "application/json")
	resp, err := birdHTTPClient.Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(io.LimitReader(resp.Body, 64*1024))
	return resp.StatusCode, data, nil
}

// sendBirdEmailVerification отправляет код подтверждения на email.
func sendBirdEmailVerification(email string) error {
	status, data, err := birdPost(birdVerifyBaseURL, map[string]interface{}{
		"to": map[string]string{"email": email},
	})
	if err != nil {
		return fmt.Errorf("сервис отправки недоступен: %w", err)
	}
	if status < 200 || status >= 300 {
		log.Printf("⚠️ Bird Verify create: HTTP %d: %s", status, string(data))
		if status == http.StatusTooManyRequests {
			return errors.New("Слишком много запросов. Попробуйте через минуту")
		}
		return errors.New("Не удалось отправить код на почту. Проверьте адрес")
	}
	return nil
}

// checkBirdEmailVerification проверяет код, введённый пользователем.
func checkBirdEmailVerification(email, code string) (bool, error) {
	status, data, err := birdPost(birdVerifyBaseURL+"/check", map[string]interface{}{
		"to":   map[string]string{"email": email},
		"code": code,
	})
	if err != nil {
		return false, fmt.Errorf("сервис проверки недоступен: %w", err)
	}
	if status < 200 || status >= 300 {
		log.Printf("⚠️ Bird Verify check: HTTP %d: %s", status, string(data))
		return false, nil
	}
	var res struct {
		Success      bool `json:"success"`
		Verification struct {
			Status string `json:"status"`
		} `json:"verification"`
	}
	if err := json.Unmarshal(data, &res); err != nil {
		return false, nil
	}
	return res.Success || res.Verification.Status == "verified", nil
}

// emailExists проверяет, зарегистрирован ли аккаунт с этим email (PostgreSQL + память).
func emailExists(email string) bool {
	if db != nil {
		var count int
		if err := db.QueryRow("SELECT COUNT(*) FROM users WHERE LOWER(email_or_phone) = $1", email).Scan(&count); err == nil && count > 0 {
			return true
		}
	}
	store.mu.RLock()
	defer store.mu.RUnlock()
	for _, entry := range store.accounts {
		if strings.ToLower(entry.EmailOrPhone) == email {
			return true
		}
	}
	return false
}

// isEmailVerifiedForRegistration — был ли email подтверждён кодом в последние 30 минут.
func isEmailVerifiedForRegistration(email string) bool {
	v, ok := verifiedEmails.Load(email)
	if !ok {
		return false
	}
	if time.Now().After(v.(time.Time)) {
		verifiedEmails.Delete(email)
		return false
	}
	return true
}

func throttleEmailSend(w http.ResponseWriter, email string) bool {
	if v, ok := emailCodeSentAt.Load(email); ok {
		if wait := 60*time.Second - time.Since(v.(time.Time)); wait > 0 {
			writeJSON(w, http.StatusTooManyRequests, Response{
				Status:  "error",
				Message: fmt.Sprintf("Код уже отправлен. Повторить можно через %d сек.", int(wait.Seconds())+1),
			})
			return true
		}
	}
	return false
}

// POST /api/auth/email/send-code — отправка кода подтверждения почты при регистрации.
func handleEmailSendCode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Некорректные данные запроса"})
		return
	}
	email := normalizeEmail(req.Email)
	if !isValidEmail(email) {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Введите корректный адрес электронной почты"})
		return
	}
	if emailExists(email) {
		writeJSON(w, http.StatusConflict, Response{Status: "error", Message: "Аккаунт с этой почтой уже существует. Войдите или восстановите доступ"})
		return
	}
	if throttleEmailSend(w, email) {
		return
	}
	if err := sendBirdEmailVerification(email); err != nil {
		writeJSON(w, http.StatusBadGateway, Response{Status: "error", Message: err.Error()})
		return
	}
	emailCodeSentAt.Store(email, time.Now())
	writeJSON(w, http.StatusOK, Response{Status: "ok", Message: "Код отправлен на почту", Data: map[string]interface{}{"expires_in": 600}})
}

// POST /api/auth/email/verify-code — проверка кода из письма при регистрации.
func handleEmailVerifyCode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
		Code  string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Некорректные данные запроса"})
		return
	}
	email := normalizeEmail(req.Email)
	code := strings.TrimSpace(req.Code)
	if !isValidEmail(email) || code == "" {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Введите почту и код"})
		return
	}
	ok, err := checkBirdEmailVerification(email, code)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, Response{Status: "error", Message: err.Error()})
		return
	}
	if !ok {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Неверный или просроченный код"})
		return
	}
	verifiedEmails.Store(email, time.Now().Add(30*time.Minute))
	writeJSON(w, http.StatusOK, Response{Status: "ok", Message: "Почта подтверждена", Data: map[string]interface{}{"verified": true}})
}

// POST /api/auth/recovery/send-code — отправка кода для восстановления доступа.
func handleRecoverySendCode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Некорректные данные запроса"})
		return
	}
	email := normalizeEmail(req.Email)
	if !isValidEmail(email) {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Введите корректный адрес электронной почты"})
		return
	}
	if !emailExists(email) {
		writeJSON(w, http.StatusNotFound, Response{Status: "error", Message: "Аккаунт с этой почтой не найден"})
		return
	}
	if throttleEmailSend(w, email) {
		return
	}
	if err := sendBirdEmailVerification(email); err != nil {
		writeJSON(w, http.StatusBadGateway, Response{Status: "error", Message: err.Error()})
		return
	}
	emailCodeSentAt.Store(email, time.Now())
	writeJSON(w, http.StatusOK, Response{Status: "ok", Message: "Код для восстановления отправлен на почту", Data: map[string]interface{}{"expires_in": 600}})
}

// POST /api/auth/recovery/reset-password — проверка кода и установка нового пароля. Возвращает JWT.
func handleRecoveryResetPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email       string `json:"email"`
		Code        string `json:"code"`
		NewPassword string `json:"newPassword"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Некорректные данные запроса"})
		return
	}
	email := normalizeEmail(req.Email)
	code := strings.TrimSpace(req.Code)
	if !isValidEmail(email) || code == "" {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Введите почту и код"})
		return
	}
	if len(req.NewPassword) < 6 {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Пароль должен содержать не менее 6 символов"})
		return
	}

	ok, err := checkBirdEmailVerification(email, code)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, Response{Status: "error", Message: err.Error()})
		return
	}
	if !ok {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Неверный или просроченный код"})
		return
	}

	salt := generateSalt(16)
	hash := hashPassword(req.NewPassword, salt)

	var user *User
	if db != nil {
		var u User
		err := db.QueryRow(`
			UPDATE users SET password_hash = $1, salt = $2
			WHERE LOWER(email_or_phone) = $3
			RETURNING id, name, username, COALESCE(avatar, ''), COALESCE(bio, ''), COALESCE(role, 'user'),
			          COALESCE(belief_type, ''), COALESCE(belief_privacy, 'public'), COALESCE(verified, false),
			          COALESCE(followers_count, 0), COALESCE(following_count, 0), COALESCE(critics_count, 0), COALESCE(posts_count, 0)
		`, hash, salt, email).Scan(
			&u.ID, &u.Name, &u.Username, &u.Avatar, &u.Bio, &u.Role,
			&u.BeliefType, &u.BeliefPrivacy, &u.Verified,
			&u.FollowersCount, &u.FollowingCount, &u.CriticsCount, &u.PostsCount,
		)
		if err == nil {
			u.Online = true
			user = &u
		} else if err != sql.ErrNoRows {
			log.Printf("⚠️ Ошибка обновления пароля в БД: %v", err)
		}
	}

	store.mu.Lock()
	for id, entry := range store.accounts {
		if strings.ToLower(entry.EmailOrPhone) == email {
			entry.PasswordHash = hash
			entry.Salt = salt
			store.accounts[id] = entry
			if user == nil {
				u := entry.User
				user = &u
			}
			break
		}
	}
	store.saveToDisk()
	store.mu.Unlock()

	if user == nil {
		writeJSON(w, http.StatusNotFound, Response{Status: "error", Message: "Аккаунт с этой почтой не найден"})
		return
	}

	token, err := generateJWT(*user, email)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, Response{Status: "error", Message: "Ошибка создания сессии"})
		return
	}
	writeJSON(w, http.StatusOK, Response{
		Status:  "ok",
		Message: "Пароль успешно изменён",
		Data:    map[string]interface{}{"token": token, "user": user},
	})
}
