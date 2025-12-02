

-- HƯỚNG DẪN SỬ DỤNG:
-- 1. Copy toàn bộ nội dung bên dưới (Ctrl + A, Ctrl + C).
-- 2. Dán vào Supabase SQL Editor và nhấn RUN.

-- ==========================================
-- 0. SỬA LỖI THIẾU CỘT (QUAN TRỌNG)
-- ==========================================
-- Chạy dòng này để thêm cột export_template vào bảng procedures nếu nó chưa tồn tại (Sửa lỗi ERROR: 42703)
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS export_template text;

-- ==========================================
-- 1. TẠO BẢNG DỮ LIỆU (TABLES) - CHẠY ĐẦU TIÊN
-- ==========================================

-- 1.1. Bảng Sinh viên
create table if not exists public.students (
  id text primary key,
  name text not null,
  gender text,
  dob text,
  place_of_birth text,
  address text,
  identity_card text,
  email text,
  phone text,
  status text,
  class_id text,
  class_name text,
  major_code text,
  major_name text,
  specialization text
);

-- 1.2. Bảng Quy trình
create table if not exists public.procedures (
  id text primary key,
  title text not null,
  content text,
  category text,
  required_forms jsonb,
  variables jsonb,
  export_template text -- Cột mới chứa mẫu HTML xuất đơn
);

-- 1.3. Bảng Hồ sơ (Tickets)
create table if not exists public.tickets (
  id text primary key,
  title text not null,
  student_name text,
  student_id text,
  type text,
  status text,
  date_created text,
  description text,
  rejection_reason text,
  variables jsonb,
  form_values jsonb
);

-- 1.4. Bảng Thông báo
create table if not exists public.notifications (
  id text primary key,
  title text,
  message text,
  type text,
  is_read boolean default false,
  timestamp timestamptz default now(),
  ticket_id text
);

-- 1.5. Bảng Tài khoản
create table if not exists public.accounts (
  username text primary key,
  password text not null,
  role text not null,
  full_name text,
  student_id text
);

-- 1.6. Bảng Lịch sử Chat
create table if not exists public.chat_logs (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  role text not null, -- 'user' hoặc 'model'
  message text not null,
  timestamp timestamptz default now()
);

-- 1.7. Bảng Nhật ký Hệ thống (MỚI)
create table if not exists public.system_logs (
  id uuid default gen_random_uuid() primary key,
  action text not null,
  user_id text,
  user_name text,
  details text,
  type text default 'info', -- 'info', 'warning', 'error', 'success'
  timestamp timestamptz default now()
);

-- ==========================================
-- 2. THIẾT LẬP BẢO MẬT (RLS & POLICIES)
-- ==========================================

-- Bật RLS
alter table public.students enable row level security;
alter table public.procedures enable row level security;
alter table public.tickets enable row level security;
alter table public.notifications enable row level security;
alter table public.accounts enable row level security;
alter table public.chat_logs enable row level security;
alter table public.system_logs enable row level security;

-- Xóa Policy cũ nếu tồn tại (để tránh lỗi trùng lặp khi chạy lại)
drop policy if exists "Public Access Students" on public.students;
drop policy if exists "Public Access Procedures" on public.procedures;
drop policy if exists "Public Access Tickets" on public.tickets;
drop policy if exists "Public Access Notifications" on public.notifications;
drop policy if exists "Public Access Accounts" on public.accounts;
drop policy if exists "Public Access Chat Logs" on public.chat_logs;
drop policy if exists "Public Access System Logs" on public.system_logs;

-- Tạo Policy mới (Cho phép truy cập công khai để Demo)
create policy "Public Access Students" on public.students for all using (true) with check (true);
create policy "Public Access Procedures" on public.procedures for all using (true) with check (true);
create policy "Public Access Tickets" on public.tickets for all using (true) with check (true);
create policy "Public Access Notifications" on public.notifications for all using (true) with check (true);
create policy "Public Access Accounts" on public.accounts for all using (true) with check (true);
create policy "Public Access Chat Logs" on public.chat_logs for all using (true) with check (true);
create policy "Public Access System Logs" on public.system_logs for all using (true) with check (true);

-- ==========================================
-- 3. NẠP DỮ LIỆU MẪU (SEED DATA)
-- ==========================================

-- Sinh viên mẫu
insert into public.students (id, name, gender, dob, place_of_birth, address, identity_card, email, phone, status, class_id, class_name, major_code, major_name, specialization)
values 
('22004138', 'Huỳnh Bảo Duy', 'Nam', '2004-10-19', 'Cần Thơ', 'Vĩnh Long', '086204007635', '22004138@st.vlute.edu.vn', '0584873200', 'Đang học', '1CTT22A1', 'ĐH Công nghệ thông tin 2022', '7480201', 'Công nghệ thông tin', 'An toàn thông tin (Chương trình Đại trà)')
on conflict (id) do nothing;

