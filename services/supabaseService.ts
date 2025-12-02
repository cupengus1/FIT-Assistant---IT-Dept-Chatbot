
import { supabase, isConfigured } from '../lib/supabaseClient';
import { StudentProfile, Procedure, Ticket, Notification, TicketStatus, Account, Role, Message, SystemLog } from '../types';

// --- AUTHENTICATION & ACCOUNTS ---
export const authenticateUser = async (username: string, password: string): Promise<Account | null> => {
  if (!isConfigured) return null;

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('username', username)
    .eq('password', password) // Note: In production, use hashed passwords!
    .single();

  if (error) {
     console.log("Auth Error:", error.message);
  }

  if (error || !data) return null;

  return {
    username: data.username,
    role: data.role as Role,
    fullName: data.full_name,
    studentId: data.student_id
  };
};

export const fetchAccounts = async (): Promise<Account[]> => {
  if (!isConfigured) return [];
  const { data, error } = await supabase.from('accounts').select('*');
  if (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }
  return data.map((a: any) => ({
    username: a.username,
    password: a.password, // Be careful exposing this
    role: a.role as Role,
    fullName: a.full_name,
    studentId: a.student_id
  }));
};

export const addAccountToDB = async (account: Account) => {
  if (!isConfigured) return;
  const dbAccount = {
    username: account.username,
    password: account.password,
    role: account.role,
    full_name: account.fullName,
    student_id: account.studentId
  };
  const { error } = await supabase.from('accounts').insert([dbAccount]);
  if (error) throw error;
};

export const updateAccountInDB = async (account: Account) => {
  if (!isConfigured) return;
  const updates: any = {
    role: account.role,
    full_name: account.fullName,
    student_id: account.studentId
  };
  // Only update password if provided and not empty
  if (account.password) {
    updates.password = account.password;
  }
  
  const { error } = await supabase.from('accounts').update(updates).eq('username', account.username);
  if (error) throw error;
};

export const deleteAccountFromDB = async (username: string) => {
  if (!isConfigured) return;
  const { error } = await supabase.from('accounts').delete().eq('username', username);
  if (error) throw error;
};


// --- STUDENTS ---
export const fetchStudents = async (): Promise<StudentProfile[]> => {
  if (!isConfigured) return [];
  
  const { data, error } = await supabase.from('students').select('*');
  if (error) {
    console.error('Error fetching students:', error.message || error);
    return [];
  }
  // Map DB columns (snake_case) to Typescript (camelCase)
  return data.map((s: any) => ({
    id: s.id,
    name: s.name,
    gender: s.gender,
    dob: s.dob,
    placeOfBirth: s.place_of_birth,
    address: s.address,
    identityCard: s.identity_card,
    email: s.email,
    phone: s.phone,
    status: s.status,
    classId: s.class_id,
    className: s.class_name,
    majorCode: s.major_code,
    majorName: s.major_name,
    specialization: s.specialization
  }));
};

export const addStudentToDB = async (student: StudentProfile) => {
  if (!isConfigured) return;

  const dbStudent = {
    id: student.id,
    name: student.name,
    gender: student.gender,
    dob: student.dob,
    place_of_birth: student.placeOfBirth,
    address: student.address,
    identity_card: student.identityCard,
    email: student.email,
    phone: student.phone,
    status: student.status,
    class_id: student.classId,
    class_name: student.className,
    major_code: student.majorCode,
    major_name: student.majorName,
    specialization: student.specialization
  };
  const { error } = await supabase.from('students').insert([dbStudent]);
  if (error) {
     console.log("Add Student Error:", error);
     throw error;
  }
};

export const updateStudentInDB = async (student: StudentProfile) => {
  if (!isConfigured) return;

  const dbStudent = {
    name: student.name,
    gender: student.gender,
    dob: student.dob,
    place_of_birth: student.placeOfBirth,
    address: student.address,
    identity_card: student.identityCard,
    email: student.email,
    phone: student.phone,
    status: student.status,
    class_id: student.classId,
    class_name: student.className,
    major_code: student.majorCode,
    major_name: student.majorName,
    specialization: student.specialization
  };
  const { error } = await supabase.from('students').update(dbStudent).eq('id', student.id);
  if (error) {
      console.log("Update Student Error:", error);
      throw error;
  }
};

export const deleteStudentFromDB = async (id: string) => {
  if (!isConfigured) return;
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) {
      console.log("Delete Student Error:", error);
      throw error;
  }
};

// --- PROCEDURES ---
export const fetchProcedures = async (): Promise<Procedure[]> => {
  if (!isConfigured) return [];

  const { data, error } = await supabase.from('procedures').select('*');
  if (error) {
    console.error('Error fetching procedures:', error.message || error);
    return [];
  }
  return data.map((p: any) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    category: p.category,
    requiredForms: p.required_forms || [],
    variables: p.variables || [],
    exportTemplate: p.export_template || undefined
  }));
};

export const addProcedureToDB = async (proc: Procedure) => {
  if (!isConfigured) return;

  const dbProc = {
    id: proc.id,
    title: proc.title,
    content: proc.content,
    category: proc.category,
    required_forms: proc.requiredForms,
    variables: proc.variables,
    export_template: proc.exportTemplate
  };
  const { error } = await supabase.from('procedures').insert([dbProc]);
  if (error) {
      console.log("Add Procedure Error:", error);
      throw error;
  }
};

export const updateProcedureInDB = async (proc: Procedure) => {
  if (!isConfigured) return;

  const dbProc = {
    title: proc.title,
    content: proc.content,
    category: proc.category,
    required_forms: proc.requiredForms,
    variables: proc.variables,
    export_template: proc.exportTemplate
  };
  const { error } = await supabase.from('procedures').update(dbProc).eq('id', proc.id);
  if (error) {
      console.log("Update Procedure Error:", error);
      throw error;
  }
};

