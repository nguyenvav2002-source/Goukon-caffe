# Changelog

Tất cả thay đổi đáng chú ý của dự án **Gōkon** được ghi lại ở đây.

Format theo [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

> Các tính năng đang phát triển hoặc chưa release.

### Planned
- Admin UI (phase 2)
- Push notifications khi có match
- Leaderboard / điểm tương thích
- Thanh toán online (VNPay / MoMo)

---

## [1.2.0] – 2026-05-02

### Added
- **Docker full-stack:** Thêm service `gokon_mobile` vào `docker-compose.yml`, toàn bộ stack chạy bằng 1 lệnh `docker compose up --build`
- **`apps/mobile/Dockerfile`:** Expo Metro bundler chạy trong container (port 8081, 19000, 19001)
- **`apps/mobile/.dockerignore`:** Loại trừ `node_modules`, `.expo`, `prototype` khỏi build context
- **`apps/mobile/app.config.js`:** Dynamic Expo config, đọc `EXPO_PUBLIC_API_URL` từ env var
- **`HOST_IP` env var:** Cấu hình LAN IP để điện thoại thật quét QR code kết nối qua Expo Go
- **Volume `mobile_modules`:** node_modules được cache trong named volume, tránh rebuild mỗi lần mount source
- **`docs/ARCHITECTURE.md`:** Tài liệu kiến trúc hệ thống đầy đủ
- **`docs/TEST_SCENARIOS.md`:** Kịch bản kiểm thử (unit, integration, UI, E2E, security)
- **`docs/CHANGELOG.md`:** File changelog này

### Changed
- **`apps/mobile/src/services/api.ts`:** Ưu tiên `process.env.EXPO_PUBLIC_API_URL` trước `Constants.expoConfig.extra.apiBaseUrl`
- **`.env.example`:** Thêm hướng dẫn biến `HOST_IP`

---

## [1.1.0] – 2026-05-02

### Added
- **`apps/mobile/prototype/index.html`:** HTML prototype tương tác đầy đủ 8 màn hình UI (mở trong trình duyệt không cần build)
  - Screen 1: Đăng nhập / Đăng ký (toggle interactive)
  - Screen 2: Trang chủ (events, promo banner, type filter)
  - Screen 3: Chi tiết sự kiện (slots bar, CTA)
  - Screen 4: Đăng ký thành công (promo card, bước tiếp theo)
  - Screen 5: Lựa chọn match (❤️ / ❌ interactive)
  - Screen 6: Match thành công (couple display, camera section)
  - Screen 7: Gọi nước / Menu (cart với pricing logic)
  - Screen 8: MC Dashboard (stats, danh sách match)
- **`apps/mobile/app/events.tsx`:** Màn hình danh sách sự kiện với filter theo loại
- **`apps/mobile/app/my-events.tsx`:** Màn hình lịch sử đăng ký của user
- **`apps/mobile/app/profile.tsx`:** Màn hình hồ sơ cá nhân
- **`apps/mobile/.gitignore`:** Thêm `expo-env.d.ts` vào gitignore

### Changed
- **`apps/mobile/tsconfig.json`:** Nâng `ignoreDeprecations` từ `"5.0"` → `"6.0"` để tắt cảnh báo `moduleResolution=node10` deprecated trên TypeScript mới

---

## [1.0.1] – 2026-05-02

### Fixed
- **`apps/mobile/package.json`:** Nâng `expo-secure-store` từ `~13.0.0` → `~14.0.0` để tương thích Expo SDK 52 (fix lỗi `deleteValueWithKeyAsync is not a function`)
- **`apps/mobile/src/store/authStore.ts`:** Bọc `deleteItemAsync` trong try/catch riêng tại `loadSession()` để catch block không throw khi native module chưa khả dụng
- **`apps/mobile/src/services/api.ts`:** Bọc `deleteItemAsync` trong try/catch tại interceptor 401 để tránh crash khi clear token thất bại

---

## [1.0.0] – 2026-05-01

### Added – Backend (NestJS)

- **Auth module:** Đăng ký, đăng nhập, JWT access token (15m) + refresh token (7d), rotation, logout
- **Users module:** `GET /api/users/me` lấy profile
- **Events module:**
  - CRUD sự kiện (ONE_VS_ONE / THREE_VS_THREE / FIVE_VS_FIVE)
  - Đăng ký tham gia event với free drink entitlement
  - Check-in vào event session
  - Auto-detect event FULL khi đủ slots
- **Orders module:**
  - Menu items quản lý
  - Pricing engine: ly đầu MIỄN PHÍ + 50% off các ly tiếp theo
  - Order tracking (PENDING → PREPARING → SERVED)
  - Staff view orders theo phòng (ẩn thông tin cá nhân)
- **Matches module:**
  - Tạo cặp match trong session
  - Submit HEART / REJECT choice
  - Auto-resolve: MATCHED (cả 2 ❤️) hoặc NOT_MATCHED (có ❌)
  - MC xem kết quả toàn session
- **Photos module:** Upload ảnh kỷ niệm sau khi match thành công
- **Rooms module:** Quản lý phòng theo floor (1=1v1, 2=3v3, 3=5v5)
- **Prisma schema:** Đầy đủ 10 model với relations, enums, indexes
- **Seed data:** Rooms, menu items, test accounts (admin/mc/staff/user)
- **Swagger UI:** Tại `/api/docs`
- **Rate limiting:** 60 req/min/IP
- **CORS:** Whitelist origins từ env
- **Static file serve:** `/uploads` cho ảnh match
- **Unit tests:**
  - `matches.service.spec.ts`: 5 test cases
  - `orders.service.spec.ts`: 3 test cases

### Added – Mobile (Expo React Native)

- **Auth flow:** Đăng nhập / Đăng ký với form validation
- **Home screen:** Danh sách events, promo banner, type filter
- **Event detail screen:** Thông tin chi tiết, slots bar, nút đăng ký
- **Registration success screen:** Hiển thị ưu đãi + hướng dẫn bước tiếp
- **Match screen:** HEART / REJECT choice với animation
- **Match success screen:** Hiển thị cặp match + camera in-app để chụp ảnh
- **Order screen:** Menu, cart, pricing hiển thị FREE / -50%
- **MC Dashboard:** Thống kê match, danh sách kết quả
- **Staff Dashboard:** Xem orders theo phòng
- **Zustand auth store:** Session persistence với SecureStore
- **Axios interceptors:** Auto-attach token + auto-refresh on 401
- **Design system:** theme.ts với Gōkon pink, tokens đầy đủ (colors, spacing, radius, shadows)
- **Expo Router:** File-based routing với protected layouts theo role

### Added – Infrastructure

- **`docker-compose.yml`:** Services `gokon_postgres` + `gokon_backend`
- **`apps/backend/Dockerfile`:** Multi-stage build (builder + production), OpenSSL, prisma migrate on startup
- **`.env.example`:** Template biến môi trường
- **`README.md`:** Tổng quan dự án, kiến trúc, tính năng

---

[Unreleased]: https://github.com/Nguyenph2002/project-G-kon/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/Nguyenph2002/project-G-kon/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Nguyenph2002/project-G-kon/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/Nguyenph2002/project-G-kon/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Nguyenph2002/project-G-kon/releases/tag/v1.0.0
