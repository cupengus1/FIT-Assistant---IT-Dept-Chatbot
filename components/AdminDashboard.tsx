
import React, { useMemo, useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Ticket, TicketStatus, SystemLog } from '../types';
import { Users, FileCheck, AlertTriangle, TrendingUp, Activity, CheckCircle, XCircle, Info, Clock, Loader2 } from 'lucide-react';
import { fetchSystemLogs } from '../services/supabaseService';

interface AdminDashboardProps {
  tickets: Ticket[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ tickets }) => {
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    const loadLogs = async () => {
      setLoadingLogs(true);
      try {
        const logs = await fetchSystemLogs();
        setSystemLogs(logs);
      } catch (e) {
        console.error("Failed to load logs", e);
      } finally {
        setLoadingLogs(false);
      }
    };
    loadLogs();
    
    // Auto-refresh logs every 30 seconds
    const interval = setInterval(loadLogs, 30000);
    return () => clearInterval(interval);
  }, [tickets]); // Reload logs when tickets change as likely an action occurred

  // Calculate stats
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter(t => t.status === TicketStatus.PENDING).length;
  const processingTickets = tickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length;
  const completedTickets = tickets.filter(t => t.status === TicketStatus.COMPLETED).length;
  const rejectedTickets = tickets.filter(t => t.status === TicketStatus.REJECTED).length;
  
  const approvalRate = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0;

  // 1. Data for Tickets by Category (Bar Chart)
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach(t => {
      counts[t.type] = (counts[t.type] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    }));
  }, [tickets]);

  // 2. Data for Tickets by Status (Pie Chart)
  const statusData = [
    { name: 'Hoàn thành', value: completedTickets },
    { name: 'Đang xử lý', value: processingTickets },
    { name: 'Chờ xử lý', value: pendingTickets },
    { name: 'Từ chối', value: rejectedTickets },
  ].filter(item => item.value > 0);

  // 3. Data for Tickets Over Time (Last 7 Days)
  const timeData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const count = tickets.filter(t => t.dateCreated === date).length;
      // Format date for display (DD/MM)
      const displayDate = date.split('-').slice(1).reverse().join('/');
      return {
        date: displayDate,
        fullDate: date,
        count: count
      };
    });
  }, [tickets]);


  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={color.replace('bg-', 'text-')} size={24} />
        </div>
      </div>
      {subtext && (
        <div className="text-xs font-medium text-gray-500 mt-auto">
          {subtext}
        </div>
      )}
    </div>
  );

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-green-500" />;
      case 'error': return <XCircle size={16} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const formatLogTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-gray-800">Tổng quan Hệ thống</h2>
         <span className="text-sm text-gray-500 flex items-center">
           <Clock size={14} className="mr-1"/>
           Cập nhật: {new Date().toLocaleTimeString()}
         </span>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng hồ sơ" 
          value={totalTickets} 
          icon={FileCheck} 
          color="bg-blue-600"
          subtext="Toàn bộ yêu cầu từ sinh viên"
        />
        <StatCard 
          title="Cần xử lý" 
          value={pendingTickets} 
          icon={AlertTriangle} 
          color="bg-yellow-500"
          subtext="Yêu cầu đang chờ duyệt"
        />
        <StatCard 
          title="Tỷ lệ hoàn thành" 
          value={`${approvalRate}%`} 
          icon={TrendingUp} 
          color="bg-green-500"
          subtext={`${completedTickets} hồ sơ đã xong`}
        />
        <StatCard 
          title="Sinh viên tương tác" 
          value="128" 
          icon={Users} 
          color="bg-indigo-500"
          subtext="Trong tháng này"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Ticket Types Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Phân loại yêu cầu</h3>
          <p className="text-xs text-gray-500 mb-6">Số lượng hồ sơ theo từng loại thủ tục</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} allowDecimals={false} />
                <Tooltip 
                  cursor={{fill: '#F3F4F6'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                />
                <Bar dataKey="value" name="Số lượng" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ticket Status Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Trạng thái xử lý</h3>
          <p className="text-xs text-gray-500 mb-6">Tỷ lệ các trạng thái hồ sơ hiện tại</p>
          <div className="h-72 w-full flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tickets Over Time (Line Chart) - Now Full Width */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Xu hướng tiếp nhận hồ sơ</h3>
          <p className="text-xs text-gray-500 mb-6">Số lượng yêu cầu mới trong 7 ngày qua</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                />
                <Line type="monotone" dataKey="count" name="Số hồ sơ" stroke="#3B82F6" strokeWidth={3} dot={{r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SYSTEM LOGS SECTION - Now Full Width & Taller */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full lg:col-span-2">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
             <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                   <Activity size={20} className="mr-2 text-indigo-500"/>
                   Nhật ký Hoạt động
                </h3>
                <p className="text-xs text-gray-500 mt-1">Lịch sử sự kiện hệ thống (Hiển thị 50 log mới nhất)</p>
             </div>
             <div className="flex items-center space-x-2">
                {loadingLogs && <Loader2 size={16} className="animate-spin text-blue-500"/>}
                <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500 font-mono border">
                  Total: {systemLogs.length}
                </div>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar h-[450px]">
             {systemLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                   <Activity size={32} className="mb-3 opacity-20"/>
                   <p>Chưa có hoạt động nào được ghi nhận.</p>
                </div>
             ) : (
                systemLogs.map((log) => (
                   <div key={log.id} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 border border-gray-100 hover:bg-blue-50/50 hover:border-blue-100 transition-colors">
                      <div className="mt-1 flex-shrink-0 bg-white p-2 rounded-full shadow-sm border border-gray-100">
                         {getLogIcon(log.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1">
                             <span className="font-bold text-gray-800 text-sm">{log.action}</span>
                             <span className="text-[11px] text-gray-400 font-mono flex items-center mt-1 sm:mt-0">
                                <Clock size={12} className="mr-1.5"/> {formatLogTime(log.timestamp)}
                             </span>
                         </div>
                         <p className="text-gray-600 text-sm leading-relaxed">{log.details}</p>
                         <div className="mt-2 flex items-center">
                            <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-500">
                               User: <strong className="text-gray-700">{log.userName}</strong>
                            </span>
                         </div>
                      </div>
                   </div>
                ))
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
