package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/google/uuid"
)

// =============================================================================
// WALLET & PRICING CATALOG (КОШЕЛЁК NEW AGE PAY И КАТАЛОГ ЦЕН СЕРВИСА)
// =============================================================================

// PlatformService описывает тариф или услугу в каталоге цен
type PlatformService struct {
	ID          string   `json:"id"`
	Category    string   `json:"category"` // "subscriptions", "dating", "spiritual", "business", "studio_ai"
	Title       string   `json:"title"`
	Subtitle    string   `json:"subtitle"`
	Description string   `json:"description"`
	Price       float64  `json:"price"`
	OldPrice    float64  `json:"oldPrice,omitempty"`
	Currency    string   `json:"currency"`
	Period      string   `json:"period"` // "в месяц", "в год", "на 7 дней", "навсегда", "10 шт", etc.
	Badge       string   `json:"badge,omitempty"`
	Icon        string   `json:"icon"`
	Popular     bool     `json:"popular,omitempty"`
	Perks       []string `json:"perks"`
}

// getPlatformServicesCatalog возвращает 4 флагманские платные услуги платформы
func getPlatformServicesCatalog() []PlatformService {
	return []PlatformService{
		// 1. Премиум & Статусы
		{
			ID:          "sub_premium_month",
			Category:    "subscriptions",
			Title:       "New Age Premium (1 месяц)",
			Subtitle:    "Максимальный комфорт, статус и возможности",
			Description: "Золотой бейдж в профиле и чатах, 0% комиссии на переводы и маркетплейс, экспорт видео в 4K 60fps, закрытые конференции до 500 человек.",
			Price:       399,
			OldPrice:    599,
			Currency:    "RUB",
			Period:      "в месяц",
			Badge:       "ХИТ ПРОДАЖ",
			Icon:        "Crown",
			Popular:     true,
			Perks: []string{
				"Золотой знак отличия Premium в профиле и чатах",
				"0% комиссии на покупки и переводы внутри сети",
				"Экспорт видео в 4K 60fps без водяного знака",
				"Безлимитные свайпы и лайки в Знакомствах",
				"Доступ к закрытым стримам и онлайн-конференциям",
			},
		},

		// 2. Знакомства & Резонанс
		{
			ID:          "dating_boost_7d",
			Category:    "dating",
			Title:       "Топ-Буст анкеты (7 дней)",
			Subtitle:    "В 8 раз больше просмотров и взаимных симпатий",
			Description: "Ваша анкета закрепляется на 1-м месте в ленте свайпов и каталоге знакомств в вашем городе на целую неделю.",
			Price:       290,
			OldPrice:    490,
			Currency:    "RUB",
			Period:      "на 7 дней",
			Badge:       "ТОП ВЫБОР",
			Icon:        "HeartHandshake",
			Popular:     true,
			Perks: []string{
				"Первое место в ленте свайпов по вашему городу",
				"В 8 раз больше откликов и просмотров анкеты",
				"Неоновое мерцание карточки в общем каталоге",
				"Список пользователей, открывавших ваш профиль",
			},
		},

		// 3. Духовные Практики & Ретриты
		{
			ID:          "spiritual_freq_pro",
			Category:    "spiritual",
			Title:       "PRO Доступ: Частоты 432–963 Гц",
			Subtitle:    "Саундхилинг, поющие чаши и бинауральные ритмы",
			Description: "120+ медитаций в студийном качестве без сжатия, сессии глубокой пранаямы, тибетские чаши и частоты Сольфеджио.",
			Price:       590,
			Currency:    "RUB",
			Period:      "в месяц",
			Badge:       "САУНДХИЛИНГ",
			Icon:        "Headphones",
			Perks: []string{
				"Полная коллекция частот Сольфеджио (432, 528, 963 Гц)",
				"Оффлайн-загрузка аудиофайлов в телефон",
				"Пранаяма с метрономом и визуализацией дыхания",
				"Еженедельные новые авторские композиции",
			},
		},

		// 4. Бизнес & Маркетплейс
		{
			ID:          "biz_account_pro",
			Category:    "business",
			Title:       "Бизнес-аккаунт PRO",
			Subtitle:    "Фирменная витрина, CRM и эквайринг 0%",
			Description: "Комплексное решение для магазинов, мастеров и брендов. Прием оплат СБП и картами, CRM для ведения заказов, аналитика продаж.",
			Price:       1290,
			OldPrice:    1990,
			Currency:    "RUB",
			Period:      "в месяц",
			Badge:       "БИЗНЕС PRO",
			Icon:        "Briefcase",
			Popular:     true,
			Perks: []string{
				"Персональная витрина с каталогом товаров",
				"Прием платежей через СБП, карты и криптовалюту",
				"CRM-система учета заказов и остатков на складе",
				"0% эквайринга на первый месяц работы",
				"Интеграция доставки СДЭК и курьерских служб",
			},
		},
	}
}

