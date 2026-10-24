package main

import (
	"bytes"
	"compress/gzip"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

// BackupConfig хранит параметры подключения к S3 Яндекс Облака и расписание
type BackupConfig struct {
	Bucket         string
	AccessKey      string
	SecretKey      string
	Endpoint       string // по умолчанию https://storage.yandexcloud.net
	Region         string // по умолчанию ru-central1
	IntervalHours  int    // по умолчанию 12
	RetentionDays  int    // по умолчанию 30
	LocalBackupDir string // по умолчанию data/backups
}

type BackupStatus struct {
	LastBackupTime   string `json:"last_backup_time"`
	LastBackupFile   string `json:"last_backup_file"`
	LastBackupSize   int64  `json:"last_backup_size_bytes"`
	LastBackupStatus string `json:"last_backup_status"`
	NextBackupTime   string `json:"next_backup_time"`
	IntervalHours    int    `json:"interval_hours"`
	S3Configured     bool   `json:"s3_configured"`
	S3Bucket         string `json:"s3_bucket,omitempty"`
	ErrorMessage     string `json:"error_message,omitempty"`
}

var (
	backupMu     sync.RWMutex
	backupStatus = BackupStatus{
		LastBackupStatus: "idle",
		IntervalHours:    12,
	}
)

func getBackupConfig() BackupConfig {
	bucket := strings.TrimSpace(os.Getenv("YC_S3_BUCKET"))
	if bucket == "" {
		bucket = strings.TrimSpace(os.Getenv("S3_BUCKET"))
	}
	accessKey := strings.TrimSpace(os.Getenv("YC_S3_ACCESS_KEY"))
	if accessKey == "" {
		accessKey = strings.TrimSpace(os.Getenv("AWS_ACCESS_KEY_ID"))
	}
	secretKey := strings.TrimSpace(os.Getenv("YC_S3_SECRET_KEY"))
	if secretKey == "" {
		secretKey = strings.TrimSpace(os.Getenv("AWS_SECRET_ACCESS_KEY"))
	}
	endpoint := strings.TrimSpace(os.Getenv("YC_S3_ENDPOINT"))
	if endpoint == "" {
		endpoint = "https://storage.yandexcloud.net"
	}
	region := strings.TrimSpace(os.Getenv("YC_S3_REGION"))
	if region == "" {
		region = "ru-central1"
	}

	interval := 12
	if iv := strings.TrimSpace(os.Getenv("BACKUP_INTERVAL_HOURS")); iv != "" {
		if n, err := strconv.Atoi(iv); err == nil && n > 0 {
			interval = n
		}
	}

	retention := 30
	if rd := strings.TrimSpace(os.Getenv("BACKUP_RETENTION_DAYS")); rd != "" {
		if n, err := strconv.Atoi(rd); err == nil && n > 0 {
			retention = n
		}
	}

	localDir := strings.TrimSpace(os.Getenv("BACKUP_LOCAL_DIR"))
	if localDir == "" {
		localDir = filepath.Join("data", "backups")
	}

	return BackupConfig{
		Bucket:         bucket,
		AccessKey:      accessKey,
		SecretKey:      secretKey,
		Endpoint:       endpoint,
		Region:         region,
		IntervalHours:  interval,
		RetentionDays:  retention,
		LocalBackupDir: localDir,
	}
}

// initBackupScheduler запускает планировщик резервного копирования
func initBackupScheduler() {
	cfg := getBackupConfig()

	backupMu.Lock()
	backupStatus.IntervalHours = cfg.IntervalHours
	backupStatus.S3Configured = cfg.Bucket != "" && cfg.AccessKey != "" && cfg.SecretKey != ""
	if backupStatus.S3Configured {
		backupStatus.S3Bucket = cfg.Bucket
	}
	backupMu.Unlock()

	if backupStatus.S3Configured {
		log.Printf("📦 [Backup] Автоматический бэкап настроен: каждые %d ч. -> Яндекс Облако (бакет: %s)", cfg.IntervalHours, cfg.Bucket)
	} else {
		log.Printf("⚠️ [Backup] Переменные Яндекс Облака не заданы (YC_S3_BUCKET, YC_S3_ACCESS_KEY, YC_S3_SECRET_KEY).")
		log.Printf("ℹ️ [Backup] Бэкапы будут сохраняться локально в %s каждые %d ч.", cfg.LocalBackupDir, cfg.IntervalHours)
	}

	go func() {
		// Первичный запуск через 2 минуты после старта сервера, чтобы дать базе полностью инициализироваться
		time.Sleep(2 * time.Minute)
		log.Println("⏰ [Backup] Запуск первого планового резервного копирования...")
		runBackupTask()

		ticker := time.NewTicker(time.Duration(cfg.IntervalHours) * time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			log.Println("⏰ [Backup] Запуск резервного копирования по расписанию...")
			runBackupTask()
		}
	}()
}

// runBackupTask выполняет создание бэкапа и отправку в S3
func runBackupTask() {
	cfg := getBackupConfig()

	backupMu.Lock()
	backupStatus.LastBackupStatus = "running"
	backupStatus.ErrorMessage = ""
	backupMu.Unlock()

	filename, compressedData, err := generateDatabaseBackup(cfg)
	if err != nil {
		log.Printf("❌ [Backup] Ошибка создания дампа базы: %v", err)
		backupMu.Lock()
		backupStatus.LastBackupStatus = "failed"
		backupStatus.ErrorMessage = err.Error()
		backupMu.Unlock()
		return
	}

	// Сохраняем локально
	if err := os.MkdirAll(cfg.LocalBackupDir, 0755); err != nil {
		log.Printf("⚠️ [Backup] Не удалось создать локальную папку %s: %v", cfg.LocalBackupDir, err)
	} else {
		localPath := filepath.Join(cfg.LocalBackupDir, filename)
		if err := os.WriteFile(localPath, compressedData, 0644); err != nil {
			log.Printf("⚠️ [Backup] Не удалось записать локальный файл %s: %v", localPath, err)
		} else {
			log.Printf("💾 [Backup] Локальная копия сохранена: %s (%d байт)", localPath, len(compressedData))
		}
	}

	// Очищаем старые локальные бэкапы
	cleanupLocalBackups(cfg.LocalBackupDir, cfg.RetentionDays)

	// Отправляем в Яндекс Облако S3, если настроено
	if cfg.Bucket != "" && cfg.AccessKey != "" && cfg.SecretKey != "" {
		s3Key := fmt.Sprintf("backups/%s", filename)
		err := uploadToYandexS3(cfg, s3Key, compressedData)
		if err != nil {
			log.Printf("❌ [Backup] Ошибка загрузки бэкапа в Яндекс Облако: %v", err)
			backupMu.Lock()
			backupStatus.LastBackupStatus = "s3_upload_failed"
			backupStatus.ErrorMessage = fmt.Sprintf("Локально сохранён, но ошибка загрузки в S3: %v", err)
			backupMu.Unlock()
			return
		}
		log.Printf("☁️ [Backup] Бэкап успешно загружен в Яндекс Облако: %s/%s (%.2f МБ)", cfg.Bucket, s3Key, float64(len(compressedData))/(1024*1024))
	}

	now := time.Now().Format(time.RFC3339)
	next := time.Now().Add(time.Duration(cfg.IntervalHours) * time.Hour).Format(time.RFC3339)

	backupMu.Lock()
	backupStatus.LastBackupTime = now
	backupStatus.LastBackupFile = filename
	backupStatus.LastBackupSize = int64(len(compressedData))
	backupStatus.LastBackupStatus = "success"
	backupStatus.NextBackupTime = next
	backupStatus.ErrorMessage = ""
	backupMu.Unlock()
}

// generateDatabaseBackup создает сжатый SQL-дамп базы
func generateDatabaseBackup(cfg BackupConfig) (string, []byte, error) {
	timestamp := time.Now().UTC().Format("2006-01-02_15-04-05")
	filename := fmt.Sprintf("backup_%s.sql.gz", timestamp)

	dbURL, _ := getDatabaseURL()

	// 1. Попытка использовать нативную утилиту pg_dump (если установлена в системе/контейнере)
	if dbURL != "" {
		if _, err := exec.LookPath("pg_dump"); err == nil {
			log.Println("🛠️ [Backup] Создание дампа через pg_dump...")
			cmd := exec.Command("pg_dump", "--no-owner", "--no-privileges", "--clean", "--if-exists", "-d", dbURL)
			var stdout bytes.Buffer
			var stderr bytes.Buffer
			cmd.Stdout = &stdout
			cmd.Stderr = &stderr

			if err := cmd.Run(); err == nil && stdout.Len() > 0 {
				log.Printf("✅ [Backup] pg_dump выполнен успешно (%d байт SQL)", stdout.Len())
				var gzb bytes.Buffer
				zw := gzip.NewWriter(&gzb)
				if _, err := zw.Write(stdout.Bytes()); err == nil {
					_ = zw.Close()
					return filename, gzb.Bytes(), nil
				}
			} else {
				log.Printf("⚠️ [Backup] pg_dump завершился с предупреждением: %v, stderr: %s. Переключение на Go SQL dumper.", err, stderr.String())
			}
		}
	}

	// 2. Встроенный чистый Go-дампер таблицы за таблицей
	dbConn := getDB()
	if dbConn == nil {
		return "", nil, fmt.Errorf("база данных PostgreSQL недоступна (nil)")
	}

	log.Println("🛠️ [Backup] Создание дампа встроенным Go SQL экспортером...")
	sqlDump, err := dumpPostgresWithGo(dbConn)
	if err != nil {
		return "", nil, fmt.Errorf("ошибка генерации SQL дампа: %w", err)
	}

	var gzb bytes.Buffer
	zw := gzip.NewWriter(&gzb)
	if _, err := zw.Write([]byte(sqlDump)); err != nil {
		return "", nil, fmt.Errorf("ошибка сжатия gzip: %w", err)
	}
	if err := zw.Close(); err != nil {
		return "", nil, fmt.Errorf("ошибка финализации gzip: %w", err)
	}

	return filename, gzb.Bytes(), nil
}

// dumpPostgresWithGo экспортирует все таблицы публичной схемы PostgreSQL в читаемый SQL-дамп
func dumpPostgresWithGo(db *sql.DB) (string, error) {
	var buf strings.Builder
	buf.WriteString(fmt.Sprintf("-- PostgreSQL Database Backup\n-- Generated at: %s\n\n", time.Now().UTC().Format(time.RFC3339)))
	buf.WriteString("SET client_encoding = 'UTF8';\n")
	buf.WriteString("SET standard_conforming_strings = on;\n\n")

	rows, err := db.Query(`
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
		ORDER BY table_name;
	`)
	if err != nil {
		return "", fmt.Errorf("failed to list tables: %w", err)
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var tName string
		if err := rows.Scan(&tName); err == nil {
			tables = append(tables, tName)
		}
	}

	for _, tbl := range tables {
		buf.WriteString(fmt.Sprintf("--\n-- Data for Name: %s\n--\n", tbl))

		colRows, err := db.Query(fmt.Sprintf("SELECT * FROM %s LIMIT 0", tbl))
		if err != nil {
			continue
		}
		colNames, err := colRows.Columns()
		colRows.Close()
		if err != nil || len(colNames) == 0 {
			continue
		}

		dataRows, err := db.Query(fmt.Sprintf("SELECT * FROM %s", tbl))
		if err != nil {
			continue
		}

		for dataRows.Next() {
			values := make([]interface{}, len(colNames))
			valPtrs := make([]interface{}, len(colNames))
			for i := range values {
				valPtrs[i] = &values[i]
			}

			if err := dataRows.Scan(valPtrs...); err != nil {
				continue
			}

			var valStrs []string
			for _, val := range values {
				if val == nil {
					valStrs = append(valStrs, "NULL")
				} else {
					switch v := val.(type) {
					case []byte:
						escaped := strings.ReplaceAll(string(v), "'", "''")
						valStrs = append(valStrs, fmt.Sprintf("'%s'", escaped))
					case string:
						escaped := strings.ReplaceAll(v, "'", "''")
						valStrs = append(valStrs, fmt.Sprintf("'%s'", escaped))
					case time.Time:
						valStrs = append(valStrs, fmt.Sprintf("'%s'", v.Format("2006-01-02 15:04:05.999999-07")))
					case bool:
						if v {
							valStrs = append(valStrs, "TRUE")
						} else {
							valStrs = append(valStrs, "FALSE")
						}
					default:
						valStrs = append(valStrs, fmt.Sprintf("%v", v))
					}
				}
			}

			buf.WriteString(fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s) ON CONFLICT DO NOTHING;\n",
				tbl,
				strings.Join(colNames, ", "),
				strings.Join(valStrs, ", "),
			))
		}
		dataRows.Close()
		buf.WriteString("\n")
	}

	return buf.String(), nil
}

