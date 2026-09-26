package main

import (
	"crypto/sha256"
	"encoding/hex"
	"testing"
	"time"
)

// Тест склонения русских числительных
func TestPluralizeRu(t *testing.T) {
	tests := []struct {
		n        int
		expected string
	}{
		{1, "1 час"},
		{2, "2 часа"},
		{4, "4 часа"},
		{5, "5 часов"},
		{11, "11 часов"},
		{14, "14 часов"},
		{21, "21 час"},
		{22, "22 часа"},
		{25, "25 часов"},
	}

	for _, tt := range tests {
		got := pluralizeRu(tt.n, "час", "часа", "часов")
		if got != tt.expected {
			t.Errorf("pluralizeRu(%d) = %q; want %q", tt.n, got, tt.expected)
		}
	}
}

// Тест formatTimeAgo
func TestFormatTimeAgo(t *testing.T) {
	now := time.Now()

	if got := formatTimeAgo(now.Add(-10 * time.Second)); got != "только что" {
		t.Errorf("formatTimeAgo(10s ago) = %q; want 'только что'", got)
	}

	if got := formatTimeAgo(now.Add(-2 * time.Minute)); got != "2 минуты назад" {
		t.Errorf("formatTimeAgo(2m ago) = %q; want '2 минуты назад'", got)
	}

	if got := formatTimeAgo(now.Add(-5 * time.Minute)); got != "5 минут назад" {
		t.Errorf("formatTimeAgo(5m ago) = %q; want '5 минут назад'", got)
	}

	if got := formatTimeAgo(now.Add(-3 * time.Hour)); got != "3 часа назад" {
		t.Errorf("formatTimeAgo(3h ago) = %q; want '3 часа назад'", got)
	}
}

// Тест хеширования и проверки паролей через bcrypt
func TestPasswordHashingBcrypt(t *testing.T) {
	password := "SecretP@ss123"
	salt := generateSalt(16)

	hash := hashPassword(password, salt)
	if hash == "" {
		t.Fatal("hashPassword returned empty string")
	}

	// Должен успешно проверять правильный пароль
	if !checkPassword(password, salt, hash) {
		t.Errorf("checkPassword failed for valid password")
	}

	// Должен отклонять неверный пароль
	if checkPassword("WrongPassword", salt, hash) {
		t.Errorf("checkPassword succeeded for invalid password")
	}
}

// Тест обратной совместимости проверки старых SHA-256 хешей
func TestPasswordHashingLegacySHA256(t *testing.T) {
	password := "OldPassword"
	salt := "oldsalt123"

	// Создаем старый SHA-256 хеш вручную
	h := sha256.New()
	h.Write([]byte(password + ":" + salt + ":new_age_pepper"))
	legacyHash := hex.EncodeToString(h.Sum(nil))

	if !checkPassword(password, salt, legacyHash) {
		t.Errorf("checkPassword failed for legacy SHA-256 hash")
	}

	if checkPassword("BadPassword", salt, legacyHash) {
		t.Errorf("checkPassword succeeded with wrong password on legacy SHA-256")
	}
}

// Тест генерации и валидации JWT-токена
func TestJWTGenerationAndValidation(t *testing.T) {
	user := User{
		ID:       "u_test123",
		Username: "tester",
		Role:     "user",
	}

	token, err := generateJWT(user, "test@example.com")
	if err != nil {
		t.Fatalf("generateJWT failed: %v", err)
	}
	if token == "" {
		t.Fatal("token is empty")
	}

	claims, err := parseAndValidateJWT(token)
	if err != nil {
		t.Fatalf("parseAndValidateJWT failed: %v", err)
	}

	if claims.UserID != user.ID {
		t.Errorf("claims.UserID = %q; want %q", claims.UserID, user.ID)
	}
	if claims.Username != user.Username {
		t.Errorf("claims.Username = %q; want %q", claims.Username, user.Username)
	}
}

// Тест Rate Limiter
func TestIPRateLimiter(t *testing.T) {
	limiter := newIPRateLimiter(3, 100*time.Millisecond)
	ip := "192.168.1.1"

	// Первые 3 запроса должны быть разрешены
	for i := 0; i < 3; i++ {
		if !limiter.Allow(ip) {
			t.Errorf("request %d should be allowed", i+1)
		}
	}

	// 4-й запрос должен быть заблокирован
	if limiter.Allow(ip) {
		t.Error("4th request should be blocked by rate limiter")
	}

	// Другой IP не должен быть заблокирован
	if !limiter.Allow("192.168.1.2") {
		t.Error("different IP should be allowed")
	}

	// После истечения окна снова разрешено
	time.Sleep(120 * time.Millisecond)
	if !limiter.Allow(ip) {
		t.Error("request after window expiry should be allowed")
	}
}
