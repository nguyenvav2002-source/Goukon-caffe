# Specification — Gōkon App

**Version:** 1.2.0  
**Date:** 2026-05-02  
**Status:** Living document

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Actors & Roles](#2-actors--roles)
3. [Data Models](#3-data-models)
4. [API Endpoints](#4-api-endpoints)
   - [Auth](#41-auth)
   - [Events](#42-events)
   - [Orders](#43-orders)
   - [Matches](#44-matches)
   - [Photos](#45-photos)
   - [Users](#46-users)
5. [Business Rules](#5-business-rules)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Error Responses](#7-error-responses)
8. [Rate Limiting](#8-rate-limiting)
9. [File Upload](#9-file-upload)
10. [Mobile Screens & Navigation](#10-mobile-screens--navigation)

---

## 1. Tổng quan hệ thống

Gōkon là ứng dụng tổ chức buổi hẹn hò theo nhóm (Gōkon) tại các quán cà phê. Khách hàng đặt vé event, check-in, tham gia vòng matching, gọi nước và chụp ảnh kỷ niệm.

**Stack:**
- Backend: NestJS 10 · Node 20 · PostgreSQL 15 · Prisma ORM · JWT Auth
- Mobile: Expo SDK 52 · React Native · Expo Router · Zustand · Axios
- Infra: Docker Compose

**Base URL:** `http://localhost:3000`  
**API prefix:** `/api`  
**Interactive docs:** `/api/docs` (Swagger UI)

---

## 2. Actors & Roles

| Role | Mô tả | Quyền chính |
|---|---|---|
| `USER` | Khách hàng cuối (mặc định) | Xem event, đặt vé, gọi nước, vote match, xem kết quả |
| `STAFF` | Nhân viên quán | Xem + cập nhật trạng thái đơn nước, thanh toán |
| `MC` | Người dẫn chương trình | Tạo event, tạo match, xem kết quả toàn phiên |
| `ADMIN` | Quản trị viên | Tất cả quyền trên |

---

## 3. Data Models

### User

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | String (unique) | Tài khoản đăng nhập |
| `phone` | String? (unique) | Số điện thoại |
| `passwordHash` | String | bcrypt hash |
| `role` | Enum Role | `USER` / `STAFF` / `MC` / `ADMIN` |
| `displayName` | String | Tên hiển thị |
| `avatarUrl` | String? | URL ảnh đại diện |
| `gender` | String? | `male` / `female` / `other` |
| `birthYear` | Int? | Năm sinh |
| `bio` | String? | Mô tả bản thân |
| `isActive` | Boolean | Mặc định `true` |

### Event

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | Primary key |
| `title` | String | Tên event |
| `description` | String? | Mô tả |
| `eventType` | Enum EventType | `ONE_VS_ONE` / `THREE_VS_THREE` / `FIVE_VS_FIVE` |
| `status` | Enum EventStatus | `DRAFT` / `OPEN` / `FULL` / `IN_PROGRESS` / `COMPLETED` / `CANCELLED` |
| `price` | Decimal | Giá vé (VND) |
| `maxSlots` | Int | Số chỗ tối đa |
| `scheduledAt` | DateTime | Thời gian diễn ra |
| `freedrinkPromo` | Boolean | Có kèm 1 ly nước miễn phí |
| `_count.registrations` | Int | (computed) Số lượt đăng ký hiện tại |

**Enum EventType:**
- `ONE_VS_ONE` — 1 vs 1, tầng 1, sức chứa 2 người/phòng
- `THREE_VS_THREE` — 3 vs 3, tầng 2, sức chứa 6 người/phòng
- `FIVE_VS_FIVE` — 5 vs 5, tầng 3 ngoài trời, sức chứa 10 người/phòng

**Enum EventStatus:**
- `DRAFT` → `OPEN` → `FULL` (tự động khi hết chỗ) → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`

### EventRegistration

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | Primary key |
| `userId` | UUID FK | Người đăng ký |
| `eventId` | UUID FK | Event |
| `status` | Enum RegistrationStatus | `PENDING` / `CONFIRMED` / `CHECKED_IN` / `CANCELLED` |
| `teamSide` | Enum TeamSide? | `TEAM_A` / `TEAM_B` (gán sau check-in) |
| `checkedInAt` | DateTime? | Thời điểm check-in |

### Order

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | Primary key |
| `userId` | UUID FK | Người đặt |
| `sessionId` | String | ID phiên/phòng |
| `status` | Enum OrderStatus | `PENDING` / `PREPARING` / `SERVED` / `CANCELLED` |
| `totalAmount` | Decimal | Tổng tiền |
| `isPaid` | Boolean | Đã thanh toán chưa |
| `items` | OrderItem[] | Chi tiết các món |

### Match

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | Primary key |
| `sessionId` | String | ID phiên |
| `userAId` | UUID FK | Người A |
| `userBId` | UUID FK | Người B |
| `status` | Enum MatchStatus | `PENDING` / `MATCHED` / `NOT_MATCHED` |
| `matchedAt` | DateTime? | Thời điểm match thành công |

### MatchPhoto

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | Primary key |
| `matchId` | UUID FK | Match liên quan |
| `uploadedBy` | UUID FK | Người upload |
| `url` | String | Đường dẫn ảnh |

---

## 4. API Endpoints

> **Convention:** Tất cả request/response body dùng `Content-Type: application/json` trừ file upload dùng `multipart/form-data`.

### 4.1 Auth

#### `POST /api/auth/register`
Đăng ký tài khoản mới.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "Minh Khoa",
  "phone": "0912345678",       // optional
  "gender": "male",            // optional: "male" | "female" | "other"
  "birthYear": 2000            // optional: 1950 – 2010
}
```

**Response 201:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { "id": "...", "email": "...", "displayName": "...", "role": "USER" }
}
```

**Errors:** `409` email đã tồn tại.

---

#### `POST /api/auth/login`
Đăng nhập.

**Request body:**
```json
{ "email": "user@example.com", "password": "password123" }
```

**Response 200:** (giống register)

**Errors:** `401` sai thông tin.

---

#### `POST /api/auth/refresh`
Làm mới access token.

**Request body:**
```json
{ "refreshToken": "eyJhbGc..." }
```

**Response 200:**
```json
{ "accessToken": "eyJhbGc...", "refreshToken": "eyJhbGc..." }
```

**Errors:** `401` refresh token không hợp lệ / đã bị thu hồi.

---

#### `POST /api/auth/logout` 🔒
Thu hồi tất cả refresh token của user hiện tại.

**Response 200:** `{ "message": "Logged out" }`

---

### 4.2 Events

#### `GET /api/events`
Lấy danh sách event (public).

**Query params:**

| Param | Type | Mô tả |
|---|---|---|
| `status` | EventStatus | Lọc theo trạng thái (vd: `OPEN`) |
| `type` | EventType | Lọc theo loại (vd: `ONE_VS_ONE`) |

**Response 200:** `Event[]`

---

#### `GET /api/events/my/registrations` 🔒
Lấy danh sách event đã đăng ký của user hiện tại.

**Response 200:** `EventRegistration[]` (bao gồm thông tin event lồng nhau)

---

#### `GET /api/events/:id`
Lấy chi tiết một event (public).

**Response 200:** `Event` đầy đủ  
**Errors:** `404` không tìm thấy.

---

#### `POST /api/events` 🔒 (MC / ADMIN)
Tạo event mới.

**Request body:**
```json
{
  "title": "Gōkon Tháng 5 - 1v1",
  "description": "...",
  "eventType": "ONE_VS_ONE",
  "price": "150000",
  "maxSlots": 20,
  "scheduledAt": "2026-05-15T18:00:00.000Z",
  "freedrinkPromo": true
}
```

**Response 201:** `Event`

---

#### `POST /api/events/:id/register` 🔒
Đăng ký tham gia event.

**Response 201:** `EventRegistration`  
**Errors:** `400` đã đăng ký, event đã đầy hoặc không còn mở.

---

#### `POST /api/events/registrations/:registrationId/check-in` 🔒
Check-in tại event.

**Response 200:** `EventRegistration` (status → `CHECKED_IN`)  
**Errors:** `400` không đúng user, đã check-in rồi.

---

### 4.3 Orders

> Tất cả endpoint Orders yêu cầu JWT.

#### `GET /api/orders/menu` 🔒
Lấy danh sách đồ uống có thể gọi.

**Response 200:**
```json
[
  { "id": "...", "name": "Cà phê sữa đá", "price": "35000", "category": "coffee", "isAvailable": true }
]
```

---

#### `POST /api/orders` 🔒
Đặt đồ uống.

**Request body:**
```json
{
  "sessionId": "room-101",
  "items": [
    { "menuItemId": "uuid...", "quantity": 2 }
  ]
}
```

**Response 201:** `Order` với `items[]`

---

#### `GET /api/orders/my` 🔒
Lấy danh sách đơn hàng của user hiện tại.

**Response 200:** `Order[]`

---

#### `GET /api/orders/session/:sessionId` 🔒 (STAFF / MC / ADMIN)
Lấy tất cả đơn hàng của một phiên/phòng.

**Response 200:** `Order[]`

---

#### `GET /api/orders/staff/all` 🔒 (STAFF / MC / ADMIN)
Lấy tất cả đơn hàng cho dashboard thanh toán.

**Response 200:** `Order[]`

---

#### `PATCH /api/orders/:orderId/status` 🔒 (STAFF / ADMIN)
Cập nhật trạng thái đơn.

**Request body:**
```json
{ "status": "PREPARING" }
```

**Response 200:** `Order`

---

#### `POST /api/orders/:orderId/pay` 🔒 (STAFF / ADMIN)
Đánh dấu đơn đã thanh toán.

**Response 200:** `Order` với `isPaid: true`

---

### 4.4 Matches

> Tất cả endpoint Matches yêu cầu JWT.

#### `POST /api/matches` 🔒 (MC / ADMIN)
Tạo cặp match giữa 2 người.

**Request body:**
```json
{
  "sessionId": "room-101",
  "userAId": "uuid...",
  "userBId": "uuid..."
}
```

**Response 201:** `Match`

---

#### `POST /api/matches/choice` 🔒
User gửi lựa chọn ❤️ hoặc ❌.

**Request body:**
```json
{ "matchId": "uuid...", "choice": "HEART" }
```
`choice`: `"HEART"` | `"REJECT"`

**Response 200:**
```json
{
  "matchId": "uuid...",
  "status": "MATCHED",      // "PENDING" | "MATCHED" | "NOT_MATCHED"
  "matched": true
}
```

---

#### `GET /api/matches/:matchId/status` 🔒
Lấy trạng thái match hiện tại của user.

**Response 200:**
```json
{ "matchId": "...", "status": "PENDING", "myChoice": null, "matched": false }
```

---

#### `GET /api/matches/session/:sessionId/results` 🔒 (MC / ADMIN)
Lấy toàn bộ kết quả match trong phiên.

**Response 200:** `Match[]` kèm thông tin userA, userB

---

### 4.5 Photos

> Tất cả endpoint Photos yêu cầu JWT.

#### `POST /api/photos/match/:matchId` 🔒
Upload ảnh kỷ niệm sau khi match.

**Content-Type:** `multipart/form-data`  
**Form field:** `photo` — file ảnh (JPEG / PNG / WEBP, tối đa 5 MB)

**Response 201:**
```json
{ "id": "...", "url": "/uploads/match-photos/uuid.jpg", "matchId": "..." }
```

**Errors:** `400` sai định dạng file hoặc vượt dung lượng.

---

#### `GET /api/photos/match/:matchId` 🔒
Lấy danh sách ảnh của một match.

**Response 200:** `MatchPhoto[]`

---

### 4.6 Users

#### `GET /api/users/me` 🔒
Lấy thông tin profile user hiện tại.

**Response 200:**
```json
{
  "id": "...",
  "email": "...",
  "displayName": "...",
  "role": "USER",
  "phone": "...",
  "gender": "male",
  "birthYear": 2000,
  "bio": "...",
  "avatarUrl": null,
  "createdAt": "2026-05-01T10:00:00.000Z"
}
```

---

## 5. Business Rules

### Đăng ký event
- User chỉ được đăng ký một event có status `OPEN`.
- Không thể đăng ký lại event đã đăng ký (kể cả đã hủy trong cùng event).
- Khi số lượng registration đạt `maxSlots`, status event tự động chuyển sang `FULL`.

### Check-in
- Chỉ user sở hữu registration mới có thể check-in.
- Registration phải ở trạng thái `CONFIRMED` (không thể check-in nếu `PENDING` hoặc `CANCELLED`).
- Sau check-in: status → `CHECKED_IN`, ghi lại `checkedInAt`.

### Matching
- Mỗi cặp match do MC tạo thủ công trong phiên.
- Kết quả chỉ là `MATCHED` khi **cả hai** user chọn `HEART`.
- Một user chỉ được gửi choice một lần cho mỗi match.
- Match photo chỉ upload được sau khi match có status `MATCHED`.

### Gọi nước
- Một đơn hàng có thể chứa nhiều món khác nhau.
- `sessionId` xác định phòng/bàn của user trong event.
- Nếu event có `freedrinkPromo = true`, người dùng được giảm giá 1 ly đầu tiên (logic xử lý phía backend khi tạo order).

### Trạng thái đơn hàng
```
PENDING → PREPARING → SERVED
         ↘             ↗
           CANCELLED
```
STAFF chỉ có thể chuyển tiến (không rollback trừ CANCELLED).

---

## 6. Authentication & Authorization

### JWT Flow
```
POST /auth/login
  → accessToken (15 phút)
  + refreshToken (7 ngày, lưu DB)

Request có Bearer token → JWT Strategy validate → CurrentUser decorator inject userId

Access token hết hạn:
  POST /auth/refresh { refreshToken }
  → accessToken mới + refreshToken xoay vòng

POST /auth/logout → xóa tất cả refreshToken của user khỏi DB
```

### Guards
- `AuthGuard('jwt')` — kiểm tra Bearer token hợp lệ
- `RolesGuard` + `@Roles(...)` — kiểm tra role sau khi xác thực

### Token Storage (Mobile)
- `accessToken` → in-memory (Zustand store)
- `refreshToken` → `expo-secure-store` (encrypted storage)
- Auto-refresh: Axios interceptor tự động gọi `/auth/refresh` khi nhận `401`.

---

## 7. Error Responses

Tất cả lỗi trả về chuẩn NestJS:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

| Code | Tình huống phổ biến |
|---|---|
| `400` | Validation lỗi, business rule vi phạm |
| `401` | Token không hợp lệ / hết hạn / chưa đăng nhập |
| `403` | Không có quyền (sai role) |
| `404` | Resource không tìm thấy |
| `409` | Conflict (email trùng, đã đăng ký rồi, ...) |
| `413` | File upload vượt giới hạn (5 MB) |
| `429` | Vượt rate limit |
| `500` | Lỗi server không mong đợi |

---

## 8. Rate Limiting

- **60 request / phút** mỗi IP (áp dụng toàn bộ API).
- Khi vượt giới hạn: HTTP `429 Too Many Requests`.
- Header: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`.

---

## 9. File Upload

- **Endpoint:** `POST /api/photos/match/:matchId`
- **Field name:** `photo`
- **Định dạng chấp nhận:** `image/jpeg`, `image/png`, `image/webp`
- **Giới hạn kích thước:** 5 MB
- **Lưu tại:** `STORAGE_PATH/match-photos/<uuid><ext>` (Docker volume: `uploads_data`)
- **Phục vụ static:** Backend serve file tại `/uploads/match-photos/<filename>`

---

## 10. Mobile Screens & Navigation

### Cấu trúc route (Expo Router)

```
app/
├── _layout.tsx              # Root layout — kiểm tra auth, redirect
├── index.tsx                # Home — danh sách event đang mở
├── events.tsx               # Danh sách event lọc theo type
├── my-events.tsx            # Event đã đăng ký của tôi
├── match.tsx                # Vòng matching (chọn ❤️ / ❌)
├── match-success.tsx        # Kết quả match thành công
├── order.tsx                # Gọi nước
├── registration-success.tsx # Xác nhận đăng ký thành công
├── (auth)/
│   ├── _layout.tsx
│   └── login.tsx            # Đăng nhập / Đăng ký
├── (mc)/
│   ├── _layout.tsx
│   └── dashboard.tsx        # MC Dashboard — kết quả match phiên
├── (staff)/
│   ├── _layout.tsx
│   └── dashboard.tsx        # Staff Dashboard — quản lý đơn nước
└── event/
    └── [id].tsx             # Chi tiết event + nút đăng ký
```

### Luồng người dùng chính

```
Chưa đăng nhập
  └── (auth)/login
        ↓ đăng nhập / đăng ký
        ↓ JWT lưu vào store

USER
  └── index (Home)
        ├── → event/[id]  → đăng ký → registration-success
        ├── → events      → event/[id] ...
        └── → my-events   → (check-in) → order → match → match-success

MC
  └── (mc)/dashboard  ← kết quả tất cả match trong phiên

STAFF
  └── (staff)/dashboard  ← đơn nước + cập nhật trạng thái + thanh toán
```

### API — Screen mapping

| Screen | API calls |
|---|---|
| `index.tsx` | `GET /api/events?status=OPEN` |
| `events.tsx` | `GET /api/events?status=OPEN&type=...` |
| `event/[id].tsx` | `GET /api/events/:id` · `POST /api/events/:id/register` |
| `my-events.tsx` | `GET /api/events/my/registrations` |
| `order.tsx` | `GET /api/orders/menu` · `POST /api/orders` |
| `match.tsx` | `POST /api/matches/choice` · `GET /api/matches/:id/status` |
| `match-success.tsx` | `POST /api/photos/match/:matchId` |
| `(mc)/dashboard.tsx` | `GET /api/matches/session/:sessionId/results` |
| `(staff)/dashboard.tsx` | `GET /api/orders/session/:sessionId` · `PATCH /api/orders/:orderId/status` · `POST /api/orders/:orderId/pay` |
| `_layout.tsx` | `GET /api/users/me` |