// cleanupLocalBackups удаляет локальные архивы старше retentionDays
func cleanupLocalBackups(dir string, retentionDays int) {
	if retentionDays <= 0 {
		return
	}
	cutoff := time.Now().Add(-time.Duration(retentionDays) * 24 * time.Hour)

	entries, err := os.ReadDir(dir)
	if err != nil {
		return
	}

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasPrefix(entry.Name(), "backup_") || !strings.HasSuffix(entry.Name(), ".gz") {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}
		if info.ModTime().Before(cutoff) {
			_ = os.Remove(filepath.Join(dir, entry.Name()))
			log.Printf("🧹 [Backup] Удален устаревший локальный бэкап: %s", entry.Name())
		}
	}
}

// uploadToYandexS3 загружает файл в Yandex Object Storage через стандартный протокол S3 AWS v4
func uploadToYandexS3(cfg BackupConfig, objectKey string, data []byte) error {
	endpoint := strings.TrimRight(cfg.Endpoint, "/")
	if endpoint == "" {
		endpoint = "https://storage.yandexcloud.net"
	}

	parsedEndpoint, err := url.Parse(endpoint)
	if err != nil {
		return fmt.Errorf("неверный S3 endpoint: %w", err)
	}

	// Path-style S3 URL: https://storage.yandexcloud.net/{bucket}/{key}
	reqURL := fmt.Sprintf("%s/%s/%s", endpoint, cfg.Bucket, strings.TrimLeft(objectKey, "/"))

	req, err := http.NewRequest("PUT", reqURL, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("ошибка создания HTTP запроса: %w", err)
	}

	req.Header.Set("Host", parsedEndpoint.Host)
	req.Header.Set("Content-Type", "application/gzip")
	req.Header.Set("Content-Length", strconv.Itoa(len(data)))

	// Подписываем запрос по стандарту AWS Signature Version 4
	now := time.Now().UTC()
	signS3V4(req, data, cfg.AccessKey, cfg.SecretKey, cfg.Region, "s3", now)

	client := &http.Client{
		Timeout: 5 * time.Minute,
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("сетевая ошибка при отправке в Яндекс Облако: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Яндекс Облако вернуло статус %d %s: %s", resp.StatusCode, resp.Status, string(respBody))
	}

	return nil
}