// Fallback Store для оффлайн работы без PostgreSQL
type WalletStoreData struct {
	mu           sync.RWMutex
	Balances     map[string]float64               `json:"balances"` // Key: UserID -> balance
	Transactions map[string][]map[string]interface{} `json:"transactions"` // Key: UserID -> list of tx
	filePath     string
}

var globalWalletStore *WalletStoreData

func initWalletStore(dataDir string) {
	fp := filepath.Join(dataDir, "wallet_store.json")
	globalWalletStore = &WalletStoreData{
		Balances:     make(map[string]float64),
		Transactions: make(map[string][]map[string]interface{}),
		filePath:     fp,
	}
	globalWalletStore.loadFromDisk()
}

func (s *WalletStoreData) loadFromDisk() {
	s.mu.Lock()
	defer s.mu.Unlock()
	data, err := os.ReadFile(s.filePath)
	if err != nil {
		return
	}
	var loaded struct {
		Balances     map[string]float64                  `json:"balances"`
		Transactions map[string][]map[string]interface{} `json:"transactions"`
	}
	if err := json.Unmarshal(data, &loaded); err == nil {
		if loaded.Balances != nil {
			s.Balances = loaded.Balances
		}
		if loaded.Transactions != nil {
			s.Transactions = loaded.Transactions
		}
	}
}

func (s *WalletStoreData) saveToDisk() {
	s.mu.RLock()
	defer s.mu.RUnlock()
	payload := struct {
		Balances     map[string]float64                  `json:"balances"`
		Transactions map[string][]map[string]interface{} `json:"transactions"`
	}{
		Balances:     s.Balances,
		Transactions: s.Transactions,
	}
	b, err := json.MarshalIndent(payload, "", "  ")
	if err == nil {
		_ = os.WriteFile(s.filePath, b, 0644)
	}
}

func (s *WalletStoreData) GetBalance(userID string) float64 {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.Balances[userID]
}

func (s *WalletStoreData) SetBalance(userID string, amount float64) {
	s.mu.Lock()
	s.Balances[userID] = amount
	s.mu.Unlock()
	s.saveToDisk()
}

func (s *WalletStoreData) AddTransaction(userID string, tx map[string]interface{}) {
	s.mu.Lock()
	existing := s.Transactions[userID]
	s.Transactions[userID] = append([]map[string]interface{}{tx}, existing...)
	s.mu.Unlock()
	s.saveToDisk()
}

func (s *WalletStoreData) GetTransactions(userID string) []map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.Transactions[userID]
}

