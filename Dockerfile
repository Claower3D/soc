# ==========================================
# 1. Сборка React 19 Frontend
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# 2. Сборка Go Backend
# ==========================================
FROM golang:alpine AS backend-builder
WORKDIR /app/backend

COPY backend/go.mod ./
RUN go mod download || true

COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server .

# ==========================================
# 3. Финальный легковесный образ для Railway
# ==========================================
FROM alpine:3.21
WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

COPY --from=backend-builder /app/backend/server ./server
COPY --from=frontend-builder /app/frontend/dist ./dist

ENV PORT=8080
ENV STATIC_DIR=/app/dist

EXPOSE 8080

CMD ["./server"]
