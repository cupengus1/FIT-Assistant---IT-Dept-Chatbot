import React, { useState, useRef, useEffect } from 'react';
import { Procedure, ProcedureVariable } from '../types';
import { BookOpen, Plus, Edit2, Trash2, Save, X, FileText, Loader2, Sparkles, Variable, GripVertical, Calendar, Type, Hash, Search, Printer, LayoutTemplate, Eye, Code, PenTool, Minus, Maximize, Monitor, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, Palette, Eraser, ChevronDown, Paperclip } from 'lucide-react';
import { analyzeUploadedDocument } from '../services/geminiService';
import ConfirmationModal from './ConfirmationModal';

interface DocumentManagementProps {
  documents: Procedure[];
  onAdd: (doc: Procedure) => Promise<void> | void;
  onUpdate: (doc: Procedure) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

// A4 size at 96 DPI: 210mm x 297mm ~= 794px x 1123px
// We use fixed pixels to ensure 1:1 mapping between editor and print output across devices
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

const DocumentManagement: React.FC<DocumentManagementProps> = ({ documents, onAdd, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<Partial<Procedure>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'variables' | 'template'>('info');
  const [visualEditMode, setVisualEditMode] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.7); // Default to a smaller scale to fit
  const [docHeight, setDocHeight] = useState(A4_HEIGHT_PX); // Dynamic document height
  
  // Loading States
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string, title: string}>({
    isOpen: false,
    id: '',
    title: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Responsive Scale Logic using ResizeObserver
  useEffect(() => {
    if (activeTab !== 'template') return;

    // Determine which container to measure for scaling
    // In Visual Mode: measure the editor container itself
    // In Code Mode: measure the preview panel container (side-by-side)
    const targetContainer = visualEditMode ? editorContainerRef.current : previewContainerRef.current;

    if (!targetContainer) return;

    const updateScale = () => {
       if (!targetContainer) return;
       const { clientWidth, clientHeight } = targetContainer;
       
       // Add padding to ensure it doesn't touch edges visually
       // Increased paddingX to 60 to safely account for scrollbars and padding
       const paddingX = visualEditMode ? 60 : 20; 
       const paddingY = 20;
       
       const availableWidth = Math.max(0, clientWidth - paddingX);
       const availableHeight = Math.max(0, clientHeight - paddingY);
       
       const scaleX = availableWidth / A4_WIDTH_PX;
       const scaleY = availableHeight / A4_HEIGHT_PX;
       
       let optimalScale = 1;

       if (visualEditMode) {
           // In Visual Edit Mode: Prefer "Fit Width" to maximize readability and editing area
           // This allows vertical scrolling which is natural for editing
           optimalScale = scaleX;
       } else {
           // In Preview Mode (side panel): Prefer "Fit Page" (min of X and Y) to see the whole layout at a glance
           optimalScale = Math.min(scaleX, scaleY);
       }
       
       // Clamp scale to reasonable limits
       optimalScale = Math.min(Math.max(optimalScale, 0.25), 1.5);
       
       setPreviewScale(parseFloat(optimalScale.toFixed(2)));
    };

    // Initial calculation
    updateScale();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver((entries) => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (!Array.isArray(entries) || !entries.length) return;
            updateScale();
        }, 50);
    });

    resizeObserver.observe(targetContainer);

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, [visualEditMode, activeTab]);

  // Helper: Generate Default Template String
  const generateDefaultTemplate = (doc: Partial<Procedure>) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Mẫu In Ấn</title>
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
  
  <h2 class="title">ĐƠN ${doc.title ? doc.title.toUpperCase() : '{{TITLE}}'}</h2>
  
  <div class="content">
    <p><strong>Kính gửi:</strong> Ban Chủ nhiệm Khoa Công nghệ Thông tin</p>
    <p>Tôi tên là: <strong>{{studentName}}</strong></p>
    <p>Mã số sinh viên: <strong>{{studentId}}</strong></p>
    
    <p>Tôi làm đơn này xin trình bày nội dung sau:</p>
    