// ensureWalletTables создает таблицы кошелька в PostgreSQL при их отсутствии
func ensureWalletTables(conn *sql.DB) {
	if conn == nil {
		return
	}
	ddl := `
	CREATE TABLE IF NOT EXISTS wallet_accounts (
		user_id VARCHAR(64) PRIMARY KEY,
		balance NUMERIC(15, 2) DEFAULT 0.00,
		currency VARCHAR(10) DEFAULT 'RUB',
		is_locked BOOLEAN DEFAULT FALSE,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS wallet_transactions (
		id VARCHAR(64) PRIMARY KEY,
		user_id VARCHAR(64) NOT NULL,
		type VARCHAR(50) NOT NULL,
		amount NUMERIC(15, 2) NOT NULL,
		currency VARCHAR(10) DEFAULT 'RUB',
		fee NUMERIC(10, 2) DEFAULT 0.00,
		status VARCHAR(30) DEFAULT 'completed',
		recipient_id VARCHAR(64),
		description TEXT DEFAULT '',
		reference_id VARCHAR(64) DEFAULT '',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id);
	`
	if _, err := conn.Exec(ddl); err != nil {
		log.Printf("[wallet] Warning: failed to ensure wallet tables: %v", err)
	} else {
		log.Printf("[wallet] Wallet tables verified in database.")
	}
}

// handleWallet возвращает баланс, валюту, историю транзакций и полный каталог цен
func handleWallet(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Авторизация требуется"})
		return
	}

	services := getPlatformServicesCatalog()

	if db != nil {
		var balance float64
		var currency string
		err := db.QueryRow("SELECT balance, currency FROM wallet_accounts WHERE user_id = $1", claims.UserID).Scan(&balance, &currency)
		if err != nil {
			// Создаем запись для кошелька
			_, _ = db.Exec("INSERT INTO wallet_accounts (user_id, balance, currency) VALUES ($1, 0, 'RUB') ON CONFLICT (user_id) DO NOTHING", claims.UserID)
			balance = 0
			currency = "RUB"
		}

		txRows, err := db.Query(`
			SELECT id, type, amount, currency, description, created_at
			FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30
		`, claims.UserID)
		var transactions []map[string]interface{}
		if err == nil && txRows != nil {
			defer txRows.Close()
			for txRows.Next() {
				var tid, txType, txCurrency, txDesc string
				var txAmount float64
				var txDate time.Time
				if txRows.Scan(&tid, &txType, &txAmount, &txCurrency, &txDesc, &txDate) == nil {
					transactions = append(transactions, map[string]interface{}{
						"id":          tid,
						"type":        txType,
						"amount":      txAmount,
						"currency":    txCurrency,
						"description": txDesc,
						"date":        txDate.Format("02.01.2006, 15:04"),
						"status":      "completed",
					})
				}
			}
		}

		writeJSON(w, http.StatusOK, Response{
			Status: "ok",
			Data: map[string]interface{}{
				"balance":      balance,
				"currency":     currency,
				"transactions": transactions,
				"services":     services,
			},
		})
		return
	}

	// Fallback на файловое хранилище
	balance := globalWalletStore.GetBalance(claims.UserID)
	txs := globalWalletStore.GetTransactions(claims.UserID)
	if txs == nil {
		txs = []map[string]interface{}{}
	}

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]interface{}{
			"balance":      balance,
			"currency":     "RUB",
			"transactions": txs,
			"services":     services,
		},
	})
}

