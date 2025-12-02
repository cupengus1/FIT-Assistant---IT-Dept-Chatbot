

export enum Role {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
}

export interface Account {
  username: string;
  password?: string; // Optional for display
  role: Role;
  fullName: string;
  studentId?: string;
}

export interface StudentProfile {
  // Personal Info
  id: string; // MSSV
  name: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  dob: string; // YYYY-MM-DD
  placeOfBirth: string; // Nơi sinh
  address: string; // Địa chỉ (Tỉnh/TP)
  identityCard: string; // CCCD/CMND
  email: string;
  phone: string;
  status: 'Đang học' | 'Bảo lưu' | 'Tốt nghiệp' | 'Thôi học';

  // Class/Major Info
  classId: string; // Mã lớp (e.g., 1CTT22A1)
  className: string; // Tên lớp (e.g., ĐH Công nghệ thông tin 2022)
  majorCode: string; // Mã ngành (e.g., 7480201)
  majorName: string; // Tên ngành (e.g., Công nghệ thông tin)
  specialization?: string; // Chuyên ngành (e.g., An toàn thông tin)
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export enum TicketStatus {
  PENDING = 'Chờ xử lý',
  IN_PROGRESS = 'Đang xử lý',
  COMPLETED = 'Hoàn thành',
  REJECTED = 'Từ chối'
}

export interface ProcedureVariable {
  name: string;   // Internal key, e.g., 'course_code'
  label: string;  // Display label, e.g., 'Mã học phần'
  required: boolean;
  dataType?: 'text' | 'date' | 'number'; // New field for input type
}

export interface Ticket {
  id: string;
  title: string;
  studentName: string;
  studentId: string | null;
  type: string;
  status: TicketStatus;
  dateCreated: string;
  description: string;
  rejectionReason?: string; // Reason is required when rejected
  
  // Fields for Structured Data & Export
  variables?: ProcedureVariable[]; 
  formValues?: Record<string, string>;
}

export interface Procedure {
  id: string;
  title: string;
  content: string; // The knowledge base content
  category: string;
  requiredForms: string[];
  variables?: ProcedureVariable[]; // List of dynamic fields to fill
  exportTemplate?: string; // HTML Template for exporting
}

export interface ChartData {
  name: string;
  value: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  timestamp: Date;
  ticketId?: string;
}

export interface SystemLog {
  id: string;
  action: string;
  userName: string;
  details: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
}
