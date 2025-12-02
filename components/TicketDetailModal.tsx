
import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, Role, Procedure } from '../types';
import { X, User, Tag, FileText, CheckCircle, XCircle, Clock, AlertCircle, Calendar, Hash, ShieldAlert, Printer } from 'lucide-react';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  role: Role;
  onUpdateStatus: (ticketId: string, status: TicketStatus, reason?: string) => void;
  documents?: Procedure[]; // Available procedures to find templates
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, isOpen, onClose, role, onUpdateStatus, documents = [] }) => {
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsRejecting(false);
      setRejectionReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !ticket) return null;

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.COMPLETED: return 'bg-green-100 text-green-700 border-green-200';
      case TicketStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700 border-blue-200';
      case TicketStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case TicketStatus.REJECTED: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.COMPLETED: return <CheckCircle size={18} />;
      case TicketStatus.IN_PROGRESS: return <AlertCircle size={18} />;
      case TicketStatus.PENDING: return <Clock size={18} />;
      case TicketStatus.REJECTED: return <XCircle size={18} />;
      default: return null;
    }
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (newStatus === TicketStatus.REJECTED) {
      setIsRejecting(true);
    } else {
      onUpdateStatus(ticket.id, newStatus);
      onClose();
    }
  };

  const submitRejection = () => {
    if (!rejectionReason.trim()) {
      setError('Vui lòng nhập lý do từ chối.');
      return;
    }
    onUpdateStatus(ticket.id, TicketStatus.REJECTED, rejectionReason);
    onClose();
  };

  const handleExportTicket = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Helper formatting
    const formatDate = (dateString: string) => {
      if(!dateString) return '...';
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? dateString : `ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
    };

    const today = new Date();
    const dateStr = `Hà Nội, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

    // --- TEMPLATE ENGINE ---
    // 1. Try to find the matching procedure
    const matchedProcedure = documents.find(doc => 
       doc.title.toLowerCase().trim() === ticket.title.toLowerCase().trim()
    );

    let htmlContent = '';

    // Check if we have a custom template from the DB
    if (matchedProcedure && matchedProcedure.exportTemplate && matchedProcedure.exportTemplate.trim()) {
        // USE CUSTOM TEMPLATE
        let template = matchedProcedure.exportTemplate;
        
        // Replace Standard Variables
        template = template.replace(/{{title}}/g, ticket.title.toUpperCase());
        template = template.replace(/{{studentName}}/g, ticket.studentName);
        template = template.replace(/{{studentId}}/g, ticket.studentId);
        template = template.replace(/{{date}}/g, dateStr);
        template = template.replace(/{{description}}/g, ticket.description);

        // Replace Dynamic Variables
        if (ticket.formValues) {
            Object.keys(ticket.formValues).forEach(key => {
                let val = ticket.formValues?.[key] || '';
                // Format if it looks like a date
                if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                   const parts = val.split('-');
                   val = `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
                const regex = new RegExp(`{{${key}}}`, 'g');
                template = template.replace(regex, val);
            });
        }
        
        // Remove unused placeholders
        template = template.replace(/{{.*?}}/g, '....................');
        
        htmlContent = template;

    } else {
        // USE DEFAULT LAYOUT (Fallback if no template in DB)
        let variablesHtml = '';
        if (ticket.variables && ticket.formValues) {
            variablesHtml = ticket.variables.map(v => {
                let val = ticket.formValues?.[v.name] || '....................';
                // Format dates in form content to nice text
                if(v.dataType === 'date' && ticket.formValues?.[v.name]) {
                   const parts = ticket.formValues[v.name].split('-');
                   if(parts.length === 3) val = `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
                return `<p><strong>${v.label}:</strong> ${val}</p>`;
            }).join('');
        } else {
            variablesHtml = `<p style="white-space: pre-wrap;">${ticket.description}</p>`;
        }

        // Updated fallback template to match the A4 Editor style in DocumentManagement
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Đơn ${ticket.title}</title>
            <style>
              @page { size: A4; margin: 2cm; }
              body { font-family: 'Times New Roman', Times, serif; padding: 40px; width: 100%; margin: 0; line-height: 1.6; box-sizing: border-box; }
              .header { text-align: center; margin-bottom: 30px; }
              .nation { font-weight: bold; font-size: 14pt; text-transform: uppercase; margin: 0; }
              .motto { font-weight: bold; font-size: 14pt; margin: 5px 0 0 0; text-decoration: underline; }
              .title { font-weight: bold; font-size: 16pt; text-transform: uppercase; margin-top: 40px; text-align: center; }
              .content { margin-top: 30px; font-size: 13pt; text-align: justify; }
              .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
              .signature-box { text-align: center; width: 45%; }
            </style>
          </head>
          <body>
            <div class="header">
              <p class="nation">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p class="motto">Độc lập - Tự do - Hạnh phúc</p>
            </div>
            
            <h2 class="title">ĐƠN ${ticket.title.toUpperCase()}</h2>
            
            <div class="content">
              <p><strong>Kính gửi:</strong> Ban Chủ nhiệm Khoa Công nghệ Thông tin</p>
              <p>Tôi tên là: <strong>${ticket.studentName}</strong></p>
              <p>Mã số sinh viên: <strong>${ticket.studentId}</strong></p>
              
              <p>Tôi làm đơn này xin trình bày nội dung sau:</p>
              
              <div style="margin-left: 20px;">
                 ${variablesHtml}
              </div>
              
              <p>Kính mong Quý Khoa xem xét và giải quyết yêu cầu của tôi.</p>
              <p>Tôi xin chân thành cảm ơn.</p>
            </div>
            
            <div class="signature-section">
               <div class="signature-box">
                 <!-- Admin signature space if needed -->
               </div>
               <div class="signature-box">
                 <p><i>${dateStr}</i></p>
                 <p><strong>Người làm đơn</strong></p>
                 <br><br><br>
                 <p>${ticket.studentName}</p>
               </div>
            </div>
          </body>
          </html>
        `;
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    // Use timeout to ensure styles are loaded before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/80 sticky top-0 backdrop-blur-md z-10">
          <div className="flex items-center space-x-3">
             <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
                <FileText size={20} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-gray-800">Hồ sơ yêu cầu #{ticket.id}</h3>
                <p className="text-xs text-gray-500">Xem chi tiết và xử lý yêu cầu</p>
             </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
               onClick={handleExportTicket}
               className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-medium border border-indigo-200 transition-colors"
               title="Xuất đơn ra file để in"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Xuất đơn</span>
            </button>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body - Split View Layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-gray-50/50">
          
          {/* Left Column: Metadata (35%) */}
          <div className="w-full md:w-[35%] p-6 border-r border-gray-100 overflow-y-auto bg-white">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Thông tin chung</h4>
            
            <div className="space-y-6">
              {/* Status Card */}
              <div className={`p-4 rounded-xl border ${getStatusColor(ticket.status)} bg-opacity-50`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase opacity-80">Trạng thái</span>
                  {getStatusIcon(ticket.status)}
                </div>
                <div className="text-lg font-bold">{ticket.status}</div>
              </div>

              {/* Student Info */}
              <div>
                 <div className="flex items-center space-x-2 text-gray-800 font-semibold mb-3">
                    <User size={18} className="text-blue-500"/>
                    <span>Người gửi</span>
                 </div>
                 <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Họ tên:</span>
                      <span className="font-medium">{ticket.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">MSSV:</span>
                      <span className="font-medium">{ticket.studentId}</span>
                    </div>
                 </div>
              </div>

              {/* Date & ID */}
              <div>
                 <div className="flex items-center space-x-2 text-gray-800 font-semibold mb-3">
                    <Calendar size={18} className="text-blue-500"/>
                    <span>Thời gian</span>
                 </div>
                 <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ngày tạo:</span>
                      <span className="font-medium">{ticket.dateCreated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mã hồ sơ:</span>
                      <span className="font-medium">#{ticket.id}</span>
                    </div>
                 </div>
              </div>

            </div>
          </div>

          {/* Right Column: Main Content (65%) */}
          <div className="w-full md:w-[65%] p-6 overflow-y-auto bg-gray-50">
             
             {/* Rejection Alert */}
             {ticket.status === TicketStatus.REJECTED && ticket.rejectionReason && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 animate-in slide-in-from-top-2">
                 <div className="flex items-start space-x-3">
                   <ShieldAlert className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                   <div>
                     <h4 className="text-sm font-bold text-red-800 mb-1">Hồ sơ đã bị từ chối</h4>
                     <p className="text-sm text-red-700 bg-white/50 p-2 rounded border border-red-100">
                       Lý do: {ticket.rejectionReason}
                     </p>
                   </div>
                 </div>
              </div>
            )}

            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Nội dung chi tiết</h4>
            
            {/* Ticket Content Paper */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[300px]">
              <div className="border-b border-gray-100 pb-4 mb-4">
                 <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                      {ticket.type}
                    </span>
                 </div>
                 <h2 className="text-xl font-bold text-gray-900 leading-tight">
                   {ticket.title}
                 </h2>
              </div>
              
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions (Admin Only) */}
        {role === Role.ADMIN && (
          <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {isRejecting ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200 bg-red-50 p-4 rounded-lg border border-red-100">
                <div className="flex justify-between items-center">
                   <label className="text-sm font-bold text-red-700">
                    Nhập lý do từ chối
                   </label>
                   <button onClick={() => setIsRejecting(false)} className="text-gray-400 hover:text-gray-600">
                     <X size={16} />
                   </button>
                </div>
                <textarea 
                  className={`w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white ${error ? 'border-red-500' : 'border-gray-300'}`}
                  rows={2}
                  placeholder="Vui lòng nhập lý do từ chối hồ sơ này..."
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (e.target.value) setError('');
                  }}
                  autoFocus
                />
                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setIsRejecting(false)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={submitRejection}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm transition-colors"
                  >
                    Xác nhận từ chối
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-end items-center">
                <div className="text-xs text-gray-400 mr-auto hidden md:block">
                  * Vui lòng kiểm tra kỹ nội dung trước khi cập nhật trạng thái
                </div>

                {ticket.status === TicketStatus.PENDING && (
                  <>
                    <button 
                      onClick={() => handleStatusChange(TicketStatus.REJECTED)}
                      className="flex items-center px-4 py-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <XCircle size={16} className="mr-2" />
                      Từ chối
                    </button>
                    <button 
                      onClick={() => handleStatusChange(TicketStatus.IN_PROGRESS)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium shadow-sm transition-colors"
                    >
                      <Clock size={16} className="mr-2" />
                      Tiếp nhận xử lý
                    </button>
                  </>
                )}

                {ticket.status === TicketStatus.IN_PROGRESS && (
                  <>
                    <button 
                      onClick={() => handleStatusChange(TicketStatus.REJECTED)}
                      className="flex items-center px-4 py-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <XCircle size={16} className="mr-2" />
                      Hủy bỏ
                    </button>
                    <button 
                      onClick={() => handleStatusChange(TicketStatus.COMPLETED)}
                      className="flex items-center px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium shadow-sm transition-colors"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Hoàn thành
                    </button>
                  </>
                )}

                {(ticket.status === TicketStatus.COMPLETED || ticket.status === TicketStatus.REJECTED) && (
                  <button 
                    onClick={() => handleStatusChange(TicketStatus.IN_PROGRESS)}
                    className="flex items-center px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    <AlertCircle size={16} className="mr-2" />
                    Mở lại hồ sơ
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetailModal;