// handleWalletDeposit обрабатывает пополнение баланса кошелька
func handleWalletDeposit(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Авторизация требуется"})
		return
	}

	var req struct {
		Amount float64 `json:"amount"`
		Method string  `json:"method"` // "sbp", "card", "crypto", "mir"
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Amount <= 0 {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Укажите корректную сумму пополнения"})
		return
	}

	txID := fmt.Sprintf("tx-dep-%s", uuid.New().String()[:8])
	methodLabel := "Банковская карта"
	switch req.Method {
	case "sbp":
		methodLabel = "Система быстрых платежей (СБП)"
	case "crypto":
		methodLabel = "Криптовалюта (USDT/TON)"
	case "mir":
		methodLabel = "Карта МИР / Tinkoff Pay"
	}

	description := fmt.Sprintf("Пополнение баланса через %s", methodLabel)
	nowStr := time.Now().Format("02.01.2006, 15:04")

	if db != nil {
		// Обновляем баланс в PostgreSQL
		var newBalance float64
		err := db.QueryRow(`
			INSERT INTO wallet_accounts (user_id, balance, currency, updated_at)
			VALUES ($1, $2, 'RUB', NOW())
			ON CONFLICT (user_id) DO UPDATE
			SET balance = wallet_accounts.balance + $2, updated_at = NOW()
			RETURNING balance
		`, claims.UserID, req.Amount).Scan(&newBalance)

		if err != nil {
			writeJSON(w, http.StatusInternalServerError, Response{Status: "error", Message: "Не удалось пополнить баланс в БД"})
			return
		}

		_, _ = db.Exec(`
			INSERT INTO wallet_transactions (id, user_id, type, amount, currency, description, created_at)
			VALUES ($1, $2, 'deposit', $3, 'RUB', $4, NOW())
		`, txID, claims.UserID, req.Amount, description)

		writeJSON(w, http.StatusOK, Response{
			Status: "ok",
			Data: map[string]interface{}{
				"balance": newBalance,
				"transaction": map[string]interface{}{
					"id":          txID,
					"type":        "deposit",
					"amount":      req.Amount,
					"currency":    "RUB",
					"description": description,
					"date":        nowStr,
					"status":      "completed",
				},
			},
		})
		return
	}

	// Fallback
	curBalance := globalWalletStore.GetBalance(claims.UserID)
	newBalance := curBalance + req.Amount
	globalWalletStore.SetBalance(claims.UserID, newBalance)

	txMap := map[string]interface{}{
		"id":          txID,
		"type":        "deposit",
		"amount":      req.Amount,
		"currency":    "RUB",
		"description": description,
		"date":        nowStr,
		"status":      "completed",
	}
	globalWalletStore.AddTransaction(claims.UserID, txMap)

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]interface{}{
			"balance":     newBalance,
			"transaction": txMap,
		},
	})
}

