
import React, { useState, useMemo, useEffect } from 'react';
import { Account, Role } from '../types';
import { Users, UserPlus, Edit2, Trash2, Key, Search, Save, X } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import Pagination from './Pagination';

interface AccountManagementProps {
  accounts: Account[];
  onAdd: (account: Account) => Promise<void>;
  onUpdate: (account: Account) => Promise<void>;
  onDelete: (username: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 10;

const AccountManagement: React.FC<AccountManagementProps> = ({ accounts, onAdd, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Partial<Account>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, username: string}>({
    isOpen: false,
    username: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => 
      acc.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      acc.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [accounts, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE);
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAccounts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAccounts, currentPage]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, accounts]);

  const handleAddNew = () => {
    setCurrentAccount({ role: Role.STUDENT });
    setPassword('');
    setError('');
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (account: Account) => {
    setCurrentAccount(account);
    setPassword(''); // Reset password field for security
    setError('');
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const confirmDelete = (username: string) => {
    setDeleteModal({ isOpen: true, username });
  };

  const handleExecuteDelete = async () => {
    if (!deleteModal.username) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteModal.username);
      setDeleteModal(prev => ({ ...prev, isOpen: false }));
    } catch (e) {
      console.error(e);
      // alert handled in parent usually, but good to have fallback
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentAccount.username || !currentAccount.fullName) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    if (!isEditing && !password) {
      setError('Vui lòng nhập mật khẩu cho tài khoản mới.');
      return;
    }

    const accountData: Account = {
      username: currentAccount.username!,
      password: password || undefined, // Only send if changed/new
      role: currentAccount.role || Role.STUDENT,
      fullName: currentAccount.fullName!,
      studentId: currentAccount.studentId || undefined
    };

    try {
      if (isEditing) {
        await onUpdate(accountData);
      } else {
        await onAdd(accountData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError('Lỗi: ' + (err.message || 'Không thể lưu tài khoản.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Users className="mr-2 text-blue-600" /> Quản lý Tài khoản
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý quyền truy cập và tài khoản người dùng hệ thống.
          </p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium text-sm whitespace-nowrap"
        >
          <UserPlus size={18} />
          <span>Thêm Tài khoản</span>
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm tài khoản..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm bg-white"
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">Tài khoản / Họ tên</th>
              <th className="p-4 font-semibold">Vai trò</th>
              <th className="p-4 font-semibold">Liên kết SV</th>
              <th className="p-4 font-semibold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedAccounts.map((acc) => (
              <tr key={acc.username} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-gray-900">{acc.username}</div>
                  <div className="text-sm text-gray-500">{acc.fullName}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                    acc.role === Role.ADMIN 
                      ? 'bg-purple-50 text-purple-700 border-purple-200' 
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {acc.role}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {acc.studentId || <span className="text-gray-400 italic">--</span>}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => handleEdit(acc)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Chỉnh sửa / Đổi mật khẩu"
                    >
                      <Edit2 size={16} />
                    </button>
                    {acc.username !== 'admin' && ( // Prevent deleting main admin
                      <button 
                        onClick={() => confirmDelete(acc.username)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Xóa tài khoản"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {paginatedAccounts.map((acc) => (
          <div key={acc.username} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
             <div className="flex justify-between items-start mb-2">
               <div>
                  <h3 className="font-bold text-gray-800">{acc.username}</h3>
                  <p className="text-sm text-gray-500">{acc.fullName}</p>
               </div>
               <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                    acc.role === Role.ADMIN 
                      ? 'bg-purple-50 text-purple-700 border-purple-200' 
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {acc.role}
               </span>
             </div>
             
             <div className="text-xs text-gray-500 mb-4">
               Liên kết: {acc.studentId || "Không có"}
             </div>

             <div className="flex space-x-2">
               <button 
                  onClick={() => handleEdit(acc)}
                  className="flex-1 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-bold hover:bg-blue-100 flex justify-center items-center"
               >
                 <Edit2 size={12} className="mr-1"/> Sửa
               </button>
               {acc.username !== 'admin' && (
                 <button 
                    onClick={() => confirmDelete(acc.username)}
                    className="flex-1 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-bold hover:bg-red-100 flex justify-center items-center"
                 >
                   <Trash2 size={12} className="mr-1"/> Xóa
                 </button>
               )}
             </div>
          </div>
        ))}
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {filteredAccounts.length === 0 && (
          <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
             <p>Không tìm thấy tài khoản nào.</p>
          </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDelete}
        title="Xóa Tài khoản"
        message={`Bạn có chắc muốn xóa tài khoản "${deleteModal.username}"? Người dùng này sẽ không thể đăng nhập được nữa.`}
        confirmLabel="Xóa tài khoản"
        isLoading={isDeleting}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">
                {isEditing ? 'Cập nhật Tài khoản' : 'Thêm Tài khoản Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                <input
                  type="text"
                  value={currentAccount.username || ''}
                  onChange={e => setCurrentAccount({...currentAccount, username: e.target.value})}
                  disabled={isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  placeholder="Ví dụ: 22004138"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={currentAccount.fullName || ''}
                  onChange={e => setCurrentAccount({...currentAccount, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                <select
                  value={currentAccount.role || Role.STUDENT}
                  onChange={e => setCurrentAccount({...currentAccount, role: e.target.value as Role})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value={Role.STUDENT}>Sinh viên</option>
                  <option value={Role.ADMIN}>Quản trị viên (Admin)</option>
                </select>
              </div>

              {currentAccount.role === Role.STUDENT && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã sinh viên liên kết</label>
                  <input
                    type="text"
                    value={currentAccount.studentId || ''}
                    onChange={e => setCurrentAccount({...currentAccount, studentId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Nhập MSSV (để tự động lấy thông tin)"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Key size={14} className="mr-1"/>
                  {isEditing ? 'Đặt lại Mật khẩu (Để trống nếu không đổi)' : 'Mật khẩu'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={isEditing ? 'Nhập mật khẩu mới...' : 'Nhập mật khẩu...'}
                />
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Save size={16} className="mr-2"/> Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
