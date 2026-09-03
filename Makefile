# Makefile для проекта React + Go

.PHONY: dev dev-backend dev-frontend build clean

# Запуск всего стека (бэкенд + фронтенд)
dev:
	@echo "Запуск бэкенда и фронтенда..."
	@make dev-backend &
	@make dev-frontend

# Запуск Go бэкенда
dev-backend:
	cd backend && go run .

# Запуск React фронтенда
dev-frontend:
	cd frontend && npm run dev

# Сборка продакшн
build:
	cd backend && go build -o ../dist/server.exe .
	cd frontend && npm run build

# Очистка артефактов сборки
clean:
	rm -rf dist
	rm -rf frontend/dist