// handleWalletPay обрабатывает покупку услуги из каталога цен
func handleWalletPay(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Авторизация требуется"})
		return
	}

	var req struct {
		ServiceID string  `json:"serviceId"`
		Amount    float64 `json:"amount"`
		Title     string  `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Amount <= 0 {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Некорректные параметры покупки"})
		return
	}

	txID := fmt.Sprintf("tx-pay-%s", uuid.New().String()[:8])
	description := fmt.Sprintf("Оплата услуги «%s»", req.Title)
	nowStr := time.Now().Format("02.01.2006, 15:04")

	if db != nil {
		var currentBalance float64
		err := db.QueryRow("SELECT balance FROM wallet_accounts WHERE user_id = $1", claims.UserID).Scan(&currentBalance)
		if err != nil || currentBalance < req.Amount {
			writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Недостаточно средств на балансе кошелька. Пополните счет."})
			return
		}

		var newBalance float64
		err = db.QueryRow(`
			UPDATE wallet_accounts
			SET balance = balance - $2, updated_at = NOW()
			WHERE user_id = $1
			RETURNING balance
		`, claims.UserID, req.Amount).Scan(&newBalance)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, Response{Status: "error", Message: "Ошибка списания средств"})
			return
		}

		_, _ = db.Exec(`
			INSERT INTO wallet_transactions (id, user_id, type, amount, currency, description, reference_id, created_at)
			VALUES ($1, $2, 'purchase', $3, 'RUB', $4, $5, NOW())
		`, txID, claims.UserID, -req.Amount, description, req.ServiceID)

		writeJSON(w, http.StatusOK, Response{
			Status: "ok",
			Data: map[string]interface{}{
				"balance": newBalance,
				"transaction": map[string]interface{}{
					"id":          txID,
					"type":        "purchase",
					"amount":      -req.Amount,
					"currency":    "RUB",
					"description": description,
					"date":        nowStr,
					"status":      "completed",
				},
			},
		})
		return
	}

	// Fallback
	curBalance := globalWalletStore.GetBalance(claims.UserID)
	if curBalance < req.Amount {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Недостаточно средств на балансе кошелька. Пополните счет."})
		return
	}

	newBalance := curBalance - req.Amount
	globalWalletStore.SetBalance(claims.UserID, newBalance)

	txMap := map[string]interface{}{
		"id":          txID,
		"type":        "purchase",
		"amount":      -req.Amount,
		"currency":    "RUB",
		"description": description,
		"date":        nowStr,
		"status":      "completed",
	}
	globalWalletStore.AddTransaction(claims.UserID, txMap)

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]interface{}{
			"balance":     newBalance,
			"transaction": txMap,
		},
	})
}

// handleWalletTransfer обрабатывает прямой перевод или донат автору
func handleWalletTransfer(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	claims, err := parseAndValidateJWT(token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, Response{Status: "error", Message: "Авторизация требуется"})
		return
	}

	var req struct {
		RecipientUsername string  `json:"recipientUsername"`
		Amount            float64 `json:"amount"`
		Note              string  `json:"note"`
		IsDonation        bool    `json:"isDonation"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Amount <= 0 {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Укажите корректную сумму перевода"})
		return
	}

	actionType := "transfer"
	descPrefix := "Перевод пользователю"
	if req.IsDonation {
		actionType = "donation_sent"
		descPrefix = "Донат автору"
	}
	description := fmt.Sprintf("%s @%s", descPrefix, req.RecipientUsername)
	if req.Note != "" {
		description += fmt.Sprintf(" («%s»)", req.Note)
	}

	txID := fmt.Sprintf("tx-tr-%s", uuid.New().String()[:8])
	nowStr := time.Now().Format("02.01.2006, 15:04")

	if db != nil {
		var currentBalance float64
		err := db.QueryRow("SELECT balance FROM wallet_accounts WHERE user_id = $1", claims.UserID).Scan(&currentBalance)
		if err != nil || currentBalance < req.Amount {
			writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Недостаточно средств для перевода"})
			return
		}

		var newBalance float64
		err = db.QueryRow(`
			UPDATE wallet_accounts
			SET balance = balance - $2, updated_at = NOW()
			WHERE user_id = $1
			RETURNING balance
		`, claims.UserID, req.Amount).Scan(&newBalance)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, Response{Status: "error", Message: "Ошибка перевода"})
			return
		}

		_, _ = db.Exec(`
			INSERT INTO wallet_transactions (id, user_id, type, amount, currency, description, created_at)
			VALUES ($1, $2, $3, $4, 'RUB', $5, NOW())
		`, txID, claims.UserID, actionType, -req.Amount, description)

		writeJSON(w, http.StatusOK, Response{
			Status: "ok",
			Data: map[string]interface{}{
				"balance": newBalance,
				"transaction": map[string]interface{}{
					"id":          txID,
					"type":        actionType,
					"amount":      -req.Amount,
					"currency":    "RUB",
					"description": description,
					"date":        nowStr,
					"status":      "completed",
				},
			},
		})
		return
	}

	// Fallback
	curBalance := globalWalletStore.GetBalance(claims.UserID)
	if curBalance < req.Amount {
		writeJSON(w, http.StatusBadRequest, Response{Status: "error", Message: "Недостаточно средств для перевода"})
		return
	}

	newBalance := curBalance - req.Amount
	globalWalletStore.SetBalance(claims.UserID, newBalance)

	txMap := map[string]interface{}{
		"id":          txID,
		"type":        actionType,
		"amount":      -req.Amount,
		"currency":    "RUB",
		"description": description,
		"date":        nowStr,
		"status":      "completed",
	}
	globalWalletStore.AddTransaction(claims.UserID, txMap)

	writeJSON(w, http.StatusOK, Response{
		Status: "ok",
		Data: map[string]interface{}{
			"balance":     newBalance,
			"transaction": txMap,
		},
	})
}
