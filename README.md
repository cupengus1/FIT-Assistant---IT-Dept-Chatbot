# 🎓 FIT Assistant - Chatbot Hỗ Trợ Khoa CNTT
---

## 📋 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Tính Năng Chính](#-tính-năng-chính)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Cài Đặt](#-cài-đặt)
- [Cấu Hình](#-cấu-hình)
- [Sử Dụng](#-sử-dụng)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Database Setup](#-database-setup)
- [Đóng Góp](#-đóng-góp)
- [License](#-license)

---

## 🎯 Giới Thiệu

**FIT Assistant** là một hệ thống chatbot AI thông minh được xây dựng để hỗ trợ sinh viên và quản trị viên tại Khoa Công Nghệ Thông Tin. Ứng dụng tích hợp Google Gemini AI để cung cấp các câu trả lời tự động, hướng dẫn thủ tục hành chính, và quản lý hồ sơ sinh viên một cách hiệu quả.

### ✨ Đặc điểm nổi bật

- 🤖 **AI-Powered Chatbot**: Sử dụng Google Gemini AI để trả lời câu hỏi tự động
- 📝 **Quản lý hồ sơ**: Tạo và theo dõi các hồ sơ xin cấp giấy tờ, chứng nhận
- 👥 **Phân quyền người dùng**: Hệ thống phân quyền Admin và Student
- 📊 **Dashboard quản trị**: Thống kê và báo cáo chi tiết
- 🔔 **Thông báo realtime**: Cập nhật trạng thái hồ sơ tức thời
- 📚 **Quản lý tài liệu**: Hệ thống lưu trữ và quản lý quy trình thủ tục

---

## 🚀 Tính Năng Chính

### Dành cho Sinh viên 👨‍🎓

- ✅ **Chat với AI**: Hỏi đáp về các thủ tục hành chính, quy định của khoa
- ✅ **Tạo hồ sơ**: Nộp đơn xin cấp giấy tờ (bảng điểm, chứng nhận sinh viên, v.v.)
- ✅ **Theo dõi hồ sơ**: Xem trạng thái và lịch sử các hồ sơ đã nộp
- ✅ **Thông báo**: Nhận thông báo khi hồ sơ được xử lý

### Dành cho Quản trị viên 👨‍💼

- ✅ **Dashboard**: Thống kê tổng quan về hồ sơ, sinh viên
- ✅ **Quản lý sinh viên**: Thêm, sửa, xóa thông tin sinh viên
- ✅ **Quản lý tài khoản**: Tạo và quản lý tài khoản người dùng
- ✅ **Quản lý hồ sơ**: Duyệt, từ chối, hoàn thành các hồ sơ
- ✅ **Quản lý tài liệu**: CRUD các quy trình, thủ tục hành chính
- ✅ **Nhật ký hoạt động**: Theo dõi các thay đổi trong hệ thống

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend

- **React 19.2** - Thư viện UI component
- **TypeScript 5.8** - Ngôn ngữ lập trình type-safe
- **Vite 6.2** - Build tool và dev server
- **Lucide React** - Icon library
- **React Markdown** - Render markdown content
- **Recharts** - Thư viện biểu đồ

### Backend & Database

- **Supabase** - Backend-as-a-Service (PostgreSQL database, Authentication, Storage)
- **Google Gemini AI** - Large Language Model cho chatbot

### Styling

- **Custom CSS** - Vanilla CSS với thiết kế hiện đại

---

## 📦 Cài Đặt

### Yêu cầu hệ thống

- **Node.js** (v18 hoặc cao hơn)
- **npm** hoặc **yarn**
- Tài khoản **Supabase** (miễn phí)
- **Google Gemini API Key**

### Các bước cài đặt

1. **Clone repository**

```bash
git clone https://github.com/cupengus1/FIT-Assistant---IT-Dept-Chatbot.git
cd FIT-Assistant---IT-Dept-Chatbot
```

2. **Cài đặt dependencies**

```bash
npm install
```

3. **Cấu hình môi trường**

Tạo file `.env.local` trong thư mục gốc:

```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Thiết lập Database**

Xem hướng dẫn chi tiết trong file [DATABASE_SETUP.md](./DATABASE_SETUP.md)

5. **Chạy ứng dụng**

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

---

## ⚙️ Cấu Hình

### Lấy Gemini API Key

1. Truy cập [Google AI Studio](https://ai.google.dev/)
2. Đăng nhập bằng tài khoản Google
3. Tạo API key mới
4. Copy và paste vào `.env.local`

### Cấu hình Supabase

1. Tạo project mới tại [Supabase](https://supabase.com/)
2. Lấy Project URL và Anon Key từ Settings > API
3. Chạy các script SQL trong [DATABASE_SETUP.md](./DATABASE_SETUP.md)
4. Cập nhật thông tin vào `.env.local`

---

## 💻 Sử Dụng

### Đăng nhập

#### Tài khoản Admin mặc định:
- **Username**: `admin`
- **Password**: `admin`

#### Tài khoản Sinh viên:
Sinh viên đăng nhập bằng tài khoản được tạo trong hệ thống bởi Admin.

### Các chức năng chính

#### 1. Chat với AI (Cả Admin và Student)
- Click vào tab "Chat" trên sidebar
- Nhập câu hỏi về thủ tục, quy định
- AI sẽ trả lời dựa trên knowledge base

#### 2. Tạo hồ sơ (Student)
- Trong giao diện Chat, click "Tạo hồ sơ mới"
- Chọn loại hồ sơ (Bảng điểm, Chứng nhận SV, v.v.)
- Điền thông tin và submit

#### 3. Quản lý hồ sơ (Admin)
- Vào tab "Hồ sơ" để xem danh sách
- Click vào hồ sơ để xem chi tiết
- Duyệt hoặc từ chối hồ sơ

#### 4. Quản lý sinh viên (Admin)
- Vào tab "Sinh viên"
- Thêm, sửa, xóa thông tin sinh viên
- Xuất danh sách CSV

---

## 📁 Cấu Trúc Dự Án

```
FIT-Assistant/
├── components/              # React components
│   ├── AccountManagement.tsx    # Quản lý tài khoản
│   ├── AdminDashboard.tsx       # Dashboard admin
│   ├── ChatInterface.tsx        # Giao diện chat
│   ├── CreateTicketModal.tsx    # Modal tạo hồ sơ
│   ├── DocumentManagement.tsx   # Quản lý tài liệu
│   ├── LoginPage.tsx            # Trang đăng nhập
│   ├── NotificationCenter.tsx   # Trung tâm thông báo
│   ├── Sidebar.tsx              # Thanh điều hướng
│   ├── StudentManagement.tsx    # Quản lý sinh viên
│   ├── TicketDetailModal.tsx    # Chi tiết hồ sơ
│   └── TicketList.tsx           # Danh sách hồ sơ
├── services/                # Business logic
│   ├── geminiService.ts         # Tích hợp Gemini AI
│   └── supabaseService.ts       # Database operations
├── lib/                     # Utilities
│   └── supabaseClient.ts        # Supabase client config
├── App.tsx                  # Main application
├── types.ts                 # TypeScript types
├── constants.ts             # App constants
├── index.tsx                # Entry point
├── DATABASE_SETUP.md        # Hướng dẫn setup database
├── .env.local               # Environment variables
└── package.json             # Dependencies
```

---

## 🗄️ Database Setup

Xem hướng dẫn chi tiết về cấu trúc database và cách thiết lập trong file:
👉 [DATABASE_SETUP.md](./DATABASE_SETUP.md)

### Các bảng chính:

- `students` - Thông tin sinh viên
- `accounts` - Tài khoản đăng nhập
- `tickets` - Hồ sơ sinh viên
- `procedures` - Quy trình thủ tục
- `notifications` - Thông báo hệ thống
- `system_logs` - Nhật ký hoạt động

---

## 🤝 Đóng Góp

Mọi đóng góp đều được chào đón! Nếu bạn muốn đóng góp:

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

---

## 📝 License

Dự án này được phát triển cho mục đích học tập và nghiên cứu.

---

## 📧 Liên Hệ

Nếu có bất kỳ câu hỏi hoặc góp ý nào, vui lòng tạo issue trên GitHub.

---

<div align="center">

**Được xây dựng với ❤️ bởi nhóm phát triển FIT Assistant**

[⬆ Về đầu trang](#-fit-assistant---chatbot-hỗ-trợ-khoa-cntt)

</div>
