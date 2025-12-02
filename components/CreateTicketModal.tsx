
import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Check, Loader2, Layers, ChevronDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProcedureVariable } from '../types';

interface TicketDraft {
  title: string;
  type: string;
  description: string;
  variables?: ProcedureVariable[];
  formValues?: Record<string, string>;
}

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    title: string; 
    type: string; 
    description: string;
    variables?: ProcedureVariable[];
    formValues?: Record<string, string>;
  }) => Promise<void> | void;
  initialData?: TicketDraft | null;
}

// Helper to format YYYY-MM-DD to DD/MM/YYYY
const formatDateForDisplay = (isoDate: string) => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

// --- Mini Calendar Component ---
const MiniCalendar = ({ 
  value, 
  onChange, 
  onClose 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  onClose: () => void 
}) => {
  // Parse initial date or default to today
  const initialDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0 is Sunday

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    // Return YYYY-MM-DD
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    onChange(`${year}-${month}-${dayStr}`);
    onClose();
  };

  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-4 w-72 animate-in fade-in zoom-in-95 duration-100 select-none">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
          <ChevronLeft size={16} />
        </button>
        <div className="font-bold text-gray-800 text-sm">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-[10px] font-semibold text-gray-400 uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = value === dateStr;
          const isToday = new Date().toISOString().split('T')[0] === dateStr;

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDateClick(day)}
              className={`
                h-8 w-8 rounded-full flex items-center justify-center text-xs transition-colors
                ${isSelected 
                  ? 'bg-blue-600 text-white font-bold shadow-md' 
                  : isToday 
                    ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100' 
                    : 'text-gray-700 hover:bg-gray-100'}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};


const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Hành chính');
  const [description, setDescription] = useState('');
  
  // Dynamic variables state
  const [variables, setVariables] = useState<ProcedureVariable[]>([]);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  
  // Track which date field is currently open
  const [activeDateField, setActiveDateField] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setType(initialData.type);
        setDescription(initialData.description);
        setVariables(initialData.variables || []);
        setDynamicValues(initialData.formValues || {});
      } else {
        // Reset defaults if no initial data
        setTitle('');
        setType('Hành chính');
        setDescription('');
        setVariables([]);
        setDynamicValues({});
      }
      setActiveDateField(null);
    }
  }, [isOpen, initialData]);

  // Handle click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setActiveDateField(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  const handleDynamicChange = (key: string, value: string) => {
    setDynamicValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    // Combine dynamic values into description if they exist
    let finalDescription = description;
    if (variables.length > 0) {
      const varsText = variables.map(v => {
        let val = dynamicValues[v.name] || '(Chưa điền)';
        
        // Format date for nicer display in the ticket content
        if (v.dataType === 'date' && val !== '(Chưa điền)') {
           val = formatDateForDisplay(val);
        }
        
        return `- ${v.label}: ${val}`;
      }).join('\n');
      
      finalDescription = `${varsText}\n\n--- Ghi chú thêm ---\n${description}`;
    } else if (!description) {
      // If no variables and no description, warn user
      alert("Vui lòng nhập nội dung mô tả");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API delay for better UX
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Pass raw data for structured storage + formatted description
    await onSubmit({ 
      title, 
      type, 
      description: finalDescription,
      variables,
      formValues: dynamicValues
    });
    
    setIsSubmitting(false);
    setTitle('');
    setDescription('');
    setType('Hành chính');
    setVariables([]);
    setDynamicValues({});
    onClose();
  };

  const renderInput = (v: ProcedureVariable) => {
    const commonClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm bg-white shadow-sm";
    
    if (v.dataType === 'date') {
      const displayValue = formatDateForDisplay(dynamicValues[v.name] || '');
      const isOpen = activeDateField === v.name;

      return (
        <div className="relative group" ref={isOpen ? calendarRef : null}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar size={16} className={`transition-colors ${isOpen ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
          <input
            type="text"
            readOnly
            required={v.required}
            value={displayValue}
            placeholder="dd/mm/yyyy"
            onClick={() => setActiveDateField(isOpen ? null : v.name)}
            className={`${commonClasses} pl-10 cursor-pointer caret-transparent`}
          />
          {isOpen && (
            <MiniCalendar 
              value={dynamicValues[v.name]} 
              onChange={(val) => handleDynamicChange(v.name, val)}
              onClose={() => setActiveDateField(null)}
            />
          )}
        </div>
      );
    }
    
    if (v.dataType === 'number') {
      return (
        <input
          type="number"
          required={v.required}
          min="0"
          value={dynamicValues[v.name] || ''}
          onChange={(e) => handleDynamicChange(v.name, e.target.value)}
          placeholder={`Nhập số lượng...`}
          className={commonClasses}
        />
      );
    }

    // Default to text
    return (
      <input
        type="text"
        required={v.required}
        value={dynamicValues[v.name] || ''}
        onChange={(e) => handleDynamicChange(v.name, e.target.value)}
        placeholder={`Nhập ${v.label.toLowerCase()}...`}
        className={commonClasses}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText size={20} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Tạo Hồ sơ mới</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto min-h-[400px]">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề yêu cầu <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Xin giấy xác nhận, Phúc khảo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại yêu cầu</label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm bg-white appearance-none cursor-pointer shadow-sm"
              >
                <option value="Hành chính">Hành chính (Giấy tờ, xác nhận)</option>
                <option value="Đào tạo">Đào tạo (Điểm số, đăng ký học)</option>
                <option value="Cơ sở vật chất">Cơ sở vật chất (Mượn phòng, báo hỏng)</option>
                <option value="Công tác sinh viên">Công tác sinh viên</option>
                <option value="Khác">Khác</option>
              </select>
              
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Layers size={18} className="text-gray-400" />
              </div>
              
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            </div>
          </div>

          {/* Dynamic Variables Rendering */}
          {variables.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
              <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center">
                <FileText size={12} className="mr-1.5"/>
                Thông tin chi tiết
              </h4>
              {variables.map((v) => (
                <div key={v.name}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                    {v.label} {v.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderInput(v)}
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {variables.length > 0 ? 'Ghi chú thêm / Mô tả khác' : 'Mô tả chi tiết'} {variables.length === 0 && <span className="text-red-500">*</span>}
            </label>
            <textarea
              required={variables.length === 0}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết vấn đề của bạn..."
              rows={variables.length > 0 ? 2 : 4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm resize-none shadow-sm"
            />
          </div>

          <div className="pt-2 flex space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Check size={16} className="mr-2" />
                  Gửi yêu cầu
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;
