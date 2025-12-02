
import React, { useState, useMemo, useEffect } from 'react';
import { StudentProfile } from '../types';
import { Search, UserPlus, Edit2, Trash2, Save, X, User, GraduationCap, AlertCircle, Wand2, Phone, Mail } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import Pagination from './Pagination';

interface StudentManagementProps {
  students: StudentProfile[];
  onAdd: (student: StudentProfile) => void;
  onUpdate: (student: StudentProfile) => void;
  onDelete: (id: string) => void | Promise<void>;
}

interface InputFieldProps {
  label: string;
  value: string | undefined;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  options?: string[];
  placeholder?: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  showWand?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ 
  label, value, type = "text", required = false, disabled = false, options = [], placeholder = '', error, onChange, showWand = false 
}) => {
  return (
    <div className="flex flex-col">
      <label className="text-xs font-bold text-gray-600 mb-1.5 text-left md:w-24 md:hidden">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex flex-col">
         <div className="flex items-center">
             <label className="text-xs font-bold text-gray-700 w-24 hidden md:block shrink-0">
               {label} {required && <span className="text-red-500">*</span>}
             </label>
             <div className="flex-1 w-full">
                 {options.length > 0 ? (
                     <select
                        value={value || ''}
                        onChange={onChange}
                        disabled={disabled}
                        className={`w-full px-3 py-2 border rounded bg-white text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-colors ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        style={{ backgroundColor: disabled ? '#f3f4f6' : 'white' }}
                     >
                        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                     </select>
                 ) : (
                    <div className="relative">
                      <input 
                        type={type}
                        required={required}
                        disabled={disabled}
                        value={value || ''}
                        placeholder={placeholder}
                        onChange={onChange}
                        className={`w-full px-3 py-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-colors ${error ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300'} ${disabled ? 'text-gray-500' : 'text-gray-800'}`}
                        style={{ backgroundColor: disabled ? '#f3f4f6' : error ? '#FEF2F2' : 'white' }}
                      />
                      {showWand && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" title="Tự động tạo Email">
                           <Wand2 size={14} className="text-blue-400" />
                        </div>
                      )}
                    </div>
                 )}
             </div>
         </div>
         {/* Error Message */}
         {error && (
            <div className="flex items-center mt-1 ml-0 md:ml-24 text-xs text-red-500 font-medium animate-in slide-in-from-top-1">
               <AlertCircle size={10} className="mr-1" />
               {error}
            </div>
         )}
      </div>
    </div>
  );
};

const ITEMS_PER_PAGE = 10;

const StudentManagement: React.FC<StudentManagementProps> = ({ students, onAdd, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<StudentProfile>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Validation Errors State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string, name: string}>({
    isOpen: false,
    id: '',
    name: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, students]);

  const handleAddNew = () => {
    setCurrentStudent({
      status: 'Đang học',
      gender: 'Nam',
      address: 'Vĩnh Long',
      placeOfBirth: 'Cần Thơ',
      className: 'ĐH Công nghệ thông tin',
      majorName: 'Công nghệ thông tin'
    });
    setErrors({});
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (student: StudentProfile) => {
    setCurrentStudent({ ...student });
    setErrors({});
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const confirmDelete = (student: StudentProfile) => {
    setDeleteModal({
      isOpen: true,
      id: student.id,
      name: student.name
    });
  };

  const handleExecuteDelete = async () => {
    if (!deleteModal.id) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteModal.id);
      setDeleteModal(prev => ({ ...prev, isOpen: false }));
    } catch (e) {
      console.error(e);
      alert('Không thể xóa sinh viên.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Auto-generate Email based on MSSV
  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value;
    const shouldAutoUpdateEmail = !isEditing || !currentStudent.email;
    
    setCurrentStudent(prev => ({
      ...prev,
      id: val,
      email: shouldAutoUpdateEmail ? `${val}@st.vlute.edu.vn` : prev.email
    }));
    
    if (errors.id) setErrors(prev => ({ ...prev, id: '' }));
  };

  const handleGenericChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
     setCurrentStudent(prev => ({...prev, [field]: e.target.value}));
     if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const s = currentStudent;

    if (!s.id?.trim()) newErrors.id = 'Vui lòng nhập MSSV';
    if (!s.name?.trim()) newErrors.name = 'Vui lòng nhập Họ tên';
    
    if (s.phone && !/^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/.test(s.phone)) {
       newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (s.identityCard && !/^\d{12}$/.test(s.identityCard)) {
       newErrors.identityCard = 'CCCD phải đủ 12 số';
    }

    if (s.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) {
       newErrors.email = 'Email không đúng định dạng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const studentData = currentStudent as StudentProfile;

    if (isEditing) {
      onUpdate(studentData);
    } else {
      if (students.some(s => s.id === studentData.id)) {
        setErrors(prev => ({ ...prev, id: 'Mã số sinh viên này đã tồn tại trong hệ thống' }));
        return;
      }
      onAdd(studentData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <GraduationCap className="mr-2 text-blue-600" /> Quản lý Sinh viên
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý hồ sơ, thông tin hành chính của sinh viên.
          </p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium text-sm whitespace-nowrap"
        >
          <UserPlus size={18} />
          <span>Thêm Sinh viên</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm theo Tên, MSSV hoặc Email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm bg-white"
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Sinh viên</th>
                <th className="p-4 font-semibold">Thông tin Lớp</th>
                <th className="p-4 font-semibold">Ngành học</th>
                <th className="p-4 font-semibold">Trạng thái</th>
                <th className="p-4 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3 border border-blue-200">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{student.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                     <div className="text-sm text-gray-800 font-bold">{student.classId}</div>
                     <div className="text-xs text-gray-500">{student.className}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-600 font-medium">{student.majorName}</div>
                    {student.specialization && (
                       <div className="text-xs text-gray-400 italic">{student.specialization}</div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      student.status === 'Đang học' ? 'bg-green-50 text-green-700 border-green-200' :
                      student.status === 'Bảo lưu' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end space-x-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(student)}
                        className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded shadow-sm transition-colors text-xs font-bold flex items-center px-2"
                        title="Chỉnh sửa"
                      >
                         <Edit2 size={12} className="mr-1" /> Sửa
                      </button>
                      <button 
                        onClick={() => confirmDelete(student)}
                        className="p-1.5 text-white bg-red-500 hover:bg-red-600 rounded shadow-sm transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
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
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {paginatedStudents.map((student) => (
          <div key={student.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 relative">
             <div className="flex justify-between items-start mb-3">
                 <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{student.id}</div>
                    </div>
                 </div>
                 <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                    student.status === 'Đang học' ? 'bg-green-50 text-green-700 border-green-200' :
                    student.status === 'Bảo lưu' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-gray-100 text-gray-600 border-gray-200'
                 }`}>
                   {student.status}
                 </span>
             </div>

             <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded-lg">
                <div>
                   <span className="text-gray-400 block">Lớp:</span>
                   <span className="font-medium">{student.classId}</span>
                </div>
                <div>
                   <span className="text-gray-400 block">Ngành:</span>
                   <span className="font-medium truncate">{student.majorName}</span>
                </div>
                {student.phone && (
                  <div className="col-span-2 flex items-center mt-1">
                     <Phone size={10} className="mr-1 text-gray-400"/> {student.phone}
                  </div>
                )}
             </div>

             <div className="flex space-x-2">
               <button 
                 onClick={() => handleEdit(student)}
                 className="flex-1 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-bold hover:bg-green-100"
               >
                 Chỉnh sửa
               </button>
               <button 
                 onClick={() => confirmDelete(student)}
                 className="flex-1 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-bold hover:bg-red-100"
               >
                 Xóa
               </button>
             </div>
          </div>
        ))}
        <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
      </div>

      {filteredStudents.length === 0 && (
        <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
           <p>Không tìm thấy sinh viên nào.</p>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDelete}
        title="Xóa Sinh viên"
        message={`Bạn có chắc chắn muốn xóa sinh viên "${deleteModal.name}" (${deleteModal.id}) khỏi hệ thống? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa vĩnh viễn"
        isLoading={isDeleting}
      />

      {/* Add/Edit Modal (Responsive) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] border border-gray-200">
             
             <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white shrink-0">
                <div className="flex items-center text-blue-800 font-bold text-lg">
                   {isEditing ? 'Cập nhật Sinh viên' : 'Thêm Sinh viên'}
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto bg-white">
                {/* Form content */}
                <div className="mb-6 border border-blue-200 rounded-lg overflow-hidden">
                   <div className="bg-white p-3 border-b border-blue-200 flex items-center text-blue-800 font-semibold text-sm">
                      <User size={18} className="mr-2 text-blue-600" />
                      Thông tin cá nhân
                   </div>
                   <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      
                      <InputField 
                        label="MSSV" 
                        value={currentStudent.id} 
                        required 
                        disabled={isEditing} 
                        onChange={handleIdChange}
                        error={errors.id}
                        placeholder="Nhập MSSV"
                        showWand={!isEditing && !!currentStudent.id}
                      />
                      <InputField 
                        label="Họ tên" 
                        value={currentStudent.name} 
                        required 
                        onChange={handleGenericChange('name')}
                        error={errors.name}
                        placeholder="Nhập họ và tên" 
                      />
                      
                      <InputField label="Giới tính" value={currentStudent.gender} onChange={handleGenericChange('gender')} options={['Nam', 'Nữ', 'Khác']} />
                      <InputField label="Ngày sinh" value={currentStudent.dob} onChange={handleGenericChange('dob')} type="date" />
                      
                      <InputField label="Địa chỉ" value={currentStudent.address} onChange={handleGenericChange('address')} placeholder="Số nhà, đường..." />
                      <InputField label="Nơi sinh" value={currentStudent.placeOfBirth} onChange={handleGenericChange('placeOfBirth')} options={['Cần Thơ', 'Vĩnh Long', 'Hồ Chí Minh', 'Khác']} />
                      
                      <InputField label="CCCD" value={currentStudent.identityCard} onChange={handleGenericChange('identityCard')} error={errors.identityCard} placeholder="12 chữ số" />
                      <InputField label="Email" value={currentStudent.email} onChange={handleGenericChange('email')} type="email" error={errors.email} placeholder="email@..." />
                      
                      <InputField label="SĐT" value={currentStudent.phone} onChange={handleGenericChange('phone')} error={errors.phone} placeholder="0xxxxxxxxx" />
                      <InputField label="Trạng thái" value={currentStudent.status} onChange={handleGenericChange('status')} options={['Đang học', 'Bảo lưu', 'Tốt nghiệp', 'Thôi học']} />
                   </div>
                </div>

                <div className="mb-4 border border-blue-200 rounded-lg overflow-hidden">
                   <div className="bg-white p-3 border-b border-blue-200 flex items-center text-blue-800 font-semibold text-sm">
                      <GraduationCap size={18} className="mr-2 text-blue-600" />
                      Thông tin lớp học
                   </div>
                   <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <InputField label="Mã lớp" value={currentStudent.classId} onChange={handleGenericChange('classId')} placeholder="1CTT22A1" />
                      <div className="md:col-span-1"></div>
                      <div className="md:col-span-2">
                        <InputField label="Tên lớp" value={currentStudent.className} onChange={handleGenericChange('className')} placeholder="ĐH CNTT 2022" />
                      </div>
                      <InputField label="Mã ngành" value={currentStudent.majorCode} onChange={handleGenericChange('majorCode')} placeholder="7480201" />
                      <InputField label="Tên ngành" value={currentStudent.majorName} onChange={handleGenericChange('majorName')} placeholder="Công nghệ thông tin" />
                      <div className="md:col-span-2">
                         <InputField label="Chuyên ngành" value={currentStudent.specialization} onChange={handleGenericChange('specialization')} placeholder="An toàn thông tin..." />
                      </div>
                   </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                   <button 
                     type="button" 
                     onClick={() => setIsModalOpen(false)}
                     className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium bg-white"
                   >
                     Hủy
                   </button>
                   <button 
                     type="submit" 
                     className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center shadow-sm"
                   >
                     <Save size={16} className="mr-2" />
                     {isEditing ? 'Lưu' : 'Thêm'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
