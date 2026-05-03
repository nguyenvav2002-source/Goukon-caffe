# Technical Introduction — Gōkon App

Hướng dẫn cài đặt và chạy toàn bộ hệ thống trên máy local.

---

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cấu trúc dự án](#2-cấu-trúc-dự-án)
3. [Cài đặt nhanh với Docker (khuyến nghị)](#3-cài-đặt-nhanh-với-docker-khuyến-nghị)
4. [Cài đặt thủ công (không Docker)](#4-cài-đặt-thủ-công-không-docker)
5. [Biến môi trường](#5-biến-môi-trường)
6. [Test trên thiết bị thực / Expo Go](#6-test-trên-thiết-bị-thực--expo-go)
7. [Swagger API Docs](#7-swagger-api-docs)
8. [Quản lý database](#8-quản-lý-database)
9. [Chạy test](#9-chạy-test)
10. [Các lệnh hay dùng](#10-các-lệnh-hay-dùng)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu | Kiểm tra |
|---|---|---|
| Node.js | 20 LTS | `node -v` |
| pnpm / npm | pnpm 9+ | `pnpm -v` |
| Docker Desktop | 4.x | `docker -v` |
| Docker Compose | v2 (tích hợp trong Docker Desktop) | `docker compose version` |
| Expo Go (điện thoại) | SDK 52 | App Store / Google Play |

> **Windows:** Bật WSL 2 backend cho Docker Desktop để tránh lỗi volume mount.

---

## 2. Cấu trúc dự án

```
project-G-kon/
├── apps/
│   ├── backend/          # NestJS REST API (Node 20)
│   │   ├── prisma/       # Prisma schema + seed
│   │   └── src/
│   └── mobile/           # Expo React Native (SDK 52)
│       ├── app/          # Expo Router (file-based routing)
│       └── src/          # Screens, services, store
├── docs/                 # Tài liệu dự án
├── docker-compose.yml    # Orchestration (postgres + backend + mobile)
└── .env.example          # Template biến môi trường
```

---

## 3. Cài đặt nhanh với Docker (khuyến nghị)

### Bước 1 — Tạo file `.env`

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Mở `.env` và điền:

```env
JWT_ACCESS_SECRET=your_very_long_random_secret_here
JWT_REFRESH_SECRET=another_very_long_random_secret_here

# Nếu test trên điện thoại thật: điền IP LAN của máy tính
# Tìm bằng lệnh: ipconfig (Windows) | ifconfig (Mac/Linux)
HOST_IP=192.168.1.x
```

> Để tạo secret ngẫu nhiên:
> ```powershell
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### Bước 2 — Khởi động tất cả services

```powershell
docker compose up --build
```

Lần đầu sẽ mất ~3-5 phút để build image và cài dependencies.

### Bước 3 — Seed dữ liệu mẫu (tùy chọn)

```powershell
docker compose exec backend npx prisma db seed
```

### Kiểm tra

| Service | URL | Mô tả |
|---|---|---|
| Backend API | http://localhost:3000 | REST API (redirect sang mobile app) |
| Swagger Docs | http://localhost:3000/api/docs | Interactive API documentation |
| Mobile (Metro) | http://localhost:8081 | Expo Metro bundler |
| Expo DevTools | http://localhost:19001 | Dev tools UI |
| PostgreSQL | localhost:5432 | DB (user: `gokon`, pass: `gokon_pass`) |

---

## 4. Cài đặt thủ công (không Docker)

### 4.1 Khởi động PostgreSQL

Cần PostgreSQL 15+ đang chạy. Tạo database:

```sql
CREATE USER gokon WITH PASSWORD 'gokon_pass';
CREATE DATABASE gokon_db OWNER gokon;
```

### 4.2 Backend

```powershell
cd apps/backend
npm install

# Copy .env.example thành .env rồi chỉnh DATABASE_URL trỏ vào localhost
# Sau đó:

npx prisma migrate deploy
npx prisma db seed      # Tùy chọn: dữ liệu mẫu

npm run start:dev       # Development (hot-reload)
# hoặc
npm run build ; npm run start:prod
```

Backend khởi động tại **http://localhost:3000**.

### 4.3 Mobile

```powershell
cd apps/mobile
npm install

# Tạo .env (hoặc đặt biến môi trường):
# EXPO_PUBLIC_API_URL=http://localhost:3000

npx expo start          # Mở Metro bundler
```

Quét QR code bằng Expo Go trên điện thoại, hoặc nhấn `a` (Android Emulator) / `i` (iOS Simulator).

---

## 5. Biến môi trường

### Backend (`apps/backend` hoặc docker-compose environment)

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | ✅ | — | Secret ký JWT access token |
| `JWT_REFRESH_SECRET` | ✅ | — | Secret ký JWT refresh token |
| `JWT_ACCESS_EXPIRES_IN` | | `15m` | Thời hạn access token |
| `JWT_REFRESH_EXPIRES_IN` | | `7d` | Thời hạn refresh token |
| `PORT` | | `3000` | Port HTTP server |
| `STORAGE_PATH` | | `./uploads` | Thư mục lưu ảnh upload |
| `CORS_ORIGINS` | | `http://localhost:8081` | Danh sách origin cho CORS |

### Mobile (`apps/mobile`)

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | ✅ | `http://localhost:3000` | URL backend API |
| `HOST_IP` | | `host.docker.internal` | LAN IP dùng trong docker-compose |

---

## 6. Test trên thiết bị thực / Expo Go

1. Điện thoại và máy tính phải **cùng mạng WiFi**.
2. Tìm IP LAN của máy tính:
   - Windows: `ipconfig` → **IPv4 Address**
   - Mac/Linux: `ifconfig` hoặc `ip a`
3. Điền `HOST_IP=<ip>` vào file `.env`.
4. Chạy lại: `docker compose up` (hoặc `docker compose restart mobile`).
5. Mở Expo Go → quét QR code hiển thị trong terminal.

---

## 7. Swagger API Docs

Truy cập **http://localhost:3000/api/docs** khi backend đang chạy.

Để test endpoint yêu cầu auth:
1. Gọi `POST /api/auth/login` để lấy `accessToken`.
2. Click **Authorize** ở góc trên phải Swagger UI.
3. Nhập `Bearer <accessToken>`.

---

## 8. Quản lý database

```powershell
# Xem dữ liệu qua Prisma Studio (GUI)
docker compose exec backend npx prisma studio
# Hoặc local:
cd apps/backend ; npx prisma studio

# Tạo migration mới (sau khi thay đổi schema.prisma)
cd apps/backend
npx prisma migrate dev --name <tên_migration>

# Apply migration lên môi trường production/staging
npx prisma migrate deploy

# Reset toàn bộ DB (XÓA DỮ LIỆU!)
npx prisma migrate reset
```

---

## 9. Chạy test

```powershell
# Backend unit tests
cd apps/backend
npm test

# Backend với coverage report
npm run test:cov

# Chạy test cụ thể
npm test -- matches.service.spec
npm test -- orders.service.spec

# Watch mode (tự chạy lại khi file thay đổi)
npm run test:watch
```

---

## 10. Các lệnh hay dùng

```powershell
# Xem log realtime
docker compose logs -f backend
docker compose logs -f mobile

# Restart một service (sau khi thay đổi code backend)
docker compose restart backend

# Rebuild image (sau khi thay đổi Dockerfile hoặc package.json)
docker compose up --build backend

# Dừng tất cả
docker compose down

# Dừng và xóa volumes (mất dữ liệu DB!)
docker compose down -v

# Vào shell trong container
docker compose exec backend sh
docker compose exec mobile sh

# Kiểm tra status containers
docker compose ps
```

---

## 11. Troubleshooting

### `JWT_ACCESS_SECRET must be set in environment`
File `.env` chưa có `JWT_ACCESS_SECRET`. Tham khảo mục [Bước 1](#bước-1--tạo-file-env).

### Mobile không kết nối được backend khi test trên điện thoại
- Kiểm tra `HOST_IP` trong `.env` đúng IP LAN chưa.
- Kiểm tra firewall không chặn port 3000 và 8081.
- Thử `ping <HOST_IP>` từ điện thoại (nếu thiết bị hỗ trợ).

### `Cannot connect to the Docker daemon`
Docker Desktop chưa khởi động. Mở Docker Desktop và đợi engine sẵn sàng.

### Port 3000 / 8081 đã bị chiếm
```powershell
# Tìm process đang dùng port
netstat -ano | findstr :3000
# Kill process
taskkill /PID <pid> /F
```

### Prisma migration failed
```powershell
# Xem trạng thái migration
docker compose exec backend npx prisma migrate status
# Nếu cần reset (môi trường dev)
docker compose exec backend npx prisma migrate reset
```

### Hot-reload mobile không hoạt động
Volume mount đôi khi không hoạt động trên Docker Desktop Windows. Thử:
```powershell
docker compose restart mobile
```
Hoặc chạy mobile trực tiếp ngoài Docker (mục [4.3](#43-mobile)).
