# Gōkon – System Architecture

> Hẹn hò · Kết nối · Trải nghiệm

---

## 1. Tổng quan hệ thống

Gōkon là ứng dụng mobile hẹn hò nhóm tại cafe, gồm 2 thành phần chính: **Backend API** (NestJS) và **Mobile App** (Expo React Native). Toàn bộ chạy trong Docker.

```
┌──────────────────────────────────────────────────────────────────┐
│                        Docker Compose                            │
│                                                                  │
│  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────┐  │
│  │   gokon_mobile  │   │  gokon_backend   │   │gokon_postgres│  │
│  │  Expo / Metro   │──▶│  NestJS :3000    │──▶│  PostgreSQL  │  │
│  │  :8081 / :19000 │   │  REST API + JWT  │   │   :5432      │  │
│  └─────────────────┘   └──────────────────┘   └──────────────┘  │
│                                │                                 │
│                        /app/uploads (volume)                     │
│                        Photos, static files                      │
└──────────────────────────────────────────────────────────────────┘
         ▲                       ▲
  Expo Go (điện thoại)     Swagger UI
  192.168.x.x:8081         :3000/api/docs
```

---

## 2. Kiến trúc Backend (NestJS)

### 2.1 Cấu trúc thư mục

```
apps/backend/src/
├── main.ts                     # Bootstrap, Swagger, global pipes
├── app.module.ts               # Root module
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts       # PrismaClient singleton
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # @CurrentUser()
│   │   └── roles.decorator.ts          # @Roles()
│   └── guards/
│       └── roles.guard.ts              # RBAC guard
└── modules/
    ├── auth/         # JWT login / register / refresh / logout
    ├── users/        # Profile, /me endpoint
    ├── events/       # Event CRUD, registration, check-in
    ├── orders/       # Menu, order creation, pricing engine
    ├── matches/      # Match choice (HEART/REJECT), auto-resolve
    ├── photos/       # Post-match photo upload
    └── rooms/        # Room management (floor/capacity)
```

### 2.2 Module Dependencies

```
AppModule
  ├── ConfigModule (global)
  ├── ThrottlerModule (60 req/min)
  ├── ServeStaticModule (/uploads)
  ├── PrismaModule
  ├── AuthModule ──────────────────────── depends on UsersModule
  ├── UsersModule
  ├── EventsModule ────────────────────── depends on PrismaModule
  ├── OrdersModule ────────────────────── depends on PrismaModule
  ├── MatchesModule ───────────────────── depends on PrismaModule
  ├── PhotosModule ────────────────────── depends on PrismaModule
  └── RoomsModule ─────────────────────── depends on PrismaModule
```

### 2.3 Authentication & Authorization

```
Request
  │
  ▼
JwtStrategy (passport-jwt)
  │   validates Bearer token → injects user into req.user
  ▼
@UseGuards(AuthGuard('jwt'))    ← xác thực
  │
  ▼
@UseGuards(RolesGuard)          ← phân quyền
  │   @Roles('MC') | @Roles('STAFF') | @Roles('ADMIN')
  ▼
Controller Handler
```

**Token flow:**
```
POST /api/auth/login
  → accessToken  (15 min, JWT)
  → refreshToken (7 days, stored in DB)

POST /api/auth/refresh
  → new accessToken + new refreshToken (rotation)

POST /api/auth/logout
  → delete all refresh tokens of user
```

### 2.4 Database Schema (ERD tóm tắt)

```
User ──────────────────┬─── EventRegistration ──── Event
 │                     │         │                    │
 │                     │    EventSession ─────────── Room
 │                     │         │
 ├── RefreshToken       ├─── Order ──── OrderItem ─── MenuItem
 │                     │
 ├── MatchChoice_ ──── Match ─────── EventSession
 │
 └── MatchPhoto
```

**Các bảng chính:**

| Bảng | Mô tả |
|------|-------|
| `users` | Tài khoản người dùng (role: USER/STAFF/MC/ADMIN) |
| `events` | Sự kiện hẹn hò (ONE_VS_ONE / THREE_VS_THREE / FIVE_VS_FIVE) |
| `event_registrations` | Đăng ký tham gia event, track free drink |
| `event_sessions` | Phiên chạy thực tế của event (1 event → nhiều sessions) |
| `rooms` | Phòng vật lý (floor 1/2/3, capacity) |
| `matches` | Cặp match trong 1 session |
| `match_choices` | Lựa chọn HEART/REJECT của từng user |
| `orders` | Đơn gọi nước của user trong session |
| `order_items` | Chi tiết item, giá gốc/giá sau ưu đãi, isFree |
| `menu_items` | Thực đơn |
| `match_photos` | Ảnh kỷ niệm sau khi match thành công |

---

## 3. Kiến trúc Mobile (Expo React Native)

### 3.1 Cấu trúc thư mục

```
apps/mobile/
├── app/                        # Expo Router file-based routing
│   ├── _layout.tsx             # Root layout (auth redirect)
│   ├── index.tsx               # HomeScreen
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx           # AuthScreen
│   ├── (mc)/
│   │   ├── _layout.tsx
│   │   └── dashboard.tsx       # MCDashboard
│   ├── (staff)/
│   │   ├── _layout.tsx
│   │   └── dashboard.tsx       # StaffDashboard
│   ├── event/[id].tsx          # EventDetailScreen
│   ├── match.tsx               # MatchScreen
│   ├── match-success.tsx       # MatchSuccessScreen
│   ├── order.tsx               # OrderScreen
│   ├── registration-success.tsx
│   ├── events.tsx              # Events list
│   ├── my-events.tsx           # User's registered events
│   └── profile.tsx             # User profile
└── src/
    ├── constants/theme.ts      # Design tokens
    ├── services/api.ts         # Axios instance + interceptors
    ├── store/authStore.ts      # Zustand auth state
    └── screens/                # Screen components
```

