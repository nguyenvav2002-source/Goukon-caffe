# Tổng hợp file và ngôn ngữ sử dụng

**Project:** Gōkon App  
**Ngày tổng hợp:** 2026-05-03

---

## 1. Tổng quan

Project `project-G-kon` là monorepo gồm 2 ứng dụng chính:

| Khu vực | Thư mục | Ngôn ngữ / Công nghệ chính | Mục đích |
|---|---|---|---|
| Backend | `apps/backend` | TypeScript, NestJS, Prisma | API server, auth, events, orders, matches, photos |
| Mobile | `apps/mobile` | TypeScript, TSX, React Native, Expo | Ứng dụng mobile cho User, Staff, MC |
| Database | `apps/backend/prisma` | Prisma Schema, PostgreSQL | Mô hình dữ liệu và seed data |
| Documentation | `docs` | Markdown | Tài liệu đặc tả, kiến trúc, bảo mật, test |
| Infrastructure | root | YAML, Dockerfile, env | Docker Compose, cấu hình container và môi trường |

---

## 2. Thống kê file theo định dạng

| Định dạng | Số lượng | Ngôn ngữ / Vai trò |
|---|---:|---|
| `.ts` | 39 | TypeScript backend, service, controller, DTO, store, API client |
| `.tsx` | 25 | React Native screen, Expo Router route, layout |
| `.json` | 8 | Cấu hình package, TypeScript, Expo |
| `.png` | 8 | Asset hình ảnh mobile và prototype |
| `.md` | 7 | Tài liệu project |
| `.js` | 2 | Cấu hình Expo/Babel |
| Không có đuôi | 2 | Dockerfile |
| `.yml` | 1 | Docker Compose |
| `.html` | 1 | Prototype UI |
| `.prisma` | 1 | Prisma database schema |
| `.example` | 1 | File môi trường mẫu |

---

## 3. Backend

**Thư mục:** `apps/backend`

**Ngôn ngữ chính:** TypeScript  
**Framework:** NestJS 10  
**Runtime:** Node.js 20  
**ORM:** Prisma  
**Database:** PostgreSQL 15

Các nhóm file chính:

| Nhóm file | Vai trò |
|---|---|
| `src/main.ts` | Entry point của backend |
| `src/app.module.ts` | Module gốc của NestJS |
| `src/app.controller.ts` | Controller gốc |
| `src/modules/auth` | Đăng ký, đăng nhập, refresh token, JWT strategy |
| `src/modules/users` | API profile user hiện tại |
| `src/modules/events` | Event, đăng ký event, check-in |
| `src/modules/orders` | Menu nước, tạo order, staff dashboard, thanh toán |
| `src/modules/matches` | Tạo match, chọn HEART/REJECT, xem kết quả |
| `src/modules/photos` | Upload và lấy ảnh match |
| `src/modules/rooms` | Quản lý room/session |
| `src/common` | Guard, decorator dùng chung |
| `prisma/schema.prisma` | Database schema |
| `prisma/seed.ts` | Dữ liệu mẫu |

Lệnh chạy backend:

```bash
cd apps/backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Lệnh test backend:

```bash
cd apps/backend
npm test
```

---

## 4. Mobile

**Thư mục:** `apps/mobile`

**Ngôn ngữ chính:** TypeScript và TSX  
**Framework:** React Native  
**Platform:** Expo SDK 52  
**Routing:** Expo Router  
**State management:** Zustand  
**HTTP client:** Axios

Các nhóm file chính:

| Nhóm file | Vai trò |
|---|---|
| `app/_layout.tsx` | Root layout, kiểm tra auth và điều hướng |
| `app/index.tsx` | Home screen |
| `app/events.tsx` | Danh sách event |
| `app/event/[id].tsx` | Chi tiết event |
| `app/my-events.tsx` | Event đã đăng ký |
| `app/order.tsx` | Gọi nước |
| `app/match.tsx` | Vòng matching |
| `app/match-success.tsx` | Match thành công và ảnh kỷ niệm |
| `app/(auth)` | Màn hình đăng nhập/đăng ký |
| `app/(mc)` | Dashboard MC |
| `app/(staff)` | Dashboard Staff |
| `src/screens` | Component màn hình chính |
| `src/services/api.ts` | Axios client gọi backend |
| `src/store/authStore.ts` | Lưu trạng thái đăng nhập |
| `src/constants/theme.ts` | Theme dùng chung |
| `assets` | Icon, splash, favicon |
| `prototype` | Prototype HTML và hình minh họa |

Lệnh chạy mobile:

```bash
cd apps/mobile
npm install
npm run start
```

Chạy theo nền tảng:

```bash
npm run android
npm run ios
npm run web
```

---

## 5. Infrastructure và cấu hình

| File | Ngôn ngữ / Định dạng | Vai trò |
|---|---|---|
| `docker-compose.yml` | YAML | Chạy toàn bộ stack gồm PostgreSQL, backend, mobile |
| `apps/backend/Dockerfile` | Dockerfile | Build backend container |
| `apps/mobile/Dockerfile` | Dockerfile | Build mobile/Expo container |
| `.env.example` | Environment sample | Biến môi trường mẫu |
| `.gitignore` | Git config | Loại trừ file không commit |

Lệnh chạy toàn bộ stack:

```bash
docker-compose up -d
```

Các service chính:

| Service | Port | Mục đích |
|---|---:|---|
| `postgres` | `5432` | PostgreSQL database |
| `backend` | `3000` | NestJS API |
| `mobile` | `8081`, `19000`, `19001` | Expo Metro bundler và dev tools |

---

## 6. Tài liệu

**Thư mục:** `docs`

| File | Nội dung |
|---|---|
| `SPEC.md` | Đặc tả chức năng, API, data model, business rules |
| `ARCHITECTURE.md` | Kiến trúc hệ thống |
| `SECURITY.md` | Bảo mật, auth, authorization |
| `TECHNICAL_INTRODUCTION.md` | Giới thiệu kỹ thuật |
| `TEST_SCENARIOS.md` | Kịch bản kiểm thử |
| `CHANGELOG.md` | Lịch sử thay đổi |
| `FILE_LANGUAGE_SUMMARY.md` | Tổng hợp file và ngôn ngữ sử dụng |

---

## 7. Kết luận

Project hiện sử dụng chủ yếu:

- **TypeScript / TSX** cho backend NestJS và mobile React Native.
- **Prisma Schema** cho mô hình database PostgreSQL.
- **Markdown** cho tài liệu kỹ thuật.
- **YAML và Dockerfile** cho hạ tầng Docker.
- **JSON và JavaScript** cho cấu hình package, Expo, Babel.

Luồng chạy chính của project là:

```text
Mobile Expo App
  -> gọi API qua Axios
  -> NestJS Backend
  -> Prisma ORM
  -> PostgreSQL Database
```
