# Gōkon – Test Scenarios

> Tài liệu mô tả các kịch bản kiểm thử cho toàn bộ hệ thống.

---

## Mục lục

1. [Unit Tests (Backend)](#1-unit-tests-backend)
2. [Integration Tests (API)](#2-integration-tests-api)
3. [Mobile UI Tests](#3-mobile-ui-tests)
4. [End-to-End Scenarios](#4-end-to-end-scenarios)
5. [Edge Cases & Error Scenarios](#5-edge-cases--error-scenarios)
6. [Performance & Security](#6-performance--security)

---

## 1. Unit Tests (Backend)

### 1.1 MatchesService – `submitChoice`

**File:** `apps/backend/src/modules/matches/__tests__/matches.service.spec.ts`

| ID | Kịch bản | Input | Expected Output |
|----|----------|-------|----------------|
| M-01 | Cả hai chọn HEART → MATCHED | user1=HEART, user2=HEART | `status=MATCHED`, `isMatched=true` |
| M-02 | Một người chọn REJECT → NOT_MATCHED | user1=HEART, user2=REJECT | `status=NOT_MATCHED`, `isMatched=false` |
| M-03 | Cả hai chọn REJECT → NOT_MATCHED | user1=REJECT, user2=REJECT | `status=NOT_MATCHED` |
| M-04 | Gửi choice khi match đã resolve | match.status=MATCHED | throw `BadRequestException` |
| M-05 | User gửi choice 2 lần | userId đã tồn tại trong choices | throw `ConflictException` |
| M-06 | Match không tồn tại | matchId=invalid | throw `NotFoundException` |

---

### 1.2 OrdersService – Pricing Logic

**File:** `apps/backend/src/modules/orders/__tests__/orders.service.spec.ts`

| ID | Kịch bản | Input | Expected |
|----|----------|-------|----------|
| O-01 | Ly đầu miễn phí, ly tiếp -50% | 3 ly × 40.000đ, free drink chưa dùng | total=120k, discount=80k, final=40k |
| O-02 | Free drink đã dùng trong session | order trước đã có isFree=true | tất cả ly tính 50% off, không có FREE |
| O-03 | Đăng ký không có free drink (freedrink=false) | freedrink=false | tất cả ly giá gốc |
| O-04 | Menu item không tồn tại | menuItemId=invalid | throw `NotFoundException` |
| O-05 | Session không tồn tại | sessionId=invalid | throw `NotFoundException` |
| O-06 | User chưa check-in vào session | status=CONFIRMED (không phải CHECKED_IN) | throw `ForbiddenException` |
| O-07 | Quantity = 0 | quantity=0 | throw `BadRequestException` |
| O-08 | 1 ly đúng 1 lần | 1 ly × 50.000đ, free drink chưa dùng | final=0, isFree=true |

---

### 1.3 AuthService

| ID | Kịch bản | Input | Expected |
|----|----------|-------|----------|
| A-01 | Đăng ký thành công | email mới, password hợp lệ | `{ user, accessToken, refreshToken }` |
| A-02 | Email đã tồn tại | email trùng | throw `ConflictException (409)` |
| A-03 | Đăng nhập đúng | email + password đúng | `{ user, accessToken, refreshToken }` |
| A-04 | Sai mật khẩu | password sai | throw `UnauthorizedException (401)` |
| A-05 | Refresh token hợp lệ | refreshToken còn hạn | new accessToken + new refreshToken |
| A-06 | Refresh token hết hạn | refreshToken quá hạn | throw `UnauthorizedException` |
| A-07 | Refresh token đã dùng (rotation) | reuse old token | throw `UnauthorizedException` |
| A-08 | Logout xóa refresh tokens | userId hợp lệ | tất cả refresh tokens bị xóa |

---

## 2. Integration Tests (API)

> Chạy với backend thực + test database (hoặc mock Prisma)

### 2.1 Auth Flow

```
Scenario: Đăng ký → Đăng nhập → Refresh → Logout
─────────────────────────────────────────────────
POST /api/auth/register
  Body: { email, password, displayName }
  → 201: { user, accessToken, refreshToken }

POST /api/auth/login
  Body: { email, password }
  → 200: { user, accessToken, refreshToken }

POST /api/auth/refresh
  Body: { refreshToken }
  → 200: { accessToken, refreshToken }

POST /api/auth/logout (Bearer: accessToken)
  → 200: { message: 'Logged out' }

POST /api/auth/refresh (với refreshToken cũ)
  → 401: Unauthorized
```

---

### 2.2 Event Registration Flow

```
Scenario: Xem event → Đăng ký → Check-in
─────────────────────────────────────────
GET /api/events?status=OPEN
  → 200: [ ...events ]

GET /api/events/:id
  → 200: { event details, _count.registrations }

POST /api/events/:id/register (Bearer: user token)
  → 201: { registration, eventTitle, promos }

POST /api/events/:id/register (lần 2 – trùng)
  → 409: Conflict

POST /api/events/:id/checkin (Bearer: user token)
  → 200: { sessionId, roomName, floor }
```

---

### 2.3 Order Flow

```
Scenario: Lấy menu → Gọi nước → Xem order theo phòng
──────────────────────────────────────────────────────
GET /api/orders/menu (Bearer: user token)
  → 200: [ ...menuItems ]

POST /api/orders (Bearer: user token)
  Body: { sessionId, items: [{ menuItemId, quantity }] }
  → 201: { order, pricing: { total, discount, final, items } }

GET /api/orders/session/:sessionId (Bearer: staff token)
  → 200: orders grouped by room (ẩn user info)

PATCH /api/orders/:id/status (Bearer: staff token)
  Body: { status: 'SERVED' }
  → 200: { order updated }
```

---

### 2.4 Match Flow

```
Scenario: User gửi choice → Kết quả match → MC xem
────────────────────────────────────────────────────
POST /api/matches/choice (Bearer: user1 token)
  Body: { matchId, choice: 'HEART' }
  → 200: { status: 'PENDING', message: 'Đã gửi lựa chọn' }

POST /api/matches/choice (Bearer: user2 token)
  Body: { matchId, choice: 'HEART' }
  → 200: { status: 'MATCHED', isMatched: true, message: 'It'\''s a Match!' }

GET /api/matches/session/:sessionId/results (Bearer: MC token)
  → 200: [ { matchId, status, choices: [...] } ]

GET /api/matches/session/:sessionId/results (Bearer: user token)
  → 403: Forbidden
```

---

### 2.5 Photo Upload

```
Scenario: Upload ảnh kỷ niệm sau match
───────────────────────────────────────
POST /api/photos/match/:matchId (Bearer: user token)
  Body: multipart/form-data { photo: File }
  Match.status = MATCHED
  → 201: { fileUrl: '/uploads/match-photos/...' }

POST /api/photos/match/:matchId
  Match.status = PENDING
  → 400: Match chưa thành công

GET /uploads/match-photos/:filename
  → 200: image file (static serve)
```

---

## 3. Mobile UI Tests

### 3.1 Auth Screen

| ID | Thao tác | Expected |
|----|----------|----------|
| UI-A-01 | Toggle sang "Đăng ký" | Form hiện thêm trường tên, số điện thoại |
| UI-A-02 | Submit form rỗng | Alert "Thiếu thông tin" |
| UI-A-03 | Đăng nhập sai password | Alert "Đăng nhập thất bại" |
| UI-A-04 | Đăng nhập thành công | Navigate về HomeScreen |
| UI-A-05 | Đăng ký email trùng | Alert hiện message từ server |
| UI-A-06 | Password toggle (hiện/ẩn) | Text input type thay đổi |

---

### 3.2 Home Screen

| ID | Thao tác | Expected |
|----|----------|----------|
| UI-H-01 | Load trang | Hiện greeting với tên user |
| UI-H-02 | Pull to refresh | fetchEvents() gọi lại, loading indicator hiện |
| UI-H-03 | Tap event card | Navigate đến `/event/:id` |
| UI-H-04 | Tap loại "1 vs 1" | Navigate đến `/events?type=ONE_VS_ONE` |
| UI-H-05 | Còn ≤ 2 chỗ | Spots text hiển thị màu đỏ (spotsUrgent) |
| UI-H-06 | API lỗi | Console.error, không crash app |

---

### 3.3 Event Detail Screen

| ID | Thao tác | Expected |
|----|----------|----------|
| UI-E-01 | Load màn hình | Hiện thông tin event, slots bar đúng % |
| UI-E-02 | Tap "Đăng ký ngay" | Alert xác nhận với giá + ưu đãi |
| UI-E-03 | Xác nhận đăng ký thành công | Navigate đến `/registration-success` |
| UI-E-04 | Event đã đầy | Button disabled hoặc thông báo hết chỗ |
| UI-E-05 | Tap back | Navigate về màn hình trước |

---

### 3.4 Match Screen

| ID | Thao tác | Expected |
|----|----------|----------|
| UI-M-01 | Load màn hình | Hiện tên đối tác, status "Chờ lựa chọn" |
| UI-M-02 | Tap ❤️ | Alert xác nhận "Gửi tim?" |
| UI-M-03 | Xác nhận ❤️, server trả MATCHED | Tự động navigate đến `/match-success` sau 1.5s |
| UI-M-04 | Xác nhận ❤️, server trả PENDING | Status box cập nhật, buttons disabled |
| UI-M-05 | Tap ❌ → xác nhận | Choice=REJECT gửi lên server |
| UI-M-06 | Tap khi đã chọn rồi | Không gửi request lần 2 |

---

### 3.5 Order Screen

| ID | Thao tác | Expected |
|----|----------|----------|
| UI-O-01 | Load màn hình không có sessionId | Alert "Không tìm thấy phiên event" |
| UI-O-02 | Tap "+" vào menu item | Qty tăng 1, giỏ hàng cập nhật |
| UI-O-03 | Tap "−" về 0 | Item bị xóa khỏi cart |
| UI-O-04 | Ly đầu tiên | Giá hiển thị "FREE" |
| UI-O-05 | Ly tiếp theo | Giá hiển thị 50% giá gốc |
| UI-O-06 | Tap "Đặt ngay" | POST /api/orders, navigate về khi thành công |

---

### 3.6 Match Success Screen

| ID | Thao tác | Expected |
|----|----------|----------|
| UI-MS-01 | Load màn hình | Animation scale in, hiện tên 2 người |
| UI-MS-02 | Tap "Mở camera" | Xin quyền camera nếu chưa có |
| UI-MS-03 | Camera permission từ chối | Alert hướng dẫn cấp quyền |
| UI-MS-04 | Chụp ảnh thành công | Upload ảnh, hiện thông báo đã lưu |
| UI-MS-05 | Tap "Về trang chủ" | Navigate về `/` |

---

## 4. End-to-End Scenarios

### E2E-01: Full User Journey – Hẹn hò 1v1

```
1. User A đăng ký tài khoản
2. User B đăng ký tài khoản
3. Admin tạo event ONE_VS_ONE (maxSlots=2)
4. User A đăng ký event → nhận xác nhận + ưu đãi
5. User B đăng ký event → event FULL
6. MC tạo session, assign room
7. User A check-in → nhận sessionId
8. User B check-in → nhận sessionId
9. User A gọi 2 ly nước:
   - Ly 1: FREE (0đ)
   - Ly 2: 50% off
10. Staff xem order tại phòng → update status SERVED
11. MC tạo match (User A – User B)
12. User A chọn ❤️ HEART
13. User B chọn ❤️ HEART → status = MATCHED
14. User A thấy "It's a Match!" → mở camera chụp ảnh
15. MC dashboard hiện kết quả: 1 Match ✅
```

---

### E2E-02: Full MC Journey

```
1. MC login (role=MC)
2. MC xem dashboard → danh sách match của session
3. MC thấy match PENDING → chờ cả 2 user chọn
4. MC thấy match MATCHED → hiện ❤️ cả 2
5. MC thấy match NOT_MATCHED → hiện ❌ (chỉ MC biết)
```

---

### E2E-03: Staff Journey

```
1. Staff login (role=STAFF)
2. Staff xem orders theo phòng
3. Staff thấy đơn PENDING → chuẩn bị
4. Staff update → PREPARING → SERVED
5. User info ẩn (chỉ thấy room + items)
```

---

### E2E-04: Event Full → Auto reject registration

```
1. Event maxSlots=2, hiện có 2 registrations
2. User C cố đăng ký
3. → 409: "Event đã đủ người"
4. Event status tự động chuyển FULL
```

---

## 5. Edge Cases & Error Scenarios

### 5.1 Authentication

| Kịch bản | Expected |
|----------|----------|
| Access token giả mạo | 401 Unauthorized |
| Token hết hạn (15 phút) | 401 → mobile tự refresh |
| Gọi API bảo vệ không có token | 401 Unauthorized |
| Gọi endpoint MC với role USER | 403 Forbidden |
| Refresh token reuse sau logout | 401 Unauthorized |

### 5.2 Rate Limiting

| Kịch bản | Expected |
|----------|----------|
| Gửi > 60 request/phút từ 1 IP | 429 Too Many Requests |
| Sau 1 phút | Reset, request tiếp theo thành công |

### 5.3 Data Integrity

| Kịch bản | Expected |
|----------|----------|
| Đăng ký event 2 lần với cùng user | 409 Conflict |
| Gửi match choice 2 lần | 409 Conflict |
| Upload ảnh cho match chưa MATCHED | 400 Bad Request |
| Order với sessionId không tồn tại | 404 Not Found |
| Quantity âm trong order | 400 Bad Request (validation) |

### 5.4 Mobile

| Kịch bản | Expected |
|----------|----------|
| Mất mạng giữa chừng | Axios timeout sau 10s, hiện lỗi |
| App cold start, token còn hạn | loadSession() → auto-login |
| App cold start, token hết hạn | refresh → auto-login; nếu fail → /login |
| SecureStore không khả dụng | catch block xử lý, redirect login |

---

## 6. Performance & Security

### 6.1 Performance

| Test | Mục tiêu |
|------|---------|
| GET /api/events response time | < 200ms (với index) |
| POST /api/auth/login | < 500ms (bcrypt compare) |
| Upload ảnh (1MB) | < 3s |
| Mobile cold start | < 3s |
| Match result page load | < 300ms |

### 6.2 Security Checklist

| # | Kiểm tra | Trạng thái |
|---|----------|-----------|
| 1 | SQL Injection – Prisma parameterized queries | ✅ |
| 2 | XSS – input validation với class-validator | ✅ |
| 3 | Password không lưu plaintext (bcrypt) | ✅ |
| 4 | JWT secret không expose trong log | ✅ |
| 5 | Rate limiting bật | ✅ |
| 6 | CORS whitelist | ✅ |
| 7 | Refresh token rotation (không reuse) | ✅ |
| 8 | File upload: chỉ accept image/* | ✅ |
| 9 | Static file serve qua /uploads (không traversal) | ✅ |
| 10 | Role guard trên tất cả MC/Staff endpoints | ✅ |

---

## Chạy Unit Tests

```bash
cd apps/backend
npm test                  # chạy tất cả
npm test -- --watch       # watch mode
npm test -- --coverage    # báo cáo coverage
```

**Kết quả hiện tại:**
```
PASS  matches.service.spec.ts  (M-01 → M-05)
PASS  orders.service.spec.ts   (O-01 → O-03)
```
