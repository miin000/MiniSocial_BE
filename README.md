
---

# MiniSocial Backend

Backend service cho hệ thống mạng xã hội **MiniSocial** – cung cấp API cho các chức năng như quản lý người dùng, bài viết, tương tác, và hệ thống đề xuất nội dung.

## Giới thiệu

MiniSocial là một hệ thống mạng xã hội thu nhỏ, được xây dựng nhằm mô phỏng các tính năng cốt lõi của một nền tảng social media hiện đại:

* Đăng bài viết, tương tác (like, comment)
* Theo dõi người dùng (follow)
* Feed cá nhân hóa
* Hệ thống gợi ý nội dung (Recommendation System)

Backend đóng vai trò xử lý logic nghiệp vụ, xác thực người dùng và cung cấp RESTful API cho frontend (Web/Mobile).

---

## 🛠️ Công nghệ sử dụng

* **Framework:** NestJS
* **Ngôn ngữ:** TypeScript
* **Database:** MongoDB (Mongoose)
* **Authentication:** JWT (JSON Web Token)
* **Cache (tuỳ chọn):** Redis
* **Message Queue (tuỳ chọn):** Kafka / RabbitMQ

---

## 📂 Cấu trúc thư mục

```
src/
│── modules/
│   ├── auth/              # Xác thực & phân quyền
│   ├── users/             # Quản lý người dùng
│   ├── posts/             # Bài viết
│   ├── comments/          # Bình luận
│   ├── likes/             # Like/Reaction
│   ├── follows/           # Theo dõi
│   └── recommendation/    # Hệ thống đề xuất
│
│── common/                # Utils, guards, filters
│── config/                # Cấu hình hệ thống
│── database/              # Kết nối DB
│── main.ts                # Entry point
```

---

## 🔑 Tính năng chính

### 👤 Người dùng

* Đăng ký / Đăng nhập
* Cập nhật thông tin cá nhân
* Upload avatar, cover

### 📝 Bài viết

* Tạo / sửa / xoá bài viết
* Feed bài viết theo thời gian / đề xuất
* Hỗ trợ media (ảnh, video)

### ❤️ Tương tác

* Like / Unlike bài viết
* Comment bài viết
* Thông báo (notification - nếu có)

### 👥 Kết nối

* Follow / Unfollow người dùng
* Xem danh sách follower / following

### 🤖 Recommendation System

* Gợi ý bài viết dựa trên:

  * Hành vi người dùng (like, comment)
  * Quan hệ follow
  * Độ phổ biến bài viết

---

## ⚙️ Cài đặt & chạy dự án

### 1. Clone repo

```bash
git clone https://github.com/miin000/MiniSocial_BE.git
cd MiniSocial_BE
```

### 2. Cài dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

Tạo file `.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/minisocial
JWT_SECRET=your_secret_key
```

### 4. Chạy server

```bash
npm run start:dev
```

---

## 📡 API Endpoint (ví dụ)

| Method | Endpoint        | Mô tả              |
| ------ | --------------- | ------------------ |
| POST   | /auth/register  | Đăng ký            |
| POST   | /auth/login     | Đăng nhập          |
| GET    | /users/:id      | Lấy thông tin user |
| POST   | /posts          | Tạo bài viết       |
| GET    | /posts/feed     | Lấy feed           |
| POST   | /posts/:id/like | Like bài viết      |

---

## Phân quyền

Hệ thống hỗ trợ 3 vai trò:

* **ADMIN:** Toàn quyền hệ thống
* **MODERATOR:** Quản lý nội dung
* **VIEWER / USER:** Người dùng bình thường

---

## Định hướng phát triển

* Tối ưu thuật toán recommendation
* Realtime notification (WebSocket)
* Microservices architecture
* Triển khai CI/CD

---

## Liên kết liên quan

* Frontend Web: [https://github.com/miin000/MiniSocial_nextjs](https://github.com/miin000/MiniSocial_nextjs)
* Mobile App: [https://github.com/miin000/MiniSocial_flutter](https://github.com/miin000/MiniSocial_flutter)
* Recommendation System: [https://github.com/miin000/MiniSocial_Recomendation_System](https://github.com/miin000/MiniSocial_Recomendation_System)

---

## Tác giả

* Phạm Quang Minh
