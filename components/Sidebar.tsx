
import React from 'react';
import { 
  MessageSquare, 
  FileText, 
  LayoutDashboard, 
  LogOut, 
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Users,
  X
} from 'lucide-react';
import { Role, User } from '../types';

interface SidebarProps {
  currentUser: User;
  currentView: string;
  onChangeView: (view: string) => void;
  onToggleRole: () => void;
  onLogout: () => void;
  isOpen: boolean;        // Prop for mobile state
  onClose: () => void;    // Prop for mobile close
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, currentView, onChangeView, onToggleRole, onLogout, isOpen, onClose }) => {
  
  const NavItem = ({ view, icon: Icon, label }: { view: string, icon: any, label: string }) => (
    <button
      onClick={() => onChangeView(view)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
        currentView === view 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div 
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 h-screen flex flex-col shadow-xl md:shadow-none transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <GraduationCap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">FIT Assistant</h1>
              <p className="text-xs text-gray-500 font-medium">Khoa CNTT</p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">Menu Chính</div>
          
          <NavItem view="chat" icon={MessageSquare} label="Trợ lý AI" />
          <NavItem view="tickets" icon={FileText} label={currentUser.role === Role.ADMIN ? "Quản lý Hồ sơ" : "Hồ sơ của tôi"} />
          
          {currentUser.role === Role.ADMIN && (
            <>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2 px-4">Quản trị</div>
              <NavItem view="admin" icon={LayoutDashboard} label="Dashboard" />
              <NavItem view="students" icon={GraduationCap} label="Quản lý Sinh viên" />
              <NavItem view="accounts" icon={Users} label="Quản lý Tài khoản" />
              <NavItem view="documents" icon={BookOpen} label="Quản lý Tài liệu" />
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 flex-shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-semibold text-gray-800 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 flex items-center">
                {currentUser.role === Role.ADMIN ? (
                  <><ShieldCheck size={12} className="mr-1 text-red-500"/> Admin</>
                ) : (
                  "Sinh viên"
                )}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onToggleRole}
            className="w-full text-xs text-indigo-600 hover:text-indigo-800 underline text-center mb-2"
          >
            (Demo: Chuyển vai trò nhanh)
          </button>

          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors text-sm"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