-- Tài khoản mẫu (Admin & Student)
insert into public.accounts (username, password, role, full_name, student_id)
values
('admin', 'admin123', 'ADMIN', 'Quản Trị Viên', null),
('22004138', '123456', 'STUDENT', 'Huỳnh Bảo Duy', '22004138')
on conflict (username) do nothing;

-- Quy trình mẫu
insert into public.procedures (id, title, category, content, required_forms, variables)
values
('proc_01', 'Xin giấy xác nhận sinh viên', 'Hành chính', 'Sinh viên mang thẻ sinh viên đến phòng Công tác sinh viên để nộp đơn. Thời gian xử lý: 2-3 ngày làm việc.', '["Mau_Don_Xac_Nhan.pdf"]', '[{"name": "reason", "label": "Lý do xin", "dataType": "text", "required": true}, {"name": "quantity", "label": "Số lượng bản", "dataType": "number", "required": true}]'),
('proc_02', 'Phúc khảo điểm thi', 'Đào tạo', 'Nộp đơn phúc khảo tại Văn phòng Khoa trong vòng 7 ngày sau khi công bố điểm.', '["Don_Phuc_Khao.docx"]', '[{"name": "subject_id", "label": "Mã học phần", "dataType": "text", "required": true}, {"name": "exam_date", "label": "Ngày thi", "dataType": "date", "required": true}]'),
('proc_03', 'Xin bảng điểm', 'Đào tạo', 'Liên hệ phòng đào tạo hoặc nộp đơn online qua cổng thông tin.', '[]', '[{"name": "semester", "label": "Học kỳ cần in", "dataType": "text", "required": true}]'),
('proc_04', 'Đăng ký phòng Lab', 'Cơ sở vật chất', 'Đăng ký trước 3 ngày. Ghi rõ mục đích sử dụng.', '["Phieu_Muon_Phong.pdf"]', '[{"name": "room_id", "label": "Phòng cần mượn", "dataType": "text", "required": true}, {"name": "use_date", "label": "Ngày sử dụng", "dataType": "date", "required": true}, {"name": "purpose", "label": "Mục đích", "dataType": "text", "required": true}]')
on conflict (id) do nothing;

-- ==========================================
-- 4. CẬP NHẬT DỮ LIỆU MẪU IN ẤN
-- ==========================================

-- Chạy các lệnh này để điền mẫu in ấn mặc định cho các quy trình mẫu (nếu chưa có)
UPDATE public.procedures 
SET export_template = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page { size: A4; margin: 2cm; } body { font-family: "Times New Roman", Times, serif; padding: 40px; width: 100%; margin: 0; line-height: 1.6; box-sizing: border-box; } .header { text-align: center; margin-bottom: 30px; } .nation { font-weight: bold; font-size: 14pt; text-transform: uppercase; margin: 0; } .motto { font-weight: bold; font-size: 14pt; margin: 5px 0 0 0; text-decoration: underline; } .title { font-weight: bold; font-size: 16pt; text-transform: uppercase; margin-top: 40px; text-align: center; } .content { margin-top: 30px; font-size: 13pt; text-align: justify; } .signature-section { margin-top: 50px; display: flex; justify-content: space-between; } .signature-box { text-align: center; width: 45%; }</style></head><body><div class="header"><p class="nation">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p><p class="motto">Độc lập - Tự do - Hạnh phúc</p></div><h2 class="title">ĐƠN XIN GIẤY XÁC NHẬN SINH VIÊN</h2><div class="content"><p><strong>Kính gửi:</strong> Ban Chủ nhiệm Khoa Công nghệ Thông tin</p><p>Tôi tên là: <strong>{{studentName}}</strong></p><p>Mã số sinh viên: <strong>{{studentId}}</strong></p><p>Tôi làm đơn này xin trình bày nội dung sau:</p><div style="margin-left: 20px;"><p><strong>Lý do xin:</strong> {{reason}}</p><p><strong>Số lượng bản:</strong> {{quantity}}</p></div><p>Kính mong Quý Khoa xem xét và giải quyết yêu cầu của tôi.</p><p>Tôi xin chân thành cảm ơn.</p></div><div class="signature-section"><div class="signature-box"></div><div class="signature-box"><p><i>{{date}}</i></p><p><strong>Người làm đơn</strong></p><br><br><br><p>{{studentName}}</p></div></div></body></html>'
WHERE id = 'proc_01';

