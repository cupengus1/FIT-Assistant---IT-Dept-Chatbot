
import { GoogleGenAI } from "@google/genai";
import { Procedure, User, StudentProfile, Message } from "../types";

// Initialize Gemini
// NOTE: In a real production app, ensure API keys are not exposed to the client directly like this if possible, 
// or use a proxy. Here we follow the instruction to use process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Simulates a Retrieval-Augmented Generation (RAG) system.
 * It searches the provided 'database' (current procedures state) for relevant keywords
 * and appends that information to the system prompt.
 */
const retrieveContext = (query: string, knowledgeBase: Procedure[]): string => {
  const queryLower = query.toLowerCase();
  
  // Simple keyword matching for demo purposes
  const relevantDocs = knowledgeBase.filter(proc => {
    const titleMatch = proc.title.toLowerCase().includes(queryLower);
    const contentMatch = proc.content.toLowerCase().includes(queryLower);
    // Also check for partial matches of keywords
    const keywords = queryLower.split(' ');
    const keywordMatch = keywords.some(k => k.length > 3 && (proc.title.toLowerCase().includes(k) || proc.content.toLowerCase().includes(k)));
    
    return titleMatch || contentMatch || keywordMatch;
  });

  if (relevantDocs.length === 0) {
    return "";
  }

  return relevantDocs.map(doc => {
    const variablesStr = doc.variables && Array.isArray(doc.variables) && doc.variables.length > 0 
      ? `\nCác trường thông tin cần điền (Variables): ${JSON.stringify(doc.variables)}` 
      : '';
    
    // Safety check for requiredForms in case DB returns null
    const forms = Array.isArray(doc.requiredForms) ? doc.requiredForms.join(', ') : '';

    return `--- QUY TRÌNH: ${doc.title} ---\nPhân loại: ${doc.category}\nNội dung:\n${doc.content}\nBiểu mẫu đi kèm: ${forms}${variablesStr}`;
  }).join('\n\n');
};

export const sendMessageToGemini = async (
  userMessage: string,
  chatHistory: Message[],
  knowledgeBase: Procedure[], 
  currentUser: User,
  studentProfile?: StudentProfile
): Promise<string> => {
  try {
    const context = retrieveContext(userMessage, knowledgeBase);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayDisplay = new Date().toLocaleDateString('vi-VN');
    
    // Construct student info string if available
    const studentInfoStr = studentProfile ? `
      THÔNG TIN SINH VIÊN CHI TIẾT (Dùng để điền tự động):
      - Họ tên (name): ${studentProfile.name}
      - Mã số SV (id): ${studentProfile.id}
      - Lớp (className/classId): ${studentProfile.className} (${studentProfile.classId})
      - Giới tính (gender): ${studentProfile.gender}
      - Ngày sinh (dob): ${studentProfile.dob}
      - Nơi sinh (placeOfBirth): ${studentProfile.placeOfBirth}
      - Địa chỉ (address): ${studentProfile.address}
      - CCCD/CMND (identityCard): ${studentProfile.identityCard}
      - Email: ${studentProfile.email}
      - SĐT (phone): ${studentProfile.phone}
      - Trạng thái (status): ${studentProfile.status}
      - Ngành học (majorName): ${studentProfile.majorName}
      - Chuyên ngành (specialization): ${studentProfile.specialization || 'Không'}
    ` : 'Không có thông tin chi tiết sinh viên.';

    const systemInstruction = `
      Bạn là Trợ lý ảo AI của Khoa Công nghệ Thông tin.
      
      THÔNG TIN NGỮ CẢNH:
      - Thời gian hệ thống: ${today} (${todayDisplay})
      - Người dùng: ${currentUser.name} (${currentUser.role})
      ${studentInfoStr}

      Nhiệm vụ của bạn là hỗ trợ sinh viên và giảng viên giải đáp thắc mắc về các quy trình, thủ tục nội bộ.
      
      DỮ LIỆU QUY TRÌNH NỘI BỘ (Knowledge Base):
      ${context ? context : "Không tìm thấy quy trình cụ thể trong cơ sở dữ liệu hiện tại."}
      
      HƯỚNG DẪN TRẢ LỜI & ĐIỀN ĐƠN (AUTO-FILL):
      1. Nếu người dùng muốn thực hiện một thủ tục, hãy TRÍCH XUẤT thông tin và trả về JSON.
         
         Kiểm tra xem quy trình đó có danh sách "Variables" hay không.
         - Nếu có, trích xuất thông tin để điền vào 'formValues'.
         - Auto-fill: Đối chiếu tên biến (Variable Name/Label) với "THÔNG TIN SINH VIÊN". Nếu trùng khớp ý nghĩa, hãy TỰ ĐỘNG ĐIỀN giá trị.
           Quy tắc ánh xạ:
           + 'student_name' / 'Họ và tên' -> Lấy từ Họ tên.
           + 'student_id' / 'Mã sinh viên' / 'MSSV' -> Lấy từ Mã số SV.
           + 'student_class' / 'Lớp' -> Lấy từ Mã lớp hoặc Tên lớp.
           + 'phone_number' / 'SĐT' -> Lấy từ SĐT.
           + 'email' -> Lấy từ Email.
           + 'dob' / 'Ngày sinh' -> Lấy từ Ngày sinh.
           + 'place_of_birth' / 'Nơi sinh' -> Lấy từ Nơi sinh.
         
         - Xử lý NGÀY THÁNG (dataType: 'date'):
           + Nếu người dùng nói "hôm nay", điền: "${today}".
           + Nếu nói "ngày mai", hãy tính toán dựa trên ngày hệ thống.
           + Luôn trả về định dạng YYYY-MM-DD cho trường kiểu date.
         
         Cấu trúc JSON bắt buộc (đặt trong khối \`\`\`json ... \`\`\`):
         {
           "isTicketRequest": true,
           "ticketData": {
             "title": "Tiêu đề ngắn gọn",
             "type": "Loại hồ sơ",
             "description": "Nội dung tóm tắt",
             "variables": [ ... ], // Copy danh sách biến từ Knowledge Base
             "formValues": { 
               "var_name": "Giá trị",
               "date_field": "YYYY-MM-DD" 
             }
           },
           "responseMessage": "Câu trả lời xác nhận."
         }
      
      2. Nếu không phải yêu cầu làm đơn, trả lời bằng văn bản Markdown bình thường.
      3. Nếu có biểu mẫu, dùng format "[Ten_File](download:Ten_File)".
    `;

    // Format chat history for Gemini
    const formattedHistory = chatHistory
      .filter(msg => msg.id !== 'welcome') // Remove local UI-only welcome message
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

    // Append the current user message to the end of the history
    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
      }
    });

    return response.text || "Xin lỗi, hiện tại tôi không thể phản hồi. Vui lòng thử lại sau.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Hệ thống đang gặp sự cố kết nối AI. Vui lòng kiểm tra lại cấu hình API Key hoặc thử lại sau.";
  }
};

/**
 * Analyzes an uploaded document to extract procedure details and variables.
 */
export const analyzeUploadedDocument = async (file: File): Promise<Partial<Procedure>> => {
  try {
    // Convert file to Base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const prompt = `
      Hãy đóng vai một chuyên viên hành chính khoa CNTT.
      Đọc tài liệu được cung cấp (ảnh scan hoặc file PDF).
      
      Nhiệm vụ 1: Trích xuất thông tin chung.
      Nhiệm vụ 2: Xác định các BIẾN SỐ (chỗ trống cần điền).
      Nhiệm vụ 3: TẠO MẪU IN ẤN HTML (Quan trọng).
      
      Hãy chuyển đổi toàn bộ nội dung và bố cục của tài liệu này thành mã HTML & CSS inline (để in trên khổ A4).
      Trong mã HTML này, hãy thay thế các vị trí điền thông tin bằng cú pháp Handlebars tương ứng với biến số đã tìm được.
      Ví dụ: Nếu trong văn bản là "Họ và tên: .................", hãy đổi thành "Họ và tên: {{studentName}}".
      
      Output JSON (No Markdown):
      {
        "title": "Tên quy trình",
        "category": "Phân loại",
        "content": "Tóm tắt các bước...",
        "requiredForms": ["Tên file nếu có"],
        "variables": [
           { 
             "name": "key_bien", 
             "label": "Tên hiển thị", 
             "required": true,
             "dataType": "text"
           }
        ],
        "exportTemplate": "<!DOCTYPE html><html>... (Mã HTML trọn vẹn tái hiện lại tài liệu, đã chèn biến {{variable}}) ...</html>"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const jsonString = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(jsonString);

    return {
      title: data.title,
      category: data.category,
      content: data.content,
      requiredForms: data.requiredForms || [],
      variables: data.variables || [],
      exportTemplate: data.exportTemplate || ''
    };

  } catch (error) {
    console.error("Document Analysis Error:", error);
    throw new Error("Không thể phân tích tài liệu. Vui lòng thử lại hoặc nhập thủ công.");
  }
};
