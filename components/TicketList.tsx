
import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, TicketStatus, Role, Procedure } from '../types';
import { Clock, CheckCircle, XCircle, AlertCircle, FileText, Plus, Calendar, User, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import TicketDetailModal from './TicketDetailModal';
import Pagination from './Pagination';

interface TicketListProps {
  tickets: Ticket[];
  role: Role;
  onUpdateStatus?: (ticketId: string, status: TicketStatus, reason?: string) => void;
  documents?: Procedure[];
}

const ITEMS_PER_PAGE = 10;

const TicketList: React.FC<TicketListProps> = ({ tickets, role, onUpdateStatus, documents }) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterType, setFilterType] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.COMPLETED: return 'bg-green-100 text-green-700 border-green-200';
      case TicketStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700 border-blue-200';
      case TicketStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case TicketStatus.REJECTED: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const StatusBadge = ({ status }: { status: TicketStatus }) => (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center w-fit ${getStatusColor(status)}`}>
      {status === TicketStatus.COMPLETED && <CheckCircle size={12} className="mr-1.5"/>}
      {status === TicketStatus.PENDING && <Clock size={12} className="mr-1.5"/>}
      {status === TicketStatus.IN_PROGRESS && <AlertCircle size={12} className="mr-1.5"/>}
      {status === TicketStatus.REJECTED && <XCircle size={12} className="mr-1.5"/>}
      {status}
    </span>
  );

  const handleUpdateStatus = (ticketId: string, status: TicketStatus, reason?: string) => {
    if (onUpdateStatus) {
      onUpdateStatus(ticketId, status, reason);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  // Extract unique ticket types for the filter dropdown
  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(tickets.map(t => t.type))).filter(Boolean).sort();
  }, [tickets]);

  // Filter tickets based on selection
  const filteredTickets = useMemo(() => {
    if (filterType === 'All') return tickets;
    return tickets.filter(t => t.type === filterType);
  }, [tickets, filterType]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTickets, currentPage]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, tickets]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {role === Role.ADMIN ? "Quản lý Tất cả Hồ sơ" : "Hồ sơ của tôi"}
        </h2>
        
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            {/* Filter Dropdown */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors"/>
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="pl-9 pr-8 py-2 w-full sm:w-auto min-w-[200px] border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm appearance-none cursor-pointer hover:border-blue-300 transition-colors"
                >
                    <option value="All">Tất cả loại hồ sơ</option>
                    {uniqueTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
        </div>
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">Mã Hồ sơ</th>
              <th className="p-4 font-semibold">Tiêu đề</th>
              <th className="p-4 font-semibold">Loại</th>
              {role === Role.ADMIN && <th className="p-4 font-semibold">Sinh viên</th>}
              <th className="p-4 font-semibold">Ngày tạo</th>
              <th className="p-4 font-semibold">Trạng thái</th>
              <th className="p-4 font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedTickets.map((ticket) => (
              <tr 
                key={ticket.id} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <td className="p-4 font-medium text-gray-900 text-sm">#{ticket.id}</td>
                <td className="p-4">
                  <div className="font-medium text-gray-800 text-sm">{ticket.title}</div>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    {ticket.type}
                  </span>
                </td>
                {role === Role.ADMIN && (
                   <td className="p-4 text-sm">
                     <div className="font-medium text-gray-900">{ticket.studentName}</div>
                     <div className="text-xs text-gray-500">{ticket.studentId}</div>
                   </td>
                )}
                <td className="p-4 text-sm text-gray-500">{ticket.dateCreated}</td>
                <td className="p-4">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="p-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      setSelectedTicket(ticket);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Desktop Pagination */}
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Mobile View: Collapsible Cards */}
      <div className="md:hidden space-y-3">
        {paginatedTickets.map((ticket) => {
          const isExpanded = expandedId === ticket.id;
          return (
            <div 
              key={ticket.id} 
              className={`bg-white rounded-xl shadow-sm border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'}`}
            >
              {/* Card Header - Click to toggle */}
              <div 
                onClick={() => toggleExpand(ticket.id)}
                className="p-4 cursor-pointer active:bg-gray-50"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                       <StatusBadge status={ticket.status} />
                       <span className="text-[10px] text-gray-400 font-mono">#{ticket.id}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm leading-snug">{ticket.title}</h3>
                    <div className="text-xs text-gray-500 mt-1.5 flex items-center">
                      <Calendar size={12} className="mr-1.5" />
                      {ticket.dateCreated}
                    </div>
                  </div>
                  <div className="text-gray-400 mt-1">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {/* Card Body - Collapsible Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2">
                   <div className="border-t border-gray-100 pt-3 mt-1 mb-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                         <span className="text-gray-400 block mb-1">Loại hồ sơ</span>
                         <span className="font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded inline-block">
                           {ticket.type}
                         </span>
                      </div>
                      {role === Role.ADMIN && (
                        <div>
                           <span className="text-gray-400 block mb-1">Sinh viên</span>
                           <span className="font-medium text-gray-800 block truncate">{ticket.studentName}</span>
                           <span className="text-gray-500">{ticket.studentId}</span>
                        </div>
                      )}
                   </div>
                   
                   <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTicket(ticket);
                      }}
                      className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center border border-blue-100"
                   >
                      <FileText size={16} className="mr-2"/> Xem chi tiết đầy đủ
                   </button>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Mobile Pagination */}
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
      
      {filteredTickets.length === 0 && (
        <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200 animate-in fade-in zoom-in-95">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-gray-600">Không tìm thấy hồ sơ nào.</p>
          <p className="text-sm mt-1">{filterType !== 'All' ? `Không có hồ sơ loại "${filterType}"` : 'Hãy tạo yêu cầu mới.'}</p>
        </div>
      )}

      <TicketDetailModal 
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        role={role}
        onUpdateStatus={handleUpdateStatus}
        documents={documents}
      />
    </div>
  );
};

export default TicketList;
