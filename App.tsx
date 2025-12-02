
import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';

import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import TicketList from './components/TicketList';
import AdminDashboard from './components/AdminDashboard';
import DocumentManagement from './components/DocumentManagement';
import StudentManagement from './components/StudentManagement';
import AccountManagement from './components/AccountManagement';
import LoginPage from './components/LoginPage';
import NotificationCenter from './components/NotificationCenter';

import { Role, User, Ticket, Procedure, StudentProfile, Account, TicketStatus, Notification } from './types';
import { 
  authenticateUser, 
  fetchTickets, 
  fetchProcedures, 
  fetchStudents, 
  fetchAccounts, 
  addTicketToDB,
  updateTicketStatusInDB,
  addProcedureToDB,
  updateProcedureInDB,
  deleteProcedureFromDB,
  addStudentToDB,
  updateStudentInDB,
  deleteStudentFromDB,
  addAccountToDB,
  updateAccountInDB,
  deleteAccountFromDB,
  fetchNotifications,
  markNotificationReadInDB,
  clearNotificationsInDB,
  logSystemActivity
} from './services/supabaseService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('chat'); // chat, tickets, admin, students, accounts, documents
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Data
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load initial data
  const loadData = async (role: Role) => {
    setIsLoading(true);
    try {
      const [ticketsData, proceduresData, notificationsData] = await Promise.all([
        fetchTickets(),
        fetchProcedures(),
        fetchNotifications()
      ]);
      
      setTickets(ticketsData);
      setProcedures(proceduresData);
      setNotifications(notificationsData);

      if (role === Role.ADMIN) {
        const [studentsData, accountsData] = await Promise.all([
          fetchStudents(),
          fetchAccounts()
        ]);
        setStudents(studentsData);
        setAccounts(accountsData);
      }
    } catch (error) {
      console.error("Error loading data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    // For demo purposes or fallback
    if (username === 'admin' && password === 'admin') {
      const adminUser: User = { id: 'admin', name: 'Quản trị viên', role: Role.ADMIN, email: 'admin@fit.edu.vn' };
      setCurrentUser(adminUser);
      loadData(Role.ADMIN);
      logSystemActivity('ĐĂNG NHẬP', 'Admin đăng nhập vào hệ thống', adminUser, 'success');
      return true;
    }

    const account = await authenticateUser(username, password);
    if (account) {
      const user: User = {
        id: account.username,
        name: account.fullName,
        role: account.role,
        email: `${account.username}@st.vlute.edu.vn` // heuristic
      };
      setCurrentUser(user);
      loadData(account.role);
      logSystemActivity('ĐĂNG NHẬP', `Người dùng ${user.name} đã đăng nhập`, user, 'success');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    if (currentUser) {
        logSystemActivity('ĐĂNG XUẤT', `Người dùng ${currentUser.name} đã đăng xuất`, currentUser);
    }
    setCurrentUser(null);
    setCurrentView('chat');
    setTickets([]);
  };

  // --- Handlers for Tickets ---
  const handleCreateTicket = async (data: { title: string; type: string; description: string; variables?: any[]; formValues?: any }) => {
    if (!currentUser) return;
    const newTicket: Ticket = {
      id: Date.now().toString(),
      title: data.title,
      studentName: currentUser.name,
      // If Admin creates a ticket, set studentId to null to avoid FK constraint violation if the admin ID doesn't exist in students table
      studentId: currentUser.role === Role.ADMIN ? null : currentUser.id,
      type: data.type,
      status: TicketStatus.PENDING,
      dateCreated: new Date().toISOString().split('T')[0],
      description: data.description,
      variables: data.variables,
      formValues: data.formValues
    };
    
    try {
      await addTicketToDB(newTicket);
      // Refresh tickets
      const updatedTickets = await fetchTickets();
      setTickets(updatedTickets);
      
      logSystemActivity('TẠO HỒ SƠ', `Đã tạo hồ sơ mới: ${data.title}`, currentUser, 'success');

    } catch (e) {
      console.error(e);
      alert("Lỗi khi tạo hồ sơ");
      logSystemActivity('LỖI TẠO HỒ SƠ', `Lỗi khi tạo hồ sơ: ${data.title}`, currentUser, 'error');
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: TicketStatus, reason?: string) => {
    try {
      await updateTicketStatusInDB(ticketId, status, reason);
      const updatedTickets = await fetchTickets();
      setTickets(updatedTickets);
      
      if (currentUser) {
          logSystemActivity(
              'CẬP NHẬT TRẠNG THÁI', 
              `Hồ sơ #${ticketId} chuyển sang trạng thái: ${status}${reason ? ` (Lý do: ${reason})` : ''}`, 
              currentUser,
              status === TicketStatus.REJECTED ? 'warning' : 'info'
          );
      }

    } catch (e) {
      console.error(e);
      alert("Lỗi cập nhật trạng thái");
    }
  };

  // --- Handlers for Procedures ---
  const handleAddProcedure = async (proc: Procedure) => {
    try {
      await addProcedureToDB(proc);
      const data = await fetchProcedures();
      setProcedures(data);
      if(currentUser) logSystemActivity('THÊM QUY TRÌNH', `Đã thêm quy trình mới: ${proc.title}`, currentUser);
    } catch (e) { alert("Lỗi thêm quy trình"); }
  };

  const handleUpdateProcedure = async (proc: Procedure) => {
     try {
      await updateProcedureInDB(proc);
      const data = await fetchProcedures();
      setProcedures(data);
      if(currentUser) logSystemActivity('CẬP NHẬT QUY TRÌNH', `Đã cập nhật quy trình: ${proc.title}`, currentUser);
    } catch (e) { alert("Lỗi cập nhật quy trình"); }
  };

  const handleDeleteProcedure = async (id: string) => {
    try {
      const proc = procedures.find(p => p.id === id);
      await deleteProcedureFromDB(id);
      const data = await fetchProcedures();
      setProcedures(data);
      if(currentUser) logSystemActivity('XÓA QUY TRÌNH', `Đã xóa quy trình: ${proc?.title || id}`, currentUser, 'warning');
    } catch (e) { alert("Lỗi xóa quy trình"); }
  };

  // --- Handlers for Students ---
  const handleAddStudent = async (student: StudentProfile) => {
    try {
      await addStudentToDB(student);
      const data = await fetchStudents();
      setStudents(data);
      if(currentUser) logSystemActivity('THÊM SINH VIÊN', `Đã thêm sinh viên: ${student.name} (${student.id})`, currentUser);
    } catch (e) { alert("Lỗi thêm sinh viên"); }
  };

  const handleUpdateStudent = async (student: StudentProfile) => {
    try {
      await updateStudentInDB(student);
      const data = await fetchStudents();
      setStudents(data);
      if(currentUser) logSystemActivity('CẬP NHẬT SINH VIÊN', `Đã cập nhật sinh viên: ${student.name} (${student.id})`, currentUser);
    } catch (e) { alert("Lỗi cập nhật sinh viên"); }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await deleteStudentFromDB(id);
      const data = await fetchStudents();
      setStudents(data);
      if(currentUser) logSystemActivity('XÓA SINH VIÊN', `Đã xóa sinh viên MSSV: ${id}`, currentUser, 'warning');
    } catch (e) { alert("Lỗi xóa sinh viên"); }
  };

  // --- Handlers for Accounts ---
  const handleAddAccount = async (acc: Account) => {
    try {
      await addAccountToDB(acc);
      const data = await fetchAccounts();
      setAccounts(data);
      if(currentUser) logSystemActivity('THÊM TÀI KHOẢN', `Đã thêm tài khoản: ${acc.username}`, currentUser);
    } catch (e) { throw e; }
  };

  const handleUpdateAccount = async (acc: Account) => {
    try {
      await updateAccountInDB(acc);
      const data = await fetchAccounts();
      setAccounts(data);
      if(currentUser) logSystemActivity('CẬP NHẬT TÀI KHOẢN', `Đã cập nhật tài khoản: ${acc.username}`, currentUser);
    } catch (e) { throw e; }
  };

  const handleDeleteAccount = async (username: string) => {
    try {
      await deleteAccountFromDB(username);
      const data = await fetchAccounts();
      setAccounts(data);
      if(currentUser) logSystemActivity('XÓA TÀI KHOẢN', `Đã xóa tài khoản: ${username}`, currentUser, 'warning');
    } catch (e) { throw e; }
  };

  // --- Notification Handlers ---
  const handleMarkNotificationRead = async (id: string) => {
    await markNotificationReadInDB(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleClearNotifications = async () => {
    await clearNotificationsInDB();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };


  // --- Render Views ---
  const renderContent = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case 'chat':
        return (
          <ChatInterface 
            onCreateTicket={handleCreateTicket} 
            knowledgeBase={procedures}
            currentUser={currentUser}
            // Pass current logged-in student profile if role is STUDENT
            studentProfile={currentUser.role === Role.STUDENT ? students.find(s => s.id === currentUser.id) : undefined}
          />
        );
      case 'tickets':
        return (
          <TicketList 
            tickets={currentUser.role === Role.ADMIN ? tickets : tickets.filter(t => t.studentId === currentUser.id || t.studentId === null && currentUser.role === Role.ADMIN)} // Admin sees all, Student sees theirs
            role={currentUser.role}
            onUpdateStatus={handleUpdateTicketStatus}
            documents={procedures}
          />
        );
      case 'admin':
        return currentUser.role === Role.ADMIN ? <AdminDashboard tickets={tickets} /> : null;
      case 'documents':
        return currentUser.role === Role.ADMIN ? (
          <DocumentManagement 
            documents={procedures}
            onAdd={handleAddProcedure}
            onUpdate={handleUpdateProcedure}
            onDelete={handleDeleteProcedure}
          />
        ) : null;
      case 'students':
        return currentUser.role === Role.ADMIN ? (
          <StudentManagement 
            students={students}
            onAdd={handleAddStudent}
            onUpdate={handleUpdateStudent}
            onDelete={handleDeleteStudent}
          />
        ) : null;
      case 'accounts':
        return currentUser.role === Role.ADMIN ? (
          <AccountManagement 
            accounts={accounts}
            onAdd={handleAddAccount}
            onUpdate={handleUpdateAccount}
            onDelete={handleDeleteAccount}
          />
        ) : null;
      default:
        return <div>Trang không tồn tại</div>;
    }
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} isLoadingData={isLoading} />;
  }

  // Determine container classes based on view to handle scrolling properly
  const isChatView = currentView === 'chat';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar 
        currentUser={currentUser} 
        currentView={currentView} 
        onChangeView={(view) => {
          setCurrentView(view);
          setSidebarOpen(false); // Close mobile sidebar on navigate
        }}
        onToggleRole={() => {}} // Disabled quick toggle, relying on real auth now
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-20 shrink-0">
           <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
             <Menu size={24} />
           </button>
           <h1 className="text-lg font-bold text-blue-800">FIT Assistant</h1>
           <div className="w-8">
             {/* Placeholder for balance or notification */}
             <NotificationCenter 
               notifications={notifications}
               onMarkAsRead={handleMarkNotificationRead}
               onClearAll={handleClearNotifications}
             />
           </div>
        </div>

        {/* Desktop Header Actions (Notifications) */}
        <div className="hidden md:flex absolute top-4 right-6 z-30">
           <NotificationCenter 
               notifications={notifications}
               onMarkAsRead={handleMarkNotificationRead}
               onClearAll={handleClearNotifications}
           />
        </div>

        {/* Main View Area */}
        {/* We use flex-col for chat to allow full height children without parent scroll */}
        <main className={`flex-1 relative flex flex-col ${isChatView ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {/* For Chat: Padding is inside the container to avoid overflow. For others: Padding is here. */}
          <div className={`mx-auto w-full animate-in fade-in duration-300 ${isChatView ? 'h-full p-4 md:p-6 max-w-7xl' : 'min-h-full p-4 md:p-6 max-w-7xl pb-20'}`}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
