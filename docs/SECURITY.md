# Security & Phân quyền — Gōkon App

---

## Mục lục

1. [Roles](#1-roles)
2. [Ma trận phân quyền API](#2-ma-trận-phân-quyền-api)
3. [JWT Authentication Flow](#3-jwt-authentication-flow)
4. [Guard & Decorator trong code](#4-guard--decorator-trong-code)
5. [Phân quyền trên Mobile](#5-phân-quyền-trên-mobile)
6. [Cách thêm quyền mới](#6-cách-thêm-quyền-mới)
7. [Bảo mật bổ sung](#7-bảo-mật-bổ-sung)

---

## 1. Roles

Hệ thống có 4 role, được lưu trong bảng `users.role` (Prisma enum `Role`):

| Role | Mô tả | Tạo bởi |
|---|---|---|
| `USER` | Khách hàng cuối — mặc định khi đăng ký | Tự đăng ký |
| `STAFF` | Nhân viên quán — quản lý đồ uống & thanh toán | Admin gán thủ công trong DB |
| `MC` | Người dẫn chương trình — tạo event, tạo match | Admin gán thủ công trong DB |
| `ADMIN` | Quản trị viên — toàn quyền | Seed / gán thủ công trong DB |

> **Lưu ý:** Không có API tự upgrade role. Việc gán `STAFF` / `MC` / `ADMIN` phải làm trực tiếp qua Prisma Studio hoặc seed script.

---

## 2. Ma trận phân quyền API

Ký hiệu: ✅ Được phép | ❌ Không được phép | 🔒 Cần JWT (bất kỳ role nào)

### Auth

| Endpoint | PUBLIC | USER | STAFF | MC | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| `POST /api/auth/register` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/auth/login` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/auth/refresh` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/auth/logout` | ❌ | 🔒 | 🔒 | 🔒 | 🔒 |

### Events

| Endpoint | PUBLIC | USER | STAFF | MC | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| `GET /api/events` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/events/:id` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/events` (tạo event) | ❌ | ❌ | ❌ | ✅ | ✅ |
| `POST /api/events/:id/register` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/events/registrations/:id/check-in` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/events/my/registrations` | ❌ | ✅ | ✅ | ✅ | ✅ |

### Orders

| Endpoint | PUBLIC | USER | STAFF | MC | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| `GET /api/orders/menu` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/orders` (đặt nước) | ❌ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/orders/my` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/orders/staff/all` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `GET /api/orders/session/:sessionId` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `PATCH /api/orders/:id/status` | ❌ | ❌ | ✅ | ❌ | ✅ |
| `POST /api/orders/:id/pay` | ❌ | ❌ | ✅ | ❌ | ✅ |

### Matches

| Endpoint | PUBLIC | USER | STAFF | MC | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| `POST /api/matches` (tạo cặp) | ❌ | ❌ | ❌ | ✅ | ✅ |
| `POST /api/matches/choice` (vote ❤️/❌) | ❌ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/matches/:id/status` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/matches/session/:id/results` | ❌ | ❌ | ❌ | ✅ | ✅ |

### Photos

| Endpoint | PUBLIC | USER | STAFF | MC | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| `POST /api/photos/match/:matchId` (upload) | ❌ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/photos/match/:matchId` | ❌ | ✅ | ✅ | ✅ | ✅ |

### Users

| Endpoint | PUBLIC | USER | STAFF | MC | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| `GET /api/users/me` | ❌ | ✅ | ✅ | ✅ | ✅ |

### Rooms

| Endpoint | PUBLIC | USER | STAFF | MC | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| `GET /api/rooms` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/rooms/:id` | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 3. JWT Authentication Flow

```
┌─────────────┐      POST /api/auth/login       ┌─────────────┐
│   Client    │ ─────────────────────────────►  │   Backend   │
│             │  { email, password }             │             │
│             │ ◄─────────────────────────────  │             │
│             │  { accessToken (15m),            │             │
│             │    refreshToken (7d),            │             │
│             │    user: { id, role, ... } }     │             │
└─────────────┘                                 └─────────────┘

Mỗi request tiếp theo:
┌─────────────┐   Authorization: Bearer <accessToken>  ┌─────────────┐
│   Client    │ ──────────────────────────────────────► │  JwtGuard   │
│             │                                         │  ↓          │
│             │                                         │ JwtStrategy │
│             │                                         │  validate() │
│             │                                         │  → DB check │
│             │ ◄────────────────────────────────────── │  → req.user │
└─────────────┘       Response data                    └─────────────┘

Khi accessToken hết hạn (401):
┌─────────────┐   POST /api/auth/refresh            ┌─────────────┐
│   Axios     │ ──────────────────────────────────► │   Backend   │
│ interceptor │  { refreshToken }                   │             │
│             │ ◄────────────────────────────────── │             │
│             │  { accessToken mới, refreshToken }  │             │
└─────────────┘   Tự động retry request gốc         └─────────────┘
```

**Lưu trữ token phía mobile:**
- `accessToken` → in-memory (Zustand store, mất khi app close)
- `refreshToken` → `expo-secure-store` (encrypted, tồn tại giữa các session)

---

## 4. Guard & Decorator trong code

### Các guard hiện có

| Guard | File | Chức năng |
|---|---|---|
| `AuthGuard('jwt')` | `@nestjs/passport` | Xác thực Bearer token, populate `req.user` |
| `RolesGuard` | `src/common/guards/roles.guard.ts` | Kiểm tra role sau khi đã auth |

> `RolesGuard` **phải dùng sau** `AuthGuard('jwt')`. Nếu dùng `RolesGuard` mà không có `AuthGuard`, `req.user` sẽ là `undefined` và guard throw `ForbiddenException`.

### Decorator

| Decorator | File | Dùng như |
|---|---|---|
| `@Roles(...)` | `src/common/decorators/roles.decorator.ts` | `@Roles(Role.MC, Role.ADMIN)` |
| `@CurrentUser(field?)` | `src/common/decorators/current-user.decorator.ts` | `@CurrentUser('id') userId: string` |

### Ví dụ áp dụng lên controller

```typescript
// Endpoint chỉ MC và ADMIN được tạo event
@Post()
@UseGuards(AuthGuard('jwt'), RolesGuard)   // thứ tự quan trọng
@Roles(Role.MC, Role.ADMIN)
@ApiBearerAuth()
async createEvent(@Body() dto: CreateEventDto) { ... }

// Endpoint mọi user đã đăng nhập đều được gọi
@Get('menu')
@UseGuards(AuthGuard('jwt'))               // không cần RolesGuard
async getMenu() { ... }

// Endpoint public — không cần guard nào
@Get()
async listEvents(@Query('status') status?: EventStatus) { ... }

// Lấy userId từ token đã validated
@Post(':id/register')
@UseGuards(AuthGuard('jwt'))
async register(
  @Param('id') eventId: string,
  @CurrentUser('id') userId: string,       // lấy từ req.user.id
) { ... }
```

### JwtStrategy — validate logic

```typescript
// src/modules/auth/jwt.strategy.ts
async validate(payload: JwtPayload) {
  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id, email, role, displayName, isActive },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedException('User not found or deactivated');
  }

  return user; // → req.user
}
```

---

## 5. Phân quyền trên Mobile

### Redirect tự động theo role (Root Layout)

```typescript
// apps/mobile/app/_layout.tsx
if (user.role === 'STAFF') {
  router.replace('/(staff)/dashboard');
} else if (user.role === 'MC') {
  router.replace('/(mc)/dashboard');
} else {
  router.replace('/');   // USER → Home
}
```

### Route groups theo role

| Route group | Role có quyền truy cập | Layout file |
|---|---|---|
| `/(auth)/` | Chưa đăng nhập | `app/(auth)/_layout.tsx` |
| `/` (root) | USER, STAFF, MC, ADMIN | `app/_layout.tsx` |
| `/(staff)/` | STAFF, ADMIN | `app/(staff)/_layout.tsx` |
| `/(mc)/` | MC, ADMIN | `app/(mc)/_layout.tsx` |

### Guard phía client — kiểm tra role trước khi render

```typescript
// Ví dụ bảo vệ màn hình STAFF
const { user } = useAuthStore();
if (user?.role !== 'STAFF' && user?.role !== 'ADMIN') {
  return router.replace('/');
}
```

---

## 6. Cách thêm quyền mới

### Thêm role mới vào backend

1. Cập nhật enum `Role` trong `apps/backend/prisma/schema.prisma`:
   ```prisma
   enum Role {
     USER
     STAFF
     MC
     ADMIN
     CASHIER   // ← thêm mới
   }
   ```

2. Tạo migration:
   ```powershell
   cd apps/backend
   npx prisma migrate dev --name add_cashier_role
   ```

3. Dùng trong controller:
   ```typescript
   @Roles(Role.CASHIER, Role.ADMIN)
   ```

### Thêm endpoint có phân quyền mới

```typescript
@Get('report')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.MC, Role.ADMIN)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get session report (MC/Admin only)' })
async getReport(@CurrentUser('id') userId: string) {
  // logic...
}
```

### Gán role cho user (hiện tại — thủ công)

```powershell
# Qua Prisma Studio
docker compose exec backend npx prisma studio
# Mở bảng users → chỉnh cột role

# Hoặc qua psql
docker compose exec postgres psql -U gokon -d gokon_db \
  -c "UPDATE users SET role = 'STAFF' WHERE email = 'nhanvien@example.com';"
```

---

## 7. Bảo mật bổ sung

### Rate Limiting
- **60 request / phút** mỗi IP (toàn bộ API, cấu hình trong `app.module.ts`)
- Khi vượt: `429 Too Many Requests`

### Password Hashing
- Dùng `bcrypt` với **salt rounds = 10**
- Không bao giờ trả `passwordHash` trong response (Prisma `select` luôn loại trừ field này)

### File Upload (Photos)
- Chỉ chấp nhận: `image/jpeg`, `image/png`, `image/webp`
- Giới hạn kích thước: **5 MB**
- Tên file được tạo bằng `uuid()` — tránh path traversal
- Lưu ngoài web root (`/app/uploads/`) — không serve trực tiếp qua Express static

### CORS
- Origin được whitelist qua biến môi trường `CORS_ORIGINS`
- Mặc định: `http://localhost:8081` (Expo web)
- Credentials: `true` (cho phép gửi cookie nếu cần)

### JWT Security
- Access token: **15 phút** — giới hạn thiệt hại nếu bị lộ
- Refresh token: **7 ngày**, lưu trong DB với `expiresAt`
- Logout thu hồi **tất cả** refresh token của user (không chỉ session hiện tại)
- `isActive = false` → tài khoản bị khóa, JwtStrategy từ chối ngay cả khi token còn hạn

### Input Validation
- NestJS `ValidationPipe` với `whitelist: true` — loại bỏ field không khai báo trong DTO
- `forbidNonWhitelisted: true` — throw lỗi nếu gửi thêm field lạ
- Class-validator decorators trên tất cả DTO

### SQL Injection
- Toàn bộ query đi qua **Prisma ORM** — parameterized queries, không raw SQL tùy ý