UPDATE public.procedures 
SET export_template = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page { size: A4; margin: 2cm; } body { font-family: "Times New Roman", Times, serif; padding: 40px; width: 100%; margin: 0; line-height: 1.6; box-sizing: border-box; } .header { text-align: center; margin-bottom: 30px; } .nation { font-weight: bold; font-size: 14pt; text-transform: uppercase; margin: 0; } .motto { font-weight: bold; font-size: 14pt; margin: 5px 0 0 0; text-decoration: underline; } .title { font-weight: bold; font-size: 16pt; text-transform: uppercase; margin-top: 40px; text-align: center; } .content { margin-top: 30px; font-size: 13pt; text-align: justify; } .signature-section { margin-top: 50px; display: flex; justify-content: space-between; } .signature-box { text-align: center; width: 45%; }</style></head><body><div class="header"><p class="nation">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p><p class="motto">Độc lập - Tự do - Hạnh phúc</p></div><h2 class="title">ĐƠN PHÚC KHẢO ĐIỂM THI</h2><div class="content"><p><strong>Kính gửi:</strong> Ban Chủ nhiệm Khoa Công nghệ Thông tin</p><p>Tôi tên là: <strong>{{studentName}}</strong></p><p>Mã số sinh viên: <strong>{{studentId}}</strong></p><p>Tôi làm đơn này xin phúc khảo điểm học phần sau:</p><div style="margin-left: 20px;"><p><strong>Mã học phần:</strong> {{subject_id}}</p><p><strong>Ngày thi:</strong> {{exam_date}}</p></div><p>Kính mong Quý Khoa xem xét và chấm lại bài thi của tôi.</p><p>Tôi xin chân thành cảm ơn.</p></div><div class="signature-section"><div class="signature-box"></div><div class="signature-box"><p><i>{{date}}</i></p><p><strong>Người làm đơn</strong></p><br><br><br><p>{{studentName}}</p></div></div></body></html>'
WHERE id = 'proc_02';

UPDATE public.procedures 
SET export_template = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page { size: A4; margin: 2cm; } body { font-family: "Times New Roman", Times, serif; padding: 40px; width: 100%; margin: 0; line-height: 1.6; box-sizing: border-box; } .header { text-align: center; margin-bottom: 30px; } .nation { font-weight: bold; font-size: 14pt; text-transform: uppercase; margin: 0; } .motto { font-weight: bold; font-size: 14pt; margin: 5px 0 0 0; text-decoration: underline; } .title { font-weight: bold; font-size: 16pt; text-transform: uppercase; margin-top: 40px; text-align: center; } .content { margin-top: 30px; font-size: 13pt; text-align: justify; } .signature-section { margin-top: 50px; display: flex; justify-content: space-between; } .signature-box { text-align: center; width: 45%; }</style></head><body><div class="header"><p class="nation">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p><p class="motto">Độc lập - Tự do - Hạnh phúc</p></div><h2 class="title">ĐƠN ĐĂNG KÝ PHÒNG LAB</h2><div class="content"><p><strong>Kính gửi:</strong> Ban Chủ nhiệm Khoa Công nghệ Thông tin</p><p>Tôi tên là: <strong>{{studentName}}</strong></p><p>Mã số sinh viên: <strong>{{studentId}}</strong></p><p>Tôi làm đơn này xin đăng ký sử dụng phòng thực hành:</p><div style="margin-left: 20px;"><p><strong>Phòng cần mượn:</strong> {{room_id}}</p><p><strong>Ngày sử dụng:</strong> {{use_date}}</p><p><strong>Mục đích:</strong> {{purpose}}</p></div><p>Tôi cam kết sử dụng phòng đúng mục đích và giữ gìn vệ sinh chung.</p><p>Tôi xin chân thành cảm ơn.</p></div><div class="signature-section"><div class="signature-box"></div><div class="signature-box"><p><i>{{date}}</i></p><p><strong>Người làm đơn</strong></p><br><br><br><p>{{studentName}}</p></div></div></body></html>'
WHERE id = 'proc_04';

-- ==========================================
-- 5. TẠO LIÊN KẾT KHÓA NGOẠI (FOREIGN KEYS) - ĐÃ SỬA LỖI
-- ==========================================

-- 5.1. Accounts liên kết với Students
-- Xóa constraint cũ nếu có để tránh lỗi 42710
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS fk_accounts_students;

ALTER TABLE public.accounts
ADD CONSTRAINT fk_accounts_students
FOREIGN KEY (student_id)
REFERENCES public.students (id)
ON DELETE SET NULL;

-- 5.2. Notifications liên kết với Tickets
-- Xóa constraint cũ nếu có
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS fk_notifications_tickets;

ALTER TABLE public.notifications
ADD CONSTRAINT fk_notifications_tickets
FOREIGN KEY (ticket_id)
REFERENCES public.tickets (id)
ON DELETE CASCADE;

-- 5.3. Tickets liên kết với Students
-- Xóa constraint cũ nếu có
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS fk_tickets_students;

-- Sửa dữ liệu rác nếu có trước khi tạo khóa ngoại (an toàn)
UPDATE public.tickets SET student_id = NULL WHERE student_id NOT IN (SELECT id FROM public.students);

ALTER TABLE public.tickets
ADD CONSTRAINT fk_tickets_students
FOREIGN KEY (student_id)
REFERENCES public.students (id)
ON DELETE CASCADE;

-- 5.4. (QUAN TRỌNG) Reload Schema Cache
NOTIFY pgrst, 'reload schema';