    <div style="margin-left: 20px;">
       ${doc.variables?.map(v => `<p><strong>${v.label}:</strong> {{${v.name}}}</p>`).join('\n       ') || '<p>{{description}}</p>'}
    </div>
    
    <p>Kính mong Quý Khoa xem xét và giải quyết yêu cầu của tôi.</p>
    <p>Tôi xin chân thành cảm ơn.</p>
  </div>
  
  <div class="signature-section">
     <div class="signature-box"></div>
     <div class="signature-box">
       <p><i>{{date}}</i></p>
       <p><strong>Người làm đơn</strong></p>
       <br><br><br>
       <p>{{studentName}}</p>
     </div>
  </div>
</body>
</html>`;
  };

  // Helper: Sync Visual Editor content to State
  const syncVisualContent = () => {
    if (visualEditMode && iframeRef.current && iframeRef.current.contentDocument) {
        const doc = iframeRef.current.contentDocument;
        
        // Remove our injected helper styles before saving
        const overrideStyle = doc.getElementById("visual-editor-overrides");
        if (overrideStyle) overrideStyle.remove();
        
        // Clean up contentEditable attributes
        doc.body.removeAttribute("contenteditable");
        doc.body.removeAttribute("spellcheck");
        
        // Get the clean HTML
        const htmlContent = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
        
        // Restore editor state in case user continues editing without closing
        if (overrideStyle && doc.head) doc.head.appendChild(overrideStyle);
        doc.body.contentEditable = "true";
        doc.body.spellcheck = false;

        setCurrentDoc(prev => ({ ...prev, exportTemplate: htmlContent }));
        return htmlContent;
    }
    return currentDoc.exportTemplate;
  };

  const handleTabChange = (tab: 'info' | 'variables' | 'template') => {
    if (activeTab === 'template' && visualEditMode) {
        syncVisualContent();
    }
    setActiveTab(tab);
  };

  // Auto-generate template when switching to Template tab if it's empty
  useEffect(() => {
    if (activeTab === 'template') {
       setCurrentDoc(prev => {
          if (!prev.exportTemplate || !prev.exportTemplate.trim()) {
             return { ...prev, exportTemplate: generateDefaultTemplate(prev) };
          }
          return prev;
       });
    }
  }, [activeTab]);

  // Sync state to Iframe DOM for Visual Editor
  useEffect(() => {
    if (activeTab === 'template' && visualEditMode && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
         let initialContent = currentDoc.exportTemplate;
         if (!initialContent || !initialContent.trim()) {
            initialContent = generateDefaultTemplate(currentDoc);
            setCurrentDoc(prev => ({ ...prev, exportTemplate: initialContent }));
         }

         doc.open();
         doc.write(initialContent);
         doc.close();

         let meta = doc.querySelector('meta[name="viewport"]');
         if (!meta) {
            meta = doc.createElement('meta');
            meta.setAttribute('name', 'viewport');
            meta.setAttribute('content', 'width=device-width, initial-scale=1');
            if (doc.head) doc.head.appendChild(meta);
         }

         const styleId = "visual-editor-overrides";
         let style = doc.getElementById(styleId);
         if (!style) {
            style = doc.createElement('style');
            style.id = styleId;
            style.textContent = `
               * { box-sizing: border-box; }
               html { 
                   min-height: 100%; 
                   width: 100%; 
                   background-color: white;
                   overflow: hidden; /* Force hidden to prevent iframe scrollbars */
               }
               body { 
                  min-height: auto;
                  margin: 0 !important; 
                  padding: 2cm !important; 
                  max-width: none !important; 
                  width: 100% !important;
                  overflow: hidden; /* Force hidden to prevent iframe scrollbars */
               }
               p, div, h1, h2, h3 { outline: 1px dashed transparent; }
               p:hover, div:hover, h1:hover, h2:hover { outline-color: #e5e7eb; }
            `;
            if (doc.head) doc.head.appendChild(style);
         }

         doc.body.contentEditable = "true";
         doc.body.spellcheck = false;

         const updateHeight = () => {
             if (!doc || !doc.body || !doc.documentElement) return;

             const body = doc.body;
             const html = doc.documentElement;
             
             // Calculate max height to ensure we catch all content
             const contentHeight = Math.max(
                 body.scrollHeight, 
                 body.offsetHeight,
                 html.scrollHeight,
                 html.offsetHeight
             );
             
             // Ensure at least A4 height
             const newHeight = Math.max(contentHeight, A4_HEIGHT_PX);
             
             setDocHeight(prev => {
                // Debounce small changes (less than 2px) to prevent flicker and excessive updates
                if (Math.abs(prev - newHeight) < 2) return prev;
                return newHeight;
             });
         };

         const handleInput = () => {
             updateHeight();
         };
         
         doc.querySelectorAll('a').forEach(a => {
             a.addEventListener('click', (e) => e.preventDefault());
         });

         let resizeTimeout: ReturnType<typeof setTimeout>;
         const observer = new ResizeObserver((entries) => {
             clearTimeout(resizeTimeout);
             resizeTimeout = setTimeout(() => {
                if (!Array.isArray(entries) || !entries.length) return;
                updateHeight();
             }, 50);
         });
         
         // Only observe body to reduce noise
         observer.observe(doc.body);
         
         doc.body.addEventListener('input', handleInput);
         doc.addEventListener('keyup', updateHeight);
         doc.addEventListener('mouseup', updateHeight);
         
         // Poll for height changes (fallback for images loading etc)
         const intervalId = setInterval(updateHeight, 1000);

         // Initial Update
         setTimeout(updateHeight, 200);

         return () => {
            observer.disconnect();
            clearInterval(intervalId);
            clearTimeout(resizeTimeout);
            if (doc && doc.body) {
                doc.body.removeEventListener('input', handleInput);
                doc.removeEventListener('keyup', updateHeight);
                doc.removeEventListener('mouseup', updateHeight);
            }
         }
      }
    }
  }, [visualEditMode, activeTab]);

  const handleAddNew = () => {
    setCurrentDoc({ 
      id: `proc_${Date.now()}`, 
      variables: [] 
    });
    setActiveTab('info');
    setIsEditing(false);
    setVisualEditMode(false);
  };

  const handleEdit = (doc: Procedure) => {
    setCurrentDoc({ ...doc });
    setActiveTab('info');
    setIsEditing(true);
    setVisualEditMode(false);
  };

  const confirmDelete = (doc: Procedure) => {
    setDeleteModal({
      isOpen: true,
      id: doc.id,
      title: doc.title
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
      // alert is handled in App.tsx but good to keep consistent behavior
    } finally {
      setIsDeleting(false);
    }
  };

  const saveDocument = async (shouldClose: boolean = true) => {
    if (!currentDoc.title) return alert("Vui lòng nhập tên quy trình");

    setIsSaving(true);

    try {
        let finalTemplate = currentDoc.exportTemplate;
        
        // Force sync from Iframe if we are in the template tab and visual mode is active
        if (activeTab === 'template' && visualEditMode && iframeRef.current) {
            finalTemplate = syncVisualContent();
        }

        let finalDoc = { ...currentDoc, exportTemplate: finalTemplate };

        if (isEditing) {
          await onUpdate(finalDoc as Procedure);
          // CRITICAL: Update local state to ensure it matches DB
          setCurrentDoc(finalDoc); 
        } else {
          await onAdd(finalDoc as Procedure);
          if (!shouldClose) {
             setIsEditing(true); // Switch to editing mode after creation
             // CRITICAL: Update local state to ensure it matches DB
             setCurrentDoc(finalDoc); 
          }
        }
        
        if (shouldClose) {
            setCurrentDoc({});
            setIsEditing(false);
            setVisualEditMode(false);
        } else {
            // Provide immediate feedback to user that data is safe in DB
            let message = "Đã lưu dữ liệu vào hệ thống!";
            if (activeTab === 'template') message = "Đã lưu mẫu in ấn vào hệ thống thành công!";
            if (activeTab === 'variables') message = "Đã lưu cấu hình biến thành công!";
            alert(message);
        }
    } catch (e) {
        console.error(e);
        alert("Lỗi khi lưu dữ liệu vào hệ thống.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleSave = () => saveDocument(true);
  const handleQuickSave = () => saveDocument(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const data = await analyzeUploadedDocument(file);
      setCurrentDoc(prev => ({
        ...prev,
        ...data,
        // If the AI generated a template, use it. Otherwise, keep existing or default.
        exportTemplate: data.exportTemplate || prev.exportTemplate, 
        variables: [
           ...(prev.variables || []),
           ...(data.variables || [])
        ]
      }));
      if (data.variables && data.variables.length > 0) {
         // Optionally confirm to user
         alert("Đã phân tích tài liệu! AI đã tạo ra bản thảo mẫu in ấn dựa trên file của bạn. Hãy kiểm tra tab 'Mẫu in ấn'.");
         handleTabChange('variables');
      }
    } catch (err) {
      alert("Lỗi phân tích tài liệu: " + err);
    } finally {
      setIsAnalyzing(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addVariable = () => {
    setCurrentDoc(prev => ({
      ...prev,
      variables: [...(prev.variables || []), { name: '', label: '', required: false, dataType: 'text' }]
    }));
  };

  const updateVariable = (index: number, field: keyof ProcedureVariable, value: any) => {
    const newVars = [...(currentDoc.variables || [])];
    newVars[index] = { ...newVars[index], [field]: value };
    setCurrentDoc(prev => ({ ...prev, variables: newVars }));
  };

  const removeVariable = (index: number) => {
    const newVars = [...(currentDoc.variables || [])];
    newVars.splice(index, 1);
    setCurrentDoc(prev => ({ ...prev, variables: newVars }));
  };

  // Safe Execution of Commands for Iframe
  const execCmd = (command: string, value: string = '') => {
     if (visualEditMode && iframeRef.current && iframeRef.current.contentDocument) {
         const win = iframeRef.current.contentWindow;
         const doc = iframeRef.current.contentDocument;
         
         if (win) win.focus(); // Ensure focus is on the iframe to apply command
         doc.execCommand(command, false, value);
     }
  };

  const insertAtCursor = (text: string) => {
    if (visualEditMode) {
        if (iframeRef.current && iframeRef.current.contentDocument) {
            const doc = iframeRef.current.contentDocument;
            const win = iframeRef.current.contentWindow;
            if(win) win.focus();

            const success = doc.execCommand('insertText', false, text);
            
            if (!success) {
                const selection = win?.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(doc.createTextNode(text));
                    range.collapse(false);
                } else {
                    doc.body.innerHTML += text;
                }
            }
        }
    } else {
        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const currentVal = currentDoc.exportTemplate || '';
            const newVal = currentVal.substring(0, start) + text + currentVal.substring(end);
            setCurrentDoc({ ...currentDoc, exportTemplate: newVal });
            
            setTimeout(() => {
                textareaRef.current?.focus();
                textareaRef.current?.setSelectionRange(start + text.length, start + text.length);
            }, 0);
        }
    }
  };

  const toggleVisualMode = () => {
    if (visualEditMode) {
      syncVisualContent();
    } else {
      setDocHeight(A4_HEIGHT_PX); // Reset to default A4 when entering
    }
    setVisualEditMode(!visualEditMode);
  };

  // --- Render List View ---
  if (!isEditing && !currentDoc.id) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <BookOpen className="mr-2 text-blue-600" /> Quản lý Tài liệu & Tri thức AI
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Dữ liệu tại đây sẽ được AI sử dụng trực tiếp để trả lời sinh viên (RAG).
            </p>
          </div>
          <button 
            onClick={handleAddNew}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium text-sm whitespace-nowrap"
          >
            <Plus size={18} />
            <span>Thêm Quy trình mới</span>
          </button>
        </div>

        <div className="relative">
           <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
           <input 
             className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
             placeholder="Tìm kiếm quy trình..."
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {documents.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase())).map(doc => (
            <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col h-full group">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border border-blue-100">
                    {doc.category}
                  </span>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(doc)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Chỉnh sửa">
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => confirmDelete(doc)} 
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" 
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3rem]">{doc.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-3 mb-4 h-[4.5rem]">
                  {doc.content}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {doc.requiredForms.length > 0 && (
                     <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                       <FileText size={12} className="mr-1" /> {doc.requiredForms.length} biểu mẫu
                     </div>
                  )}
                  {doc.variables && doc.variables.length > 0 && (
                     <div className="flex items-center text-xs text-indigo-500 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                       <Variable size={12} className="mr-1" /> {doc.variables.length} biến số
                     </div>
                  )}
                  {doc.exportTemplate && (
                     <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                       <Printer size={12} className="mr-1" /> Có mẫu in
                     </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={handleExecuteDelete}
          title="Xóa Quy trình"
          message={`Bạn có chắc chắn muốn xóa quy trình "${deleteModal.title}"? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa quy trình"
          isLoading={isDeleting}
        />
      </div>
    );
  }

  // --- Render Edit Form ---
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col animate-in fade-in zoom-in-95 duration-200 h-full">
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
        <div>
           <h3 className="text-lg font-bold text-gray-800">
             {currentDoc.id?.startsWith('proc_') && !documents.find(d => d.id === currentDoc.id) ? 'Thêm Quy trình mới' : 'Chỉnh sửa Quy trình'}
           </h3>
           <div className="flex items-center space-x-2 mt-1">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="text-xs flex items-center bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors border border-indigo-200 font-medium"
              >
                {isAnalyzing ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
                AI Scan từ File
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.docx,.txt" 
                onChange={handleUpload}
              />
           </div>
        </div>
        <button onClick={() => { setIsEditing(false); setCurrentDoc({}); }} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white shrink-0">
        <button 
          onClick={() => handleTabChange('info')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Thông tin chung
        </button>
        <button 
          onClick={() => handleTabChange('variables')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'variables' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          (x) Biến số (Auto-fill)
        </button>
        <button 
          onClick={() => handleTabChange('template')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'template' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <LayoutTemplate size={14} className="inline mr-1 mb-0.5"/>
          Mẫu in ấn
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden h-full">
        
        {/* TAB 1: INFO */}
        {activeTab === 'info' && (
          <div className="flex flex-col h-full">
             <div className="flex flex-col h-full p-6 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên quy trình <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={currentDoc.title || ''}
                      onChange={e => setCurrentDoc({...currentDoc, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                      placeholder="Ví dụ: Xin giấy xác nhận sinh viên"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phân loại</label>
                    <select
                      value={currentDoc.category || 'Hành chính'}
                      onChange={e => setCurrentDoc({...currentDoc, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                    >
                      <option>Hành chính</option>
                      <option>Đào tạo</option>
                      <option>Cơ sở vật chất</option>
                      <option>Công tác sinh viên</option>
                      <option>Khác</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col flex-1 min-h-0 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung / Các bước thực hiện</label>
                  <div className="flex-1 relative border border-gray-300 rounded-lg shadow-sm bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all overflow-hidden">
                     <textarea
                        value={currentDoc.content || ''}
                        onChange={e => setCurrentDoc({...currentDoc, content: e.target.value})}
                        className="absolute inset-0 w-full h-full px-4 py-3 outline-none resize-none text-base leading-relaxed"
                        placeholder="Mô tả chi tiết các bước sinh viên cần làm..."
                      />
                  </div>
                </div>

                <div className="shrink-0 flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                         <Paperclip size={14} className="mr-1"/> File biểu mẫu đính kèm (nếu có)
                      </label>
                      <input
                        type="text"
                        value={currentDoc.requiredForms?.join(', ') || ''}
                        onChange={e => setCurrentDoc({...currentDoc, requiredForms: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-gray-50/50"
                        placeholder="VD: Mau_Don_01.docx, Mau_02.pdf"
                      />
                    </div>

                    <div className="pb-0.5">
                        <button 
                            onClick={handleQuickSave}
                            disabled={isSaving}
                            className="flex items-center px-6 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200 font-medium text-sm disabled:opacity-50 shadow-sm"
                        >
                            {isSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                            Lưu thông tin
                        </button>
                    </div>
                </div>
             </div>
          </div>
        )}

        {/* TAB 2: VARIABLES */}
        {activeTab === 'variables' && (
          <div className="max-w-4xl mx-auto w-full p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">
                Định nghĩa các trường thông tin cần sinh viên điền. AI sẽ dùng thông tin này để tạo Form nhập liệu.
              </p>
              <button onClick={addVariable} className="text-sm flex items-center text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors font-medium">
                <Plus size={16} className="mr-1" /> Thêm biến
              </button>
            </div>

            <div className="space-y-3">
              {(currentDoc.variables || []).map((v, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm group hover:border-blue-300 transition-colors">
                  <div className="mt-3 text-gray-400 cursor-grab">
                    <GripVertical size={16} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Mã biến (Key)</label>
                      <div className="relative">
                        <Hash size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input 
                          value={v.name}
                          onChange={e => updateVariable(idx, 'name', e.target.value)}
                          placeholder="student_id"
                          className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-1">
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Tên hiển thị (Label)</label>
                      <div className="relative">
                        <Type size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input 
                          value={v.label}
                          onChange={e => updateVariable(idx, 'label', e.target.value)}
                          placeholder="Mã sinh viên"
                          className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Kiểu dữ liệu</label>
                      <select
                        value={v.dataType || 'text'}
                        onChange={e => updateVariable(idx, 'dataType', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="text">Văn bản (Text)</option>
                        <option value="number">Số (Number)</option>
                        <option value="date">Ngày tháng (Date)</option>
                      </select>
                    </div>

                    <div className="flex items-center mt-6 space-x-4">
                      <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={v.required}
                          onChange={e => updateVariable(idx, 'required', e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span>Bắt buộc</span>
                      </label>
                      
                      <button 
                        onClick={() => removeVariable(idx)}
                        className="text-red-400 hover:text-red-600 ml-auto p-1 rounded hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {(currentDoc.variables || []).length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 bg-gray-50">
                  Chưa có biến số nào được định nghĩa.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
                <button 
                    onClick={handleQuickSave}
                    disabled={isSaving}
                    className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200 font-medium text-sm disabled:opacity-50"
                >
                    {isSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                    Lưu cấu hình biến
                </button>
            </div>
          </div>
        )}

        {/* TAB 3: TEMPLATE EDITOR (VISUAL & CODE) */}
        {activeTab === 'template' && (
          <div className="flex flex-col w-full p-2 h-full overflow-hidden">
             
             <div className="flex flex-col gap-2 mb-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm shrink-0">
                
                {visualEditMode && (
                  <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 pb-2 mb-1">
                      <div className="flex items-center bg-gray-50 rounded p-1 border border-gray-100 shadow-sm">
                          <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700 transition-all" title="In đậm"><Bold size={14} /></button>
                          <button onClick={() => execCmd('italic')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700 transition-all" title="In nghiêng"><Italic size={14} /></button>
                          <button onClick={() => execCmd('underline')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700 transition-all" title="Gạch chân"><Underline size={14} /></button>
                          <button onClick={() => execCmd('removeFormat')} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-gray-500 ml-1 transition-all" title="Xóa định dạng"><Eraser size={14} /></button>
                      </div>

                      <div className="w-px h-6 bg-gray-200 mx-1"></div>

                      <div className="flex items-center bg-gray-50 rounded p-1 border border-gray-100 shadow-sm">
                          <button onClick={() => execCmd('justifyLeft')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700 transition-all" title="Căn trái"><AlignLeft size={14} /></button>
                          <button onClick={() => execCmd('justifyCenter')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700 transition-all" title="Căn giữa"><AlignCenter size={14} /></button>
                          <button onClick={() => execCmd('justifyRight')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700 transition-all" title="Căn phải"><AlignRight size={14} /></button>
                          <button onClick={() => execCmd('justifyFull')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700 transition-all" title="Căn đều"><AlignJustify size={14} /></button>
                      </div>

                      <div className="w-px h-6 bg-gray-200 mx-1"></div>

                      <div className="flex items-center space-x-2">
                        <select onChange={(e) => execCmd('fontSize', e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1 h-8 bg-white outline-none focus:border-blue-500 cursor-pointer hover:border-blue-400">
                           <option value="3">Cỡ chữ: Bình thường</option>
                           <option value="1">Nhỏ</option>
                           <option value="5">Lớn</option>
                           <option value="7">Rất lớn (Tiêu đề)</option>
                        </select>
                        <div className="relative group flex items-center">
                           <div className="h-8 w-8 rounded border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 overflow-hidden relative shadow-sm" title="Màu chữ">
                             <Palette size={16} className="text-gray-600"/>
                             <input type="color" onChange={(e) => execCmd('foreColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
                           </div>
                        </div>
                      </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 mr-2 uppercase tracking-wide">Chèn biến:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button onClick={() => insertAtCursor('{{title}}')} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 hover:shadow-sm rounded text-xs border border-gray-300 text-gray-700 font-mono transition-all" title="Tiêu đề quy trình">Tiêu đề</button>
                    <button onClick={() => insertAtCursor('{{studentName}}')} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 hover:shadow-sm rounded text-xs border border-gray-300 text-gray-700 font-mono transition-all" title="Tên sinh viên từ hồ sơ">Tên SV</button>
                    <button onClick={() => insertAtCursor('{{studentId}}')} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 hover:shadow-sm rounded text-xs border border-gray-300 text-gray-700 font-mono transition-all" title="Mã số sinh viên">MSSV</button>
                    <button onClick={() => insertAtCursor('{{date}}')} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 hover:shadow-sm rounded text-xs border border-gray-300 text-gray-700 font-mono transition-all" title="Ngày hiện tại">Ngày</button>
                    <button onClick={() => insertAtCursor('{{description}}')} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 hover:shadow-sm rounded text-xs border border-gray-300 text-gray-700 font-mono transition-all" title="Nội dung chi tiết/Lý do">Mô tả</button>
                  </div>
                  
                  {(currentDoc.variables || []).length > 0 && (
                    <>
                      <div className="w-px h-4 bg-gray-300 mx-1"></div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(currentDoc.variables || []).map(v => (
                          <button 
                            key={v.name}
                            onClick={() => insertAtCursor(`{{${v.name}}}`)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 hover:shadow-sm rounded text-xs border border-indigo-200 text-indigo-700 font-mono flex items-center transition-all"
                          >
                            <Variable size={10} className="mr-1"/> {v.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
             </div>

             <div className="flex-1 flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
                
                <div className={`flex flex-col border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white ${visualEditMode ? 'h-full w-full' : 'h-full lg:w-2/5'}`}>
                    <div className="flex justify-between items-center bg-gray-100 px-3 py-2 border-b border-gray-300 shrink-0">
                       <span className="text-xs font-semibold text-gray-500">
                          {visualEditMode ? 'Soạn thảo trực quan (WYSIWYG)' : 'Soạn thảo HTML & CSS'}
                       </span>
                       <div className="flex space-x-2">
                           <button
                             onClick={handleQuickSave}
                             disabled={isSaving}
                             className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-blue-50 text-blue-700 font-medium disabled:opacity-50 shadow-sm"
                             title="Lưu mẫu in ấn hiện tại"
                           >
                              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                              <span>Lưu mẫu</span>
                           </button>

                           {!visualEditMode && (
                             <button
                               onClick={() => setCurrentDoc(prev => ({ ...prev, exportTemplate: generateDefaultTemplate(currentDoc) }))} 
                               className="flex items-center space-x-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 text-blue-600 shadow-sm"
                               title="Tải lại mẫu mặc định"
                             >
                                <Sparkles size={12} />
                                <span>Mẫu mặc định</span>
                             </button>
                           )}
                           <button 
                             onClick={toggleVisualMode}
                             className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${visualEditMode ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'}`}
                           >
                              {visualEditMode ? <Code size={14} className="mr-1"/> : <PenTool size={14} className="mr-1"/>}
                              <span>{visualEditMode ? 'Quay lại Mã nguồn' : 'Chế độ Sửa trực quan'}</span>
                           </button>
                       </div>
                    </div>
                    
                    {/* Fixed: Moved editorContainerRef to parent div to avoid ResizeObserver loops caused by scrollbars on child */}
                    <div ref={editorContainerRef} className="flex-1 relative bg-gray-50 overflow-hidden">
                       {visualEditMode ? (
                          <div className="w-full p-4 md:p-6 bg-gray-200/50 flex flex-col items-center h-full overflow-auto">
                              <div 
                                  className="bg-white shadow-2xl transition-transform ease-out duration-200"
                                  style={{
                                      width: `${A4_WIDTH_PX * previewScale}px`,
                                      height: `${docHeight * previewScale}px`,
                                      flexShrink: 0
                                  }}
                              >
                                  <iframe 
                                    ref={iframeRef}
                                    scrolling="no"
                                    style={{ 
                                      width: `${A4_WIDTH_PX}px`, 
                                      height: `${docHeight}px`,
                                      transform: `scale(${previewScale})`, 
                                      transformOrigin: 'top left',
                                      border: 'none',
                                    }}
                                    title="Visual Editor"
                                  />
                              </div>
                          </div>
                       ) : (
                          <textarea
                            ref={textareaRef}
                            value={currentDoc.exportTemplate || ''}
                            onChange={e => setCurrentDoc({...currentDoc, exportTemplate: e.target.value})}
                            className="w-full h-full p-4 font-mono text-sm bg-gray-900 text-green-400 outline-none resize-none leading-relaxed"
                            placeholder="Nhập mã HTML tại đây... (Nếu trống, hãy chuyển sang chế độ Trực quan để tạo mẫu mặc định)"
                            spellCheck={false}
                          />
                       )}
                    </div>
                </div>

                {!visualEditMode && (
                  <div ref={previewContainerRef} className="hidden lg:flex lg:w-3/5 flex-col border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-gray-100 h-full">
                     <div className="bg-gray-200 px-3 py-2 border-b border-gray-300 flex justify-between items-center shrink-0">
                        <span className="text-xs font-bold text-gray-600 flex items-center">
                           <Eye size={14} className="mr-1"/> Xem trước (A4)
                        </span>
                        <div className="flex items-center space-x-1 bg-white rounded px-1 border border-gray-300 shadow-sm">
                           <button onClick={() => setPreviewScale(Math.max(0.3, previewScale - 0.1))} className="p-1 hover:text-blue-600 hover:bg-gray-50 rounded"><Minus size={12}/></button>
                           <span className="text-[10px] w-8 text-center font-medium">{Math.round(previewScale * 100)}%</span>
                           <button onClick={() => setPreviewScale(Math.min(1.5, previewScale + 0.1))} className="p-1 hover:text-blue-600 hover:bg-gray-50 rounded"><Plus size={12}/></button>
                        </div>
                     </div>
                     <div className="flex-1 overflow-auto p-10 flex bg-gray-200/50">
                        <div 
                           className="bg-white shadow-xl transition-transform ease-out duration-200 m-auto"
                           style={{ 
                             width: `${A4_WIDTH_PX * previewScale}px`, 
                             height: `${A4_HEIGHT_PX * previewScale}px`,
                             flexShrink: 0
                           }}
                        >
                          <iframe
                            srcDoc={currentDoc.exportTemplate || generateDefaultTemplate(currentDoc)}
                            className="w-full h-full border-none pointer-events-none"
                            style={{
                                width: `${A4_WIDTH_PX}px`, 
                                height: `${A4_HEIGHT_PX}px`,
                                transform: `scale(${previewScale})`,
                                transformOrigin: 'top left'
                            }}
                            title="Preview"
                          />
                        </div>
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}

      </div>

      <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center shrink-0 sticky bottom-0 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="text-xs text-gray-500 italic">
          {isEditing ? `Đang chỉnh sửa: ${currentDoc.id}` : 'Đang tạo mới...'}
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => { setIsEditing(false); setCurrentDoc({}); }}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors flex items-center disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
            Lưu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentManagement;