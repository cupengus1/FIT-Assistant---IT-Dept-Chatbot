
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, Info, Plus, Download, Zap, Edit, Trash2, RefreshCw, Check, FileText } from 'lucide-react';
import { Message, Procedure, User, StudentProfile } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { fetchChatHistory, saveChatMessage, clearChatHistory } from '../services/supabaseService';
import ReactMarkdown from 'react-markdown';
import CreateTicketModal from './CreateTicketModal';

interface ChatInterfaceProps {
  onCreateTicket?: (data: { title: string; type: string; description: string }) => void;
  knowledgeBase?: Procedure[];
  currentUser?: User;
  studentProfile?: StudentProfile;
}

const SUGGESTION_POOL = [
  "Thủ tục xác nhận SV",
  "Phúc khảo điểm thi",
  "Mượn phòng Lab",
  "Bảo lưu kết quả",
  "Đăng ký đề tài tốt nghiệp",
  "Xin bảng điểm",
  "Cấp lại thẻ sinh viên",
  "Lịch tiếp sinh viên",
  "Quy chế đào tạo",
  "Liên hệ Giáo vụ",
  "Đăng ký học phần",
  "Xét tốt nghiệp",
  "Học bổng khuyến khích",
  "Giấy vay vốn ngân hàng"
];

// Helper to parse JSON from AI code blocks
const extractJson = (text: string) => {
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    // Try finding raw JSON if no blocks
    const rawMatch = text.match(/\{[\s\S]*\}/);
    if (rawMatch) return JSON.parse(rawMatch[0]);
    return null;
  } catch (e) {
    return null;
  }
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onCreateTicket, 
  knowledgeBase = [], 
  currentUser,
  studentProfile 
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketDraft, setTicketDraft] = useState<any>(null);
  const [quickActions, setQuickActions] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load chat history from Supabase on mount or when user changes
  useEffect(() => {
    const loadHistory = async () => {
      setIsHistoryLoading(true);
      if (currentUser?.id) {
        try {
          const history = await fetchChatHistory(currentUser.id);
          if (history.length > 0) {
            setMessages(history);
          } else {
            // Default Welcome Message if no history
            setMessages([{
              id: 'welcome',
              role: 'model',
              text: 'Xin chào! Tôi là trợ lý ảo AI của Khoa CNTT. Tôi có thể giúp gì cho bạn hôm nay?\n\n*Ví dụ: "Làm sao để xin giấy xác nhận sinh viên?", "Thủ tục phúc khảo điểm thi"*',
              timestamp: new Date()
            }]);
          }
        } catch (error) {
          console.error("Failed to load chat history", error);
        }
      }
      setIsHistoryLoading(false);
    };

    loadHistory();
  }, [currentUser?.id]);

  // Initialize Random Suggestions
  useEffect(() => {
    shuffleSuggestions();
  }, []);

  const shuffleSuggestions = () => {
    const shuffled = [...SUGGESTION_POOL].sort(() => 0.5 - Math.random());
    setQuickActions(shuffled.slice(0, 4));
  };

  const handleClearChat = async () => {
    if (!currentUser?.id) return;

    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện này?")) {
      setIsClearing(true); 
      try {
        await clearChatHistory(currentUser.id);
        // Reset to welcome message on success
        setMessages([{
          id: 'welcome',
          role: 'model',
          text: 'Xin chào! Tôi là trợ lý ảo AI của Khoa CNTT. Tôi có thể giúp gì cho bạn hôm nay?\n\n*Ví dụ: "Làm sao để xin giấy xác nhận sinh viên?", "Thủ tục phúc khảo điểm thi"*',
          timestamp: new Date()
        }]);
      } catch (e) {
        console.error("Failed to clear chat history", e);
        alert("Lỗi khi xóa lịch sử. Vui lòng kiểm tra kết nối mạng và thử lại.");
      } finally {
        setIsClearing(false);
      }
    }
  };

  // Basic Intent Detection Logic
  const detectTicketIntent = (text: string) => {
    const lowerText = text.toLowerCase();
    const intentPatterns = [
      { trigger: ['tạo hồ sơ', 'làm đơn', 'xin giấy', 'đăng ký', 'nộp đơn'], type: 'detect' },
      { trigger: ['xác nhận sinh viên'], title: 'Xin giấy xác nhận sinh viên', type: 'Hành chính' },
      { trigger: ['bảng điểm'], title: 'Xin bảng điểm', type: 'Đào tạo' },
      { trigger: ['phúc khảo'], title: 'Phúc khảo điểm thi', type: 'Đào tạo' },
      { trigger: ['bảo lưu'], title: 'Xin bảo lưu kết quả', type: 'Công tác sinh viên' },
      { trigger: ['mượn phòng'], title: 'Đăng ký phòng Lab', type: 'Cơ sở vật chất' }
    ];

    const isIntent = intentPatterns[0].trigger.some(t => lowerText.includes(t));
    if (!isIntent) return null;

    // Find specific type/title
    const specificMatch = intentPatterns.slice(1).find(p => p.trigger.some(t => lowerText.includes(t)));

    return {
      title: specificMatch ? specificMatch.title : '', // Empty title lets user fill it
      type: specificMatch ? specificMatch.type : 'Hành chính',
      description: text // Use original text as initial description
    };
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    // Check for ticket creation intent BEFORE sending to AI
    const detectedIntent = detectTicketIntent(textToSend);
    if (detectedIntent) {
      if (window.confirm(`Hệ thống phát hiện bạn muốn tạo hồ sơ "${detectedIntent.title || 'Mới'}". Bạn có muốn mở form tạo hồ sơ ngay không?`)) {
        setTicketDraft({
          title: detectedIntent.title,
          type: detectedIntent.type,
          description: detectedIntent.description
        });
        setIsModalOpen(true);
        setInput(''); 
        return; 
      }
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    // Store the previous messages for context before updating state
    const history = [...messages];

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Save user message to DB
    if (currentUser?.id) {
       saveChatMessage(currentUser.id, userMsg).catch(err => console.error("Error saving user message", err));
    }

    try {
      const responseText = await sendMessageToGemini(
        userMsg.text, 
        history, // Pass history for context
        knowledgeBase, 
        currentUser || { id: 'guest', name: 'Khách', role: 'STUDENT', email: '' } as User,
        studentProfile
      );
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);

      // Save bot message to DB
      if (currentUser?.id) {
        saveChatMessage(currentUser.id, botMsg).catch(err => console.error("Error saving bot message", err));
      }

    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTicketSubmit = (data: { title: string; type: string; description: string }) => {
    if (onCreateTicket) {
      onCreateTicket(data);
      const successMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: `✅ **Đã tạo hồ sơ thành công!**\n\nTiêu đề: ${data.title}\nLoại: ${data.type}\n\nBạn có thể theo dõi trạng thái tại mục "Hồ sơ của tôi".`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMsg]);
      // Save success message
      if (currentUser?.id) {
        saveChatMessage(currentUser.id, successMsg).catch(err => console.error("Error saving system message", err));
      }
    }
  };

  const openTicketModalWithDraft = (draft: any) => {
    setTicketDraft(draft);
    setIsModalOpen(true);
  };

  const simulateDownload = (fileName: string) => {
    const content = `Đây là nội dung mẫu giả lập của file ${fileName}.\n\nTrong ứng dụng thực tế, file này sẽ được tải về từ server.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName; 
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Custom Message Renderer
  const renderMessageContent = (msg: Message) => {
    if (msg.role === 'user') return <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>;

    // Check for structured JSON response for Ticket Creation
    const jsonData = extractJson(msg.text);

    if (jsonData && jsonData.isTicketRequest) {
      const { ticketData } = jsonData;
      const hasVariables = ticketData.variables && ticketData.variables.length > 0;
      const filledCount = ticketData.formValues ? Object.values(ticketData.formValues).filter(Boolean).length : 0;
      const totalVars = ticketData.variables ? ticketData.variables.length : 0;

      return (
        <div className="mt-3 bg-white p-4 rounded-xl border border-blue-100 shadow-sm w-full">
          <div className="flex items-start gap-3 mb-3">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
               <FileText size={20} />
             </div>
             <div>
               <h3 className="font-bold text-gray-900">{ticketData.title}</h3>
               <p className="text-xs text-gray-500">{ticketData.type}</p>
             </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-3 bg-gray-50 p-3 rounded-lg">
             {ticketData.description || "Chưa có mô tả chi tiết."}
          </div>

          {hasVariables && (
            <div className="space-y-2 mb-4">
               {ticketData.variables?.map((v: any, idx: number) => (
                  <div key={idx} className="flex items-center text-xs">
                     <span className={`w-4 h-4 rounded-full flex items-center justify-center mr-2 shrink-0 ${ticketData.formValues?.[v.name] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {ticketData.formValues?.[v.name] ? <Check size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                     </span>
                     <span className="text-gray-500 w-24 truncate">{v.label}:</span>
                     <span className="font-medium text-gray-800 truncate flex-1">
                        {ticketData.formValues?.[v.name] || '(Trống)'}
                     </span>
                  </div>
               ))}
            </div>
          )}

          <div className="flex gap-2">
             <button 
               onClick={() => openTicketModalWithDraft(ticketData)}
               className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-sm"
             >
               <Edit size={14} className="mr-2" />
               {filledCount > 0 ? "Chỉnh sửa & Nộp đơn" : "Điền thông tin & Nộp đơn"}
             </button>
          </div>
        </div>
      );
    }

    // Default markdown render
    return (
       <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
          <ReactMarkdown
             components={{
                a: ({node, ...props}) => {
                   // Handle file downloads custom syntax
                   if (props.href?.startsWith('download:')) {
                      const fileName = props.href.replace('download:', '');
                      return (
                         <button 
                            onClick={() => simulateDownload(fileName)}
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline mx-1"
                         >
                            <Download size={14} className="mr-1" />
                            {props.children}
                         </button>
                      );
                   }
                   return <a {...props} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" />;
                }
             }}
          >
             {msg.text}
          </ReactMarkdown>
       </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm z-10">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Hỗ trợ trực tuyến
          </h2>
          <p className="text-xs text-gray-500">Sử dụng mô hình Mistral/Gemini tích hợp dữ liệu Khoa</p>
        </div>
        <div className="flex items-center space-x-2">
          {isClearing || isHistoryLoading ? (
             <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs flex items-center animate-pulse">
                <Loader2 size={12} className="mr-1 animate-spin" /> Xử lý...
             </div>
          ) : (
             <button 
               onClick={handleClearChat}
               className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
               title="Xóa lịch sử chat"
             >
               <Trash2 size={18} />
             </button>
          )}
          <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium flex items-center border border-green-100">
             <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
             Online
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-50/30 scroll-smooth">
        {isHistoryLoading ? (
           <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Loader2 size={32} className="animate-spin mb-2 text-blue-500" />
              <p className="text-sm">Đang tải lịch sử trò chuyện...</p>
           </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={msg.id || index} 
                  className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
                    
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${isUser ? 'bg-blue-600 text-white' : 'bg-white text-indigo-600 border border-gray-200'}`}>
                      {isUser ? <UserIcon size={16} /> : <Bot size={16} />}
                    </div>

                    {/* Bubble */}
                    <div className={`
                      flex flex-col p-4 shadow-sm relative group
                      ${isUser 
                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm'
                      }
                    `}>
                      {renderMessageContent(msg)}
                      
                      {/* Timestamp */}
                      <div className={`text-[10px] mt-1.5 opacity-70 ${isUser ? 'text-blue-100 text-right' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex w-full justify-start animate-in fade-in">
                <div className="flex max-w-[80%] flex-row items-start gap-3">
                   <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white text-indigo-600 border border-gray-200 flex items-center justify-center shadow-sm">
                      <Bot size={16} />
                   </div>
                   <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                   </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 z-10">
        
        {/* Quick Suggestions */}
        {messages.length < 3 && (
           <div className="mb-4 overflow-x-auto flex gap-2 pb-2 scrollbar-hide">
              {quickActions.map((action, idx) => (
                 <button
                   key={idx}
                   onClick={() => handleSend(action)}
                   className="whitespace-nowrap px-3 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded-full text-xs font-medium transition-colors"
                 >
                   {action}
                 </button>
              ))}
              <button 
                 onClick={shuffleSuggestions} 
                 className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100"
                 title="Đổi gợi ý khác"
              >
                 <RefreshCw size={14} />
              </button>
           </div>
        )}

        <div className="relative flex items-end gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Nhập câu hỏi của bạn..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-3 text-sm text-gray-800 placeholder-gray-400"
            rows={1}
            style={{ height: 'auto', overflow: 'hidden' }}
            onInput={(e) => {
               const target = e.target as HTMLTextAreaElement;
               target.style.height = 'auto';
               target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-lg mb-0.5 transition-all duration-200 flex-shrink-0 ${
              input.trim() && !isLoading
                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:scale-105 active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        
        <div className="mt-2 flex justify-center text-[10px] text-gray-400">
           <Info size={12} className="mr-1" /> AI có thể mắc sai sót. Vui lòng kiểm tra lại với Văn phòng Khoa.
        </div>
      </div>

      <CreateTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (data) => {
          await handleTicketSubmit(data);
          setIsModalOpen(false);
        }}
        initialData={ticketDraft}
      />
    </div>
  );
};

export default ChatInterface;