// signS3V4 формирует подпись AWS Signature Version 4
func signS3V4(req *http.Request, payload []byte, accessKey, secretKey, region, service string, t time.Time) {
	amzDate := t.Format("20060102T150405Z")
	dateStamp := t.Format("20060102")

	payloadHash := sha256Hex(payload)
	req.Header.Set("X-Amz-Date", amzDate)
	req.Header.Set("X-Amz-Content-Sha256", payloadHash)

	// Список заголовков для канонического запроса
	headers := map[string]string{
		"host":                 req.Header.Get("Host"),
		"x-amz-date":           amzDate,
		"x-amz-content-sha256": payloadHash,
	}
	if ct := req.Header.Get("Content-Type"); ct != "" {
		headers["content-type"] = ct
	}

	var headerKeys []string
	for k := range headers {
		headerKeys = append(headerKeys, k)
	}
	sort.Strings(headerKeys)

	var canonicalHeaders strings.Builder
	for _, k := range headerKeys {
		canonicalHeaders.WriteString(fmt.Sprintf("%s:%s\n", k, strings.TrimSpace(headers[k])))
	}
	signedHeaders := strings.Join(headerKeys, ";")

	canonicalURI := req.URL.EscapedPath()
	if canonicalURI == "" {
		canonicalURI = "/"
	}

	canonicalRequest := fmt.Sprintf("%s\n%s\n%s\n%s\n%s\n%s",
		req.Method,
		canonicalURI,
		req.URL.RawQuery,
		canonicalHeaders.String(),
		signedHeaders,
		payloadHash,
	)

	credentialScope := fmt.Sprintf("%s/%s/%s/aws4_request", dateStamp, region, service)
	stringToSign := fmt.Sprintf("AWS4-HMAC-SHA256\n%s\n%s\n%s",
		amzDate,
		credentialScope,
		sha256Hex([]byte(canonicalRequest)),
	)

	signingKey := getSignatureKey(secretKey, dateStamp, region, service)
	signature := hex.EncodeToString(hmacSHA256(signingKey, []byte(stringToSign)))

	authHeader := fmt.Sprintf("AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		accessKey,
		credentialScope,
		signedHeaders,
		signature,
	)
	req.Header.Set("Authorization", authHeader)
}

func hmacSHA256(key []byte, data []byte) []byte {
	h := hmac.New(sha256.New, key)
	h.Write(data)
	return h.Sum(nil)
}

func sha256Hex(data []byte) string {
	h := sha256.Sum256(data)
	return hex.EncodeToString(h[:])
}

func getSignatureKey(key, dateStamp, regionName, serviceName string) []byte {
	kDate := hmacSHA256([]byte("AWS4"+key), []byte(dateStamp))
	kRegion := hmacSHA256(kDate, []byte(regionName))
	kService := hmacSHA256(kRegion, []byte(serviceName))
	kSigning := hmacSHA256(kService, []byte("aws4_request"))
	return kSigning
}

// handleAdminBackupStatus возвращает текущий статус бэкапов
func handleAdminBackupStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	backupMu.RLock()
	defer backupMu.RUnlock()
	_ = json.NewEncoder(w).Encode(backupStatus)
}

// handleAdminBackupTrigger позволяет вручную запустить бэкап прямо сейчас
func handleAdminBackupTrigger(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	go runBackupTask()

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Процесс резервного копирования запущен в фоновом режиме",
	})
}