export const deleteProcedureFromDB = async (id: string) => {
  if (!isConfigured) return;
  const { error } = await supabase.from('procedures').delete().eq('id', id);
  if (error) {
      console.log("Delete Procedure Error:", error);
      throw error;
  }
};

// --- TICKETS ---
export const fetchTickets = async (): Promise<Ticket[]> => {
  if (!isConfigured) return [];

  const { data, error } = await supabase.from('tickets').select('*').order('date_created', { ascending: false });
  if (error) {
    console.error('Error fetching tickets:', error.message || error);
    return [];
  }
  return data.map((t: any) => ({
    id: t.id,
    title: t.title,
    studentName: t.student_name,
    studentId: t.student_id,
    type: t.type,
    status: t.status as TicketStatus,
    dateCreated: t.date_created,
    description: t.description,
    rejectionReason: t.rejection_reason,
    variables: t.variables,
    formValues: t.form_values
  }));
};

export const addTicketToDB = async (ticket: Ticket) => {
  if (!isConfigured) return;

  const dbTicket = {
    id: ticket.id,
    title: ticket.title,
    student_name: ticket.studentName,
    student_id: ticket.studentId,
    type: ticket.type,
    status: ticket.status,
    date_created: ticket.dateCreated,
    description: ticket.description,
    variables: ticket.variables,
    form_values: ticket.formValues
  };
  const { error } = await supabase.from('tickets').insert([dbTicket]);
  if (error) throw error;
};

export const updateTicketStatusInDB = async (id: string, status: TicketStatus, reason?: string) => {
  if (!isConfigured) return;

  const updates: any = { status };
  if (reason) updates.rejection_reason = reason;
  
  const { error } = await supabase.from('tickets').update(updates).eq('id', id);
  if (error) throw error;
};

// --- NOTIFICATIONS ---
export const fetchNotifications = async (): Promise<Notification[]> => {
  if (!isConfigured) return [];

  const { data, error } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false });
  if (error) {
    // Silent fail for notifications or just return empty
    return [];
  }
  return data.map((n: any) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.is_read,
    timestamp: new Date(n.timestamp),
    ticketId: n.ticket_id
  }));
};

export const addNotificationToDB = async (notif: Notification) => {
  if (!isConfigured) return;

  const dbNotif = {
    id: notif.id,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    is_read: notif.isRead,
    timestamp: notif.timestamp.toISOString(),
    ticket_id: notif.ticketId
  };
  const { error } = await supabase.from('notifications').insert([dbNotif]);
  if (error) console.error('Error adding notification:', error.message || error);
};

export const markNotificationReadInDB = async (id: string) => {
  if (!isConfigured) return;
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
};

export const clearNotificationsInDB = async () => {
  if (!isConfigured) return;
  await supabase.from('notifications').update({ is_read: true }).neq('is_read', true);
};

// --- CHAT HISTORY ---
export const fetchChatHistory = async (userId: string): Promise<Message[]> => {
  if (!isConfigured) return [];

  const { data, error } = await supabase
    .from('chat_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching chat history:', error.message);
    return [];
  }

  return data.map((log: any) => ({
    id: log.id,
    role: log.role as 'user' | 'model',
    text: log.message,
    timestamp: new Date(log.timestamp)
  }));
};

export const saveChatMessage = async (userId: string, msg: Message) => {
  if (!isConfigured) return;

  const dbLog = {
    user_id: userId,
    role: msg.role,
    message: msg.text,
    timestamp: msg.timestamp.toISOString()
  };

  const { error } = await supabase.from('chat_logs').insert([dbLog]);
  if (error) {
    console.error('Error saving chat message:', error.message);
  }
};

export const clearChatHistory = async (userId: string) => {
  if (!isConfigured || !userId) return; // Add check for userId
  
  const { error } = await supabase
    .from('chat_logs')
    .delete()
    .eq('user_id', userId);
    
  if (error) {
     console.error('Error clearing chat history:', error.message);
     throw error;
  }
};

// --- SYSTEM LOGS ---
export const fetchSystemLogs = async (): Promise<SystemLog[]> => {
  if (!isConfigured) return [];

  // Limit to last 50 entries
  const { data, error } = await supabase
    .from('system_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(50);

  if (error) {
    // Gracefully handle missing table error (42P01) or schema cache issues
    const msg = error.message?.toLowerCase() || '';
    if (
        error.code === '42P01' || 
        msg.includes('schema cache') || 
        msg.includes('does not exist') ||
        msg.includes('could not find the table')
    ) {
        console.warn('System logs table missing or schema cache not refreshed. Run migration script.');
        return [];
    }
    console.error('Error fetching system logs:', error.message);
    return [];
  }

  return data.map((log: any) => ({
    id: log.id,
    action: log.action,
    userName: log.user_name || 'Hệ thống',
    details: log.details,
    type: log.type || 'info',
    timestamp: log.timestamp
  }));
};

export const logSystemActivity = async (
  action: string, 
  details: string, 
  user?: { id: string, name: string },
  type: 'info' | 'warning' | 'error' | 'success' = 'info'
) => {
  if (!isConfigured) return;

  const dbLog = {
    action,
    user_id: user?.id || null,
    user_name: user?.name || 'Hệ thống',
    details,
    type
  };

  const { error } = await supabase.from('system_logs').insert([dbLog]);
  if (error) {
    // Suppress error if table is missing or schema cache is stale
    const msg = error.message?.toLowerCase() || '';
    if (
        error.code === '42P01' || 
        msg.includes('schema cache') || 
        msg.includes('does not exist') ||
        msg.includes('could not find the table')
    ) {
        return;
    }
    console.error('Error logging system activity:', error.message);
  }
};
