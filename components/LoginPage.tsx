
import React, { useState } from 'react';
import { GraduationCap, ShieldCheck, User, Lock, Loader2, AlertCircle } from 'lucide-react';
import { Role } from '../types';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  isLoadingData: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isLoadingData }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      const success = await onLogin(username, password);
      if (!success) {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full overflow-hidden flex flex-col md:flex-row max-w-4xl">
        
        {/* Left Side: Brand & Info */}
        <div className="hidden md:flex flex-col justify-center items-center bg-blue-600 md:w-5/12 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-blue-700 opacity-20 transform -skew-x-12 translate-x-12"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="bg-white/20 p-4 rounded-full mb-6 backdrop-blur-sm">
              <GraduationCap size={64} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">FIT Assistant</h1>
            <p className="text-blue-100 mb-8">Hệ thống hỗ trợ sinh viên Khoa CNTT</p>
            <div className="text-sm text-blue-200 space-y-2 opacity-80">
              <p>✓ Tra cứu quy trình nội bộ</p>
              <p>✓ Nộp hồ sơ trực tuyến</p>
              <p>✓ Hỗ trợ giải đáp AI 24/7</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-7/12 p-8 md:p-12">
          <div className="text-center mb-8 md:text-left">
            <h2 className="text-2xl font-bold text-gray-800">
              {isAdminMode ? 'Đăng nhập Quản trị' : 'Cổng thông tin Sinh viên'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isAdminMode 
                ? 'Vui lòng nhập tài khoản quản trị viên.' 
                : 'Đăng nhập để tiếp tục sử dụng dịch vụ.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isAdminMode ? 'Tên đăng nhập' : 'Mã số sinh viên'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                  placeholder={isAdminMode ? "admin" : "Ví dụ: 22004138"}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn || isLoadingData}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all font-medium flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
              {isLoggingIn || isLoadingData ? (
                <>
                  <Loader2 size={20} className="animate-spin mr-2" />
                  Đang xác thực...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
             <button
               onClick={() => {
                 setIsAdminMode(!isAdminMode);
                 setUsername('');
                 setPassword('');
                 setError('');
               }}
               className="w-full flex items-center justify-center text-xs text-gray-500 hover:text-blue-600 transition-colors"
             >
               {isAdminMode ? (
                 <>
                   <User size={14} className="mr-1.5" />
                   Quay lại Đăng nhập Sinh viên
                 </>
               ) : (
                 <>
                   <ShieldCheck size={14} className="mr-1.5" />
                   Đăng nhập dành cho Quản trị viên
                 </>
               )}
             </button>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-4 text-center w-full text-xs text-gray-400">
         &copy; 2025 Khoa Công nghệ Thông tin - VLUTE
      </div>
    </div>
  );
};

export default LoginPage;