### 3.2 State Management

```
Zustand (authStore)
  ├── user: AuthUser | null
  ├── isLoading: boolean
  ├── login(email, password)    → POST /api/auth/login
  ├── register(data)            → POST /api/auth/register
  ├── logout()                  → POST /api/auth/logout
  └── loadSession()             → GET /api/users/me (on app start)
```

### 3.3 Navigation Flow

```
App Start
  │
  ▼
loadSession()
  ├── No token ──────────────────── (auth)/login
  └── Token valid
        ├── role = USER  ─────────── / (Home)
        ├── role = MC    ─────────── (mc)/dashboard
        └── role = STAFF ─────────── (staff)/dashboard

User Journey:
  Home → Event Detail → (Register) → Registration Success
       → Match Screen → Match Success → Camera / Home
       → Order Screen → (Place Order)

MC Journey:
  MC Dashboard → View match results per session

Staff Journey:
  Staff Dashboard → View orders per room
```

### 3.4 API Client

```
api.ts (Axios)
  ├── baseURL = EXPO_PUBLIC_API_URL ?? app.json.extra.apiBaseUrl
  ├── timeout = 10s
  ├── Request interceptor:
  │     → attach Bearer token from SecureStore
  └── Response interceptor:
        → 401 → auto refresh token → retry original request
              → if refresh fails → clear tokens (force re-login)
```

### 3.5 Design System (theme.ts)

| Token | Giá trị chính |
|-------|--------------|
| `primary` | `#FF6B9D` (Gōkon pink) |
| `secondary` | `#4A90E2` (blue accent) |
| `matched` | `#34C759` (green) |
| `heart` | `#FF3B62` (red) |
| `background` | `#FFF9FC` |
| Border radius | sm=6, md=10, lg=16, xl=24 |
| Shadow | pink-tinted (elevation 2/4/8) |

---

## 4. Infrastructure

### 4.1 Docker Services

| Service | Image | Port | Volume |
|---------|-------|------|--------|
| `gokon_postgres` | postgres:15-alpine | 5432 | `postgres_data` |
| `gokon_backend` | node:18-alpine (multi-stage) | 3000 | `uploads_data` |
| `gokon_mobile` | node:18-alpine | 8081, 19000, 19001 | `mobile_modules` |

### 4.2 Backend Dockerfile (Multi-stage)

```
Stage 1: builder
  node:18-alpine + openssl
  → npm ci
  → prisma generate
  → npm run build (tsc)

Stage 2: production
  node:18-alpine + openssl
  → npm ci --omit=dev
  → copy dist/ + .prisma/ + @prisma/ + prisma/
  → mkdir uploads/match-photos
  → CMD: prisma migrate deploy && node dist/main
```

### 4.3 Environment Variables

| Biến | Mô tả |
|------|-------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Signing key cho access token |
| `JWT_REFRESH_SECRET` | Signing key cho refresh token |
| `JWT_ACCESS_EXPIRES_IN` | TTL access token (default: 15m) |
| `JWT_REFRESH_EXPIRES_IN` | TTL refresh token (default: 7d) |
| `STORAGE_PATH` | Thư mục lưu ảnh upload |
| `HOST_IP` | LAN IP máy host (cho Expo QR code) |
| `EXPO_PUBLIC_API_URL` | URL backend mà điện thoại dùng |

---

## 5. API Endpoints

### Auth
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/api/auth/register` | – | Đăng ký tài khoản |
| POST | `/api/auth/login` | – | Đăng nhập |
| POST | `/api/auth/refresh` | – | Refresh access token |
| POST | `/api/auth/logout` | JWT | Đăng xuất |

### Users
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/api/users/me` | JWT | Lấy profile hiện tại |

### Events
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/api/events` | – | Danh sách event |
| GET | `/api/events/:id` | – | Chi tiết event |
| POST | `/api/events` | ADMIN | Tạo event |
| POST | `/api/events/:id/register` | JWT/USER | Đăng ký event |
| POST | `/api/events/:id/checkin` | JWT | Check-in vào event |

### Orders
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/api/orders/menu` | JWT | Lấy menu |
| POST | `/api/orders` | JWT/USER | Đặt nước |
| GET | `/api/orders/session/:id` | JWT/STAFF | Order theo phòng |

### Matches
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/api/matches/choice` | JWT/USER | Gửi HEART/REJECT |
| GET | `/api/matches/session/:id/results` | JWT/MC | Kết quả match |

### Photos
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/api/photos/match/:matchId` | JWT | Upload ảnh kỷ niệm |

---

## 6. Security

- **Rate limiting:** 60 req/min/IP (ThrottlerModule)
- **Password hashing:** bcrypt (salt rounds = 10)
- **JWT:** RS256-like HMAC với secret riêng cho access/refresh
- **Refresh token rotation:** mỗi lần refresh → token cũ bị xóa
- **CORS:** chỉ cho phép origins trong `CORS_ORIGINS`
- **Role-based access:** guard kiểm tra `req.user.role`
- **Input validation:** `class-validator` trên tất cả DTOs
