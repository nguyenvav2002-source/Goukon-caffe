# 🎉 Gōkon — Mobile Dating Event App

Gōkon là ứng dụng mobile tích hợp mô hình hẹn hò nhóm kết hợp vận hành quán cafe, hỗ trợ 3 định dạng:

- **1 vs 1** – Hẹn hò cặp đôi (ghép ngẫu nhiên)
- **3 vs 3** – Hẹn hò nhóm 3 người
- **5 vs 5** – Hẹn hò nhóm 5 người (ngoài trời)

---

## 🏗 Kiến trúc hệ thống

```
project-G-kon/
├── apps/
│   ├── mobile/          # React Native (Expo) – User / Staff / MC
│   └── backend/         # NestJS API
│       └── src/
│           ├── modules/
│           │   ├── auth/
│           │   ├── users/
│           │   ├── events/
│           │   ├── orders/
│           │   ├── matches/
│           │   ├── photos/
│           │   └── rooms/
│           └── prisma/
├── docker-compose.yml
└── .env.example
```

---

## 🛠 Công nghệ

| Layer    | Technology           |
| -------- | -------------------- |
| Mobile   | React Native (Expo)  |
| Backend  | NestJS               |
| Database | PostgreSQL           |
| ORM      | Prisma               |
| Auth     | JWT (Access + Refresh)|
| Container| Docker               |
| IDE      | VS Code              |

---

## 👥 Vai trò

| Role  | Mô tả                                      |
| ----- | ------------------------------------------ |
| User  | Khách tham gia event, order nước, match    |
| Staff | Nhận order theo phòng (không thấy user info)|
| MC    | Dẫn chương trình, xem kết quả match       |
| Admin | Quản trị (chưa triển khai UI – phase 2)    |

---

## 🚀 Tính năng MVP

### 1. Event Dating
- Tạo / tham gia event 1v1, 3v3, 5v5
- Auto ghép team khi thiếu người

### 2. Ưu đãi
- ✅ FREE 1 ly nước khi đăng ký event
- ✅ Giảm 50% các ly tiếp theo

### 3. Order Nước
- User order trên mobile
- Staff nhận order theo phòng (ẩn thông tin cá nhân)

### 4. Matching
- ❤️ Tim xanh / ❌ Từ chối
- Match khi cả 2 chọn ❤️
- Kết quả từ chối chỉ MC biết

### 5. Chụp Ảnh Kỷ Niệm (sau Match)
- Chỉ mở khi cả 2 đồng ý match
- Camera in-app, frame/sticker Gōkon
- Ảnh lưu hệ thống, chỉ 2 user truy cập

---

## 🗂 Bố trí không gian

| Lầu  | Loại event | Số phòng |
| ---- | ---------- | -------- |
| 1    | 1 vs 1     | 4 phòng  |
| 2    | 3 vs 3     | 4 phòng  |
| 3    | 5 vs 5     | Ngoài trời|

---

## ⚡ Khởi động

### Yêu cầu
- Node.js 18+
- Docker & Docker Compose
- Expo CLI

### Backend

```bash
cd backend
cp ../.env.example .env
# Chỉnh sửa .env với thông tin database
npm install
npx prisma migrate dev
npm run start:dev
```

### Mobile

```bash
cd frontend
npm install
npx expo start
```

### Docker (toàn bộ stack)

```bash
docker-compose up -d
```

---

## 📱 Màn hình chính (Mobile)

### User
- Home (banner, event list, promotions)
- Event Registration Flow
- Check-in & Room Assignment
- Drink Order (with discount)
- Match (❤️/❌)
- Match Success + Photo Capture

### Staff
- Login
- Order Dashboard (by room)
- Order Status Update

### MC
- Login
- Event Control Panel
- Match Results View

---

## 🔐 Bảo mật

- JWT Access Token (15 phút) + Refresh Token (7 ngày)
- Role-based guard (User / Staff / MC / Admin)
- Staff không thể xem thông tin cá nhân User
- Ảnh match: chỉ 2 user trong cặp match được truy cập
- HTTPS enforced trong production
