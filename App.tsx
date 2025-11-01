
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob } from "@google/genai";
import Toolbar from './components/Toolbar';
import Editor from './components/Editor';
import MenuBar from './components/MenuBar';
import SourceCodeModal from './components/SourceCodeModal';
import WordCountModal from './components/WordCountModal';
import UrlInputModal from './components/UrlInputModal';
import SavedDocumentsView from './components/SavedDocumentsView';
import CommentsSidebar from './components/CommentsSidebar';
import SettingsSidebar from './components/SettingsSidebar';
import SpecialCharactersModal from './components/SpecialCharactersModal';
import StatusBar from './components/StatusBar';
import ObjectWrapper from './components/ObjectWrapper';
import FloatingToolbar from './components/FloatingToolbar';
import CommentInputModal from './components/CommentInputModal';
import TranscriptionUI from './components/TranscriptionUI';
import { translations, Language } from './lib/translations';


export interface Comment {
  id: string;
  text: string;
  createdAt: number;
  resolved: boolean;
  selectionId: string;
}

export interface Doc {
  id:string;
  name: string;
  content: string;
  comments: Comment[];
  createdAt: number;
  updatedAt: number;
}

export interface WordCountStats {
  words: number;
  characters: number;
}

interface CopiedFormatting {
  fontName: string;
  fontSize: string;
  foreColor: string;
  hiliteColor: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}

export type ShapeType = 'textbox' | 'rectangle' | 'circle' | 'triangle';
export type ActivePanel = 'link' | 'image' | 'table' | 'findReplace' | 'shape' | null;

export interface ImageOptions {
    src: string;
    width: string;
    height: string;
    align: 'none' | 'left' | 'center' | 'right';
}

export type PageSize = 'Letter' | 'A4' | 'Legal';
export type PageOrientation = 'portrait' | 'landscape';

const AUTOSAVE_INTERVAL = 2500; // 2.5 seconds

// TTS Audio Decoding Helper Functions
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [view, setView] = useState<'editor' | 'savedDocuments'>('editor');
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [content, setContent] = useState<string>('<p>...</p>');
  const [comments, setComments] = useState<Comment[]>([]);
  
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [editingElement, setEditingElement] = useState<HTMLElement | null>(null);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [floatingToolbar, setFloatingToolbar] = useState<{ top: number; left: number } | null>(null);

  const [isSourceCodeVisible, setIsSourceCodeVisible] = useState(false);
  const [isWordCountVisible, setIsWordCountVisible] = useState(false);
  const [isSavePromptVisible, setIsSavePromptVisible] = useState(false);
  const [isCommentsSidebarVisible, setIsCommentsSidebarVisible] = useState(false);
  const [isSpecialCharVisible, setIsSpecialCharVisible] = useState(false);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [isTranscriptionUIActive, setIsTranscriptionUIActive] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  
  const [zoomLevel, setZoomLevel] = useState(100);
  const [wordCountStats, setWordCountStats] = useState<WordCountStats>({ words: 0, characters: 0 });

  const [isFormatPainterActive, setIsFormatPainterActive] = useState(false);
  const [copiedFormatting, setCopiedFormatting] = useState<CopiedFormatting | null>(null);

  const [pageSize, setPageSize] = useState<PageSize>('Letter');
  const [pageOrientation, setPageOrientation] = useState<PageOrientation>('portrait');

  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const autoSaveTimerRef = useRef<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);


  const t = useMemo(() => {
    return (key: string, replacements?: { [key: string]: string | number }) => {
        let translation = key.split('.').reduce((obj, k) => obj?.[k], translations[language]);
        if (typeof translation !== 'string') {
            console.warn(`Translation key not found: ${key}`);
            translation = key.split('.').reduce((obj, k) => obj?.[k], translations.en);
        }
        
        if (typeof translation !== 'string') {
          return key;
        }
        
        if (replacements) {
            Object.keys(replacements).forEach(rKey => {
                translation = (translation as string).replace(`{{${rKey}}}`, String(replacements[rKey]));
            });
        }
        return translation;
    };
  }, [language]);

  useEffect(() => {
    if (process.env.API_KEY) {
      aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
  }, []);

  useEffect(() => {
    try {
      const savedDocs = localStorage.getItem('textEditorDocs');
      if (savedDocs) {
        setDocuments(JSON.parse(savedDocs));
      }
    } catch (error) {
      console.error("Failed to load documents from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('textEditorDocs', JSON.stringify(documents));
    } catch (error) {
      console.error("Failed to save documents to localStorage:", error);
    }
  }, [documents]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const updateWordCount = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const characters = text.length;
    setWordCountStats({ words, characters });
  }, []);


  // Auto-save effect
  useEffect(() => {
    if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
    }

    if (currentDocId) {
        autoSaveTimerRef.current = window.setTimeout(() => {
            setIsSaving(true);
            setDocuments(docs =>
                docs.map(doc =>
                    doc.id === currentDocId
                        ? { ...doc, content: editorRef.current?.innerHTML || content, comments, updatedAt: Date.now() }
                        : doc
                )
            );
            setLastSaved(Date.now());
            setTimeout(() => setIsSaving(false), 500);
        }, AUTOSAVE_INTERVAL);
    }
    
    return () => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }
    };
  }, [content, comments, currentDocId]);

  // Format painter cursor effect
  useEffect(() => {
    document.body.style.cursor = isFormatPainterActive ? 'crosshair' : 'default';
    if (editorRef.current) {
        editorRef.current.style.cursor = isFormatPainterActive ? 'crosshair' : 'auto';
    }
    return () => {
      document.body.style.cursor = 'default';
    };
  }, [isFormatPainterActive]);


  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    updateWordCount();
  }, [updateWordCount]);

  useEffect(() => {
    updateWordCount();
  }, [content, updateWordCount]);
  
  // Delete selected object effect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElement) {
        // Check if the focus is inside an editable area of the selected element
        const activeElement = document.activeElement;
        const isEditingShapeText = selectedElement.contains(activeElement) && (activeElement as HTMLElement)?.isContentEditable;

        // If editing text inside a shape (like a textbox), don't delete the whole shape
        if (isEditingShapeText) {
          return;
        }

        if (editorRef.current && editorRef.current.contains(selectedElement)) {
          event.preventDefault(); // Prevent browser back navigation on backspace
          selectedElement.remove();
          handleContentChange(editorRef.current.innerHTML);
          setSelectedElement(null);
          setActivePanel(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElement, handleContentChange]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (selectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        try {
          selection.removeAllRanges();
          selection.addRange(selectionRef.current);
        } catch(e) {
          console.error("Could not restore selection.", e);
          focusEditor();
        }
      }
    } else {
        focusEditor();
    }
  };

  const focusEditor = () => {
    setTimeout(() => {
        if (editorRef.current) {
            editorRef.current.focus();
        }
    }, 0);
  };
  
  const handleEditAction = (command: string) => {
    focusEditor();
    document.execCommand(command);
  };
  
  const handleReplaceAll = (find: string, replace: string, options: { matchCase: boolean; wholeWord: boolean }) => {
    if (!editorRef.current || !find) return;
    
    let escapedFind = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (options.wholeWord) {
      escapedFind = `\\b${escapedFind}\\b`;
    }
    
    const flags = options.matchCase ? 'g' : 'gi';
    const regex = new RegExp(escapedFind, flags);
    
    const newContent = editorRef.current.innerHTML.replace(regex, replace);
    handleContentChange(newContent);
    focusEditor();
  };

  const handleNewDocument = () => {
    setContent('<p>...</p>');
    setComments([]);
    setCurrentDocId(null);
    setLastSaved(null);
    setView('editor');
    setIsCommentsSidebarVisible(false);
    setActivePanel(null);
    setEditingElement(null);
    setSelectedElement(null);
    setFloatingToolbar(null);
    setPageSize('Letter');
    setPageOrientation('portrait');
    focusEditor();
  };

  const handleSaveDocument = () => {
    if (currentDocId) {
      const now = Date.now();
      const currentContent = editorRef.current?.innerHTML || content;
      setDocuments(docs =>
        docs.map(doc =>
          doc.id === currentDocId
            ? { ...doc, content: currentContent, comments, updatedAt: now }
            : doc
        )
      );
      setLastSaved(now);
      setToast(t('toasts.docUpdated'));
    } else {
      setIsSavePromptVisible(true);
    }
  };
  
  const handleSaveNewDocument = (docName: string) => {
    if (!docName || !docName.trim()) {
        setToast(t('toasts.nameEmpty'));
        return;
    }
    const now = Date.now();
    const newDoc: Doc = {
        id: `doc_${now}`,
        name: docName.trim(),
        content,
        comments,
        createdAt: now,
        updatedAt: now,
    };
    setDocuments(docs => [...docs, newDoc]);
    setCurrentDocId(newDoc.id);
    setLastSaved(now);
    setToast(t('toasts.docSaved'));
    setIsSavePromptVisible(false);
    focusEditor();
  };

  const handleOpenDocument = (docId: string) => {
    const docToOpen = documents.find(doc => doc.id === docId);
    if (docToOpen) {
      setContent(docToOpen.content);
      setComments(docToOpen.comments || []);
      setCurrentDocId(docToOpen.id);
      setLastSaved(docToOpen.updatedAt);
      setIsCommentsSidebarVisible(docToOpen.comments && docToOpen.comments.length > 0);
      setActivePanel(null);
      setEditingElement(null);
      setSelectedElement(null);
      setFloatingToolbar(null);
      setView('editor');
    }
  };
  
  const handleRenameDocument = (docId: string, newName: string) => {
    setDocuments(docs => docs.map(doc => doc.id === docId ? { ...doc, name: newName, updatedAt: Date.now() } : doc));
    setToast(t('toasts.docRenamed'));
  };
  
  const handleDeleteDocument = (docId: string) => {
    setDocuments(docs => docs.filter(doc => doc.id !== docId));
    if (currentDocId === docId) {
      handleNewDocument();
    }
    setToast(t('toasts.docDeleted'));
  };

  const handleExportToWord = () => {
    const editorContent = editorRef.current?.innerHTML;
    if (!editorContent) return;

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
        "xmlns:w='urn:schemas-microsoft-com:office:word' "+
        "xmlns='http://www.w3.org/TR/REC-html40'>"+
        "<head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + editorContent + footer;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'document.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };
  
  const handleExportToPdf = () => {
    const pageElement = editorRef.current;
    if (pageElement) {
        const options = {
            margin:       [0.5, 0.5, 0.5, 0.5],
            filename:     'document.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: pageSize.toLowerCase() as any, orientation: pageOrientation },
            pagebreak:    { mode: ['css', 'legacy'] }
        };
        // @ts-ignore
        if (window.html2pdf) {
            // @ts-ignore
            window.html2pdf().from(pageElement).set(options).save();
        } else {
            setToast(t('toasts.pdfError'));
        }
    }
  };

  const printOrPreview = (doPrint: boolean) => {
    const editorContent = editorRef.current?.innerHTML;
    if (!editorContent) return;
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Document</title>');
      printWindow.document.write(`<style>
        body { font-family: 'Inter', sans-serif; line-height: 1.6; }
        @page {
            size: ${pageSize.toLowerCase()} ${pageOrientation};
            margin: 1in;
        }
        table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        [data-comment-id] { background-color: transparent !important; }
        a { color: blue; text-decoration: underline; }
        [data-shape-type] { position: absolute !important; }
        .page-break-indicator {
            page-break-after: always;
            height: 0;
            border: 0;
            margin: 0;
            visibility: hidden;
        }
        /* Hide the text inside the indicator */
        .page-break-indicator * { display: none; }
        .page-break-indicator::before, .page-break-indicator::after { content: ''; }
      </style>`);
      printWindow.document.write('</head><body>');
      printWindow.document.write(editorContent);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      if (doPrint) {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };
  
  const handleUpdateSourceCode = (newCode: string) => {
    handleContentChange(newCode);
    setIsSourceCodeVisible(false);
    focusEditor();
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => setToast(t('toasts.fullscreenError', { message: err.message })));
    } else {
      document.exitFullscreen();
    }
  };
  
  const handleApplyLink = ({ url, text }: { url: string, text: string }, elementToUpdate: HTMLAnchorElement | null) => {
    if (elementToUpdate) {
        elementToUpdate.href = url;
        if(text.trim()) {
            elementToUpdate.innerText = text;
        }
    } else {
        restoreSelection();
        const selection = window.getSelection();
        if (!selection) return;

        const range = selection.getRangeAt(0);
        if (range.collapsed) {
            const linkNode = document.createElement('a');
            linkNode.href = url;
            linkNode.innerText = text || url;
            range.insertNode(linkNode);
        } else {
            document.execCommand('createLink', false, url);
             const newAnchor = range.startContainer.parentElement?.closest('a');
             if(newAnchor && text.trim() && text.trim() !== newAnchor.innerText.trim()){
                 newAnchor.innerText = text;
             }
        }
    }
    setActivePanel(null);
    setEditingElement(null);
    focusEditor();
  };
  
  const handleApplyImageSettings = (options: ImageOptions, elementToUpdate: HTMLImageElement | null) => {
    const { src, width, height, align } = options;
    const applyStyles = (el: HTMLImageElement) => {
        el.style.width = width ? `${width}px` : 'auto';
        el.style.height = height ? `${height}px` : 'auto';
        el.style.float = 'none';
        el.style.display = '';
        el.style.margin = '';
        el.style.position = '';
        el.style.top = '';
        el.style.left = '';

        if (el.parentElement?.dataset.wrapper === 'image-center-wrapper') {
          const parent = el.parentElement;
          const grandparent = parent.parentElement;
          grandparent?.insertBefore(el, parent);
          grandparent?.removeChild(parent);
        }

        if (align === 'left' || align === 'right') {
            el.style.float = align;
            el.style.margin = align === 'left' ? '0.5rem 1rem 0.5rem 0' : '0.5rem 0 0.5rem 1rem';
        } else if (align === 'center') {
            el.style.display = 'block';
            el.style.margin = '0.5rem auto';
        } else {
             el.style.display = 'inline';
        }
    }

    if (elementToUpdate) {
        elementToUpdate.src = src;
        applyStyles(elementToUpdate)
    } else {
        restoreSelection();
        const id = `img-${Date.now()}`;
        document.execCommand('insertHTML', false, `<img id="${id}" src="${src}" />`);
        const newImg = editorRef.current?.querySelector(`#${id}`) as HTMLImageElement;
        if (newImg) {
            newImg.removeAttribute('id');
            applyStyles(newImg);
        }
    }
    setActivePanel(null);
    setEditingElement(null);
  };

  const handleInsertShape = (shapeType: ShapeType) => {
    restoreSelection();
    const id = `shape-${Date.now()}`;
    let shapeHtml = '';

    const defaultStyles = `position: absolute; top: 100px; left: 100px; z-index: 1;`;

    switch (shapeType) {
        case 'textbox':
            shapeHtml = `<div id="${id}" data-shape-type="textbox" style="${defaultStyles} width: 150px; height: 50px; border: 1px solid black; padding: 5px; background-color: rgba(255, 255, 255, 1);" contenteditable="false"><div contenteditable="true" style="color: black;">Type here...</div></div>`;
            break;
        case 'rectangle':
            shapeHtml = `<div id="${id}" data-shape-type="rectangle" style="${defaultStyles} width: 100px; height: 60px; background-color: #dde; border: 1px solid #333;" contenteditable="false"></div>`;
            break;
        case 'circle':
            shapeHtml = `<div id="${id}" data-shape-type="circle" style="${defaultStyles} width: 80px; height: 80px; background-color: #dde; border: 1px solid #333; border-radius: 50%;" contenteditable="false"></div>`;
            break;
        case 'triangle':
            shapeHtml = `<div id="${id}" data-shape-type="triangle" style="${defaultStyles} width: 80px; height: 80px; background-color: #dde; clip-path: polygon(50% 0%, 0% 100%, 100% 100%);" contenteditable="false"></div>`;
            break;
    }

    if (editorRef.current) {
      editorRef.current.insertAdjacentHTML('beforeend', shapeHtml);
      const newShape = editorRef.current.querySelector(`#${id}`) as HTMLElement;
      if (newShape) {
        newShape.removeAttribute('id');
        setSelectedElement(newShape);
      }
    }
  };

  const handleUpdateElementStyle = (element: HTMLElement, newStyles: React.CSSProperties) => {
    Object.assign(element.style, newStyles);
    setContent(editorRef.current?.innerHTML || ''); // Trigger rerender to save changes
  };
  
  const handleChangeZIndex = (element: HTMLElement, direction: 'front' | 'back') => {
    const editor = editorRef.current;
    if (!editor || !element) return;

    const positionedElements = Array.from(
      editor.querySelectorAll('[data-shape-type], img[style*="position: absolute"]')
    ) as HTMLElement[];
    
    // Normalize z-indexes to a continuous sequence
    const sortedElements = positionedElements.filter(el => el !== element)
      .sort((a, b) => (parseInt(a.style.zIndex, 10) || 1) - (parseInt(b.style.zIndex, 10) || 1));

    if (direction === 'front') {
        // Bring to front: Re-index others from 1, then put the target element on top.
        sortedElements.forEach((el, index) => {
            el.style.zIndex = String(index + 1);
        });
        element.style.zIndex = String(positionedElements.length);
    } else { // 'back'
        // Send to back: Put target element at 1, then re-index others from 2.
        element.style.zIndex = '1';
        sortedElements.forEach((el, index) => {
            el.style.zIndex = String(index + 2);
        });
    }

    handleContentChange(editor.innerHTML);
  };


  const handleInsertTable = (rows: number, cols: number) => {
    restoreSelection();
    let tableHTML = '<table style="width:100%; border-collapse: collapse; border: 1px solid #ccc;"><tbody>';
    for (let i = 0; i < rows; i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < cols; j++) {
            tableHTML += '<td style="border: 1px solid #ccc; padding: 8px;"><p>&nbsp;</p></td>';
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table><p>&nbsp;</p>';
    document.execCommand('insertHTML', false, tableHTML);
    setActivePanel(null);
  };

  const handleInsertPageBreak = () => {
    restoreSelection();
    const pageBreakHtml = `
      <div
          class="page-break-indicator"
          contenteditable="false"
          style="page-break-after: always; border-bottom: 2px dashed #ccc; margin: 1rem 0; text-align: center; color: #999; user-select: none; font-size: 0.8em;"
      >
          &mdash; Page Break &mdash;
      </div>
      <p>&nbsp;</p>
    `;
    document.execCommand('insertHTML', false, pageBreakHtml);
    focusEditor();
  };

  const handleOpenCommentModal = () => {
    restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setToast(t('toasts.commentSelectText'));
        return;
    }
    setIsCommentModalVisible(true);
  };
  
  const handleAddComment = (text: string) => {
    restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);

    if (text) {
        const selectionId = `comment_${Date.now()}`;
        const newComment: Comment = {
            id: `cmt_${Date.now()}`,
            text,
            createdAt: Date.now(),
            resolved: false,
            selectionId,
        };
        const span = document.createElement('span');
        span.dataset.commentId = selectionId;
        span.style.backgroundColor = '#fffde7'; // highlight color
        span.style.cursor = 'pointer';
        try {
            range.surroundContents(span);
        } catch (e) {
            setToast(t('toasts.commentComplex'));
            return;
        }
        setComments(prev => [...prev, newComment]);
        if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
        setIsCommentsSidebarVisible(true);
    }
    selection.removeAllRanges();
    setIsCommentModalVisible(false);
  };
  
  const handleResolveComment = (commentId: string) => {
    const commentToResolve = comments.find(c => c.id === commentId);
    if (!commentToResolve) return;
    
    setComments(prev => prev.filter(c => c.id !== commentId));
    
    if (editorRef.current) {
        const commentedSpan = editorRef.current.querySelector(`[data-comment-id="${commentToResolve.selectionId}"]`);
        if (commentedSpan) {
            const parent = commentedSpan.parentNode;
            while (commentedSpan.firstChild) {
                parent?.insertBefore(commentedSpan.firstChild, commentedSpan);
            }
            parent?.removeChild(commentedSpan);
            handleContentChange(editorRef.current.innerHTML);
        }
    }
  };

  const handleInsertCharacter = (char: string) => {
    restoreSelection();
    document.execCommand('insertText', false, char);
    setIsSpecialCharVisible(false);
  };
  
  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel(prev => {
        const step = 10;
        let newZoom = direction === 'in' ? prev + step : prev - step;
        if (newZoom < 50) newZoom = 50;
        if (newZoom > 200) newZoom = 200;
        return newZoom;
    });
  };

  const handleCopyFormatting = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
        setToast(t('toasts.copyFormattingSelect'));
        return;
    }
    const formatting: CopiedFormatting = {
        fontName: document.queryCommandValue('fontName'),
        fontSize: document.queryCommandValue('fontSize'),
        foreColor: document.queryCommandValue('foreColor'),
        hiliteColor: document.queryCommandValue('backColor'),
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikethrough'),
    };
    setCopiedFormatting(formatting);
    setIsFormatPainterActive(true);
    setToast(t('toasts.copyFormattingCopied'));
  };

  const handlePasteFormatting = () => {
    if (!isFormatPainterActive || !copiedFormatting) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
        setIsFormatPainterActive(false);
        setCopiedFormatting(null);
        return;
    };
    
    document.execCommand('fontName', false, copiedFormatting.fontName);
    document.execCommand('fontSize', false, copiedFormatting.fontSize);
    document.execCommand('foreColor', false, copiedFormatting.foreColor);
    document.execCommand('hiliteColor', false, copiedFormatting.hiliteColor);

    if (document.queryCommandState('bold') !== copiedFormatting.bold) document.execCommand('bold');
    if (document.queryCommandState('italic') !== copiedFormatting.italic) document.execCommand('italic');
    if (document.queryCommandState('underline') !== copiedFormatting.underline) document.execCommand('strikethrough') !== copiedFormatting.strikethrough) document.execCommand('strikethrough');

    setIsFormatPainterActive(false);
    setCopiedFormatting(null);
    window.getSelection()?.collapseToEnd();
    editorRef.current?.focus();
  };

  const handleEditorMouseUp = () => {
    handlePasteFormatting();

    // Add a small delay to allow the selection to be updated in the DOM
    setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && editorRef.current?.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Don't show if selecting an entire shape/image
            const parent = range.commonAncestorContainer.parentElement;
            if (parent?.closest('[data-shape-type], img')) {
                setFloatingToolbar(null);
                return;
            }

            setFloatingToolbar({
                top: rect.top - 45,
                left: rect.left + (rect.width / 2),
            });
        } else {
            setFloatingToolbar(null);
        }
    }, 10);
  };

  const openPanel = (panel: ActivePanel, element?: HTMLElement) => {
    saveSelection();
    setEditingElement(element || null);
    setSelectedElement(element || null);
    setActivePanel(panel);
    setIsCommentsSidebarVisible(false);
    setFloatingToolbar(null);
  }

  const openPanelForElement = (element: HTMLElement | null): boolean => {
    if (!element) return false;
    const image = element.closest('img');
    const link = element.closest('a');
    const shape = element.closest('[data-shape-type]') as HTMLElement;

    if (shape) {
        openPanel('shape', shape);
        return true;
    } else if (image) {
        openPanel('image', image);
        return true;
    } else if (link) {
        openPanel('link', link);
        return true;
    }
    return false;
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (openPanelForElement(target)) {
      e.preventDefault();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (link && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) {
            window.open(href, '_blank', 'noopener,noreferrer');
        }
    }
    
    const interactiveElement = target.closest('img, [data-shape-type]') as HTMLElement;
    if (interactiveElement) {
        setSelectedElement(interactiveElement);
        setFloatingToolbar(null);
    } else if (target === editorRef.current || target.parentElement === editorRef.current) {
        setSelectedElement(null);
        setActivePanel(null);
    }
  };

  const handleFloatingToolbarCommand = (command: string) => {
    // The mousedown handler on the toolbar should prevent focus loss,
    // so selection should be preserved.
    document.execCommand(command);
    // After command, selection might change, so hide toolbar.
    setFloatingToolbar(null);
    focusEditor(); // Refocus editor to be safe
  };

  const handleAnalyzeImage = () => {
    saveSelection();
    imageInputRef.current?.click();
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !aiRef.current) return;
  
    setToast(t('toasts.aiAnalyzing'));
    setIsAnalyzing(true);
  
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        
        const imagePart = {
          inlineData: {
            mimeType: file.type,
            data: base64Data,
          },
        };
  
        const textPart = {
          text: "Describe this image in detail."
        };
  
        const response = await aiRef.current!.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [imagePart, textPart] },
        });

        const analysisText = response.text.replace(/\n/g, '<br />');

        restoreSelection();
        document.execCommand('insertHTML', false, `<p>${analysisText}</p>`);

      } catch (error) {
        console.error("Image analysis failed:", error);
        setToast(t('toasts.aiAnalysisError'));
      } finally {
        setIsAnalyzing(false);
        // Reset the input value to allow selecting the same file again
        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleToggleTranscriptionUI = () => {
      saveSelection();
      setIsTranscriptionUIActive(prev => !prev);
  }

  const handleInsertTranscription = (text: string) => {
      restoreSelection();
      document.execCommand('insertHTML', false, `<p>${text.replace(/\n/g, '<br />')}</p>`);
      setIsTranscriptionUIActive(false);
  }

  const stopReadingAloud = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsReadingAloud(false);
  }, []);

  const handleReadAloud = async () => {
    if (isReadingAloud) {
      stopReadingAloud();
      return;
    }
    if (!aiRef.current) return;

    const selection = window.getSelection();
    let textToRead = '';
    if (selection && !selection.isCollapsed) {
      textToRead = selection.toString();
    } else if (editorRef.current) {
      textToRead = editorRef.current.innerText;
    }

    if (!textToRead.trim()) return;

    setIsAnalyzing(true);
    setToast(t('toasts.aiGeneratingAudio'));

    try {
      const response = await aiRef.current.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: textToRead }] }],
        config: { responseModalities: [Modality.AUDIO] },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        // @ts-ignore
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = audioContext;
        
        const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => stopReadingAloud();
        source.start();

        audioSourceRef.current = source;
        setIsReadingAloud(true);
      }
    } catch (error) {
      console.error("TTS failed:", error);
      setToast(t('toasts.aiTtsError'));
      stopReadingAloud();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAiAction = async (action: string, option?: string) => {
    if (!aiRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setToast(t('toasts.aiSelectText'));
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    
    let prompt = '';
    let model = 'gemini-2.5-flash';

    switch (action) {
      case 'summarize':
        prompt = `Summarize the following text concisely:\n\n"${selectedText}"`;
        break;
      case 'fix-grammar':
        prompt = `Correct any spelling and grammar mistakes in the following text. Only return the corrected text, without any introductory phrases:\n\n"${selectedText}"`;
        break;
      case 'continue-writing':
        model = 'gemini-2.5-pro';
        prompt = `Continue writing from the following text:\n\n"${selectedText}"`;
        break;
      case 'translate':
        prompt = `Translate the following text to ${option}:\n\n"${selectedText}"`;
        break;
      case 'change-tone':
        prompt = `Rewrite the following text in a ${option} tone:\n\n"${selectedText}"`;
        break;
      default:
        return;
    }
    
    setFloatingToolbar(null);
    setIsAnalyzing(true);
    setToast(t('toasts.aiProcessing'));

    try {
      const response = await aiRef.current.models.generateContent({ model, contents: prompt });
      const resultText = response.text;

      if (action === 'continue-writing') {
        range.collapse(false); // a false argument collapses the range to its end point
        document.execCommand('insertText', false, ` ${resultText}`);
      } else {
        document.execCommand('insertText', false, resultText);
      }
      handleContentChange(editorRef.current?.innerHTML || '');
    } catch (error) {
      console.error('AI action failed:', error);
      setToast(t('toasts.aiError'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pageDimensions: Record<PageSize, { width: string; height: string }> = {
    Letter: { width: '8.5in', height: '11in' },
    A4: { width: '8.27in', height: '11.69in' },
    Legal: { width: '8.5in', height: '14in' },
  };

  const { width, height } = pageDimensions[pageSize];
  const pageStyle: React.CSSProperties = pageOrientation === 'portrait'
      ? { width, minHeight: height }
      : { width: height, minHeight: width };

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col font-sans">
      {view === 'editor' ? (
        <div className="flex-grow flex flex-col overflow-hidden">
            <header className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                 <MenuBar 
                  onNewDocument={handleNewDocument}
                  onSave={handleSaveDocument}
                  onViewSaved={() => setView('savedDocuments')}
                  onExportToWord={handleExportToWord}
                  onExportToPdf={handleExportToPdf}
                  onPrint={() => printOrPreview(true)}
                  onEditAction={handleEditAction}
                  onOpenFindReplace={() => openPanel('findReplace')}
                  onCopyFormatting={handleCopyFormatting}
                  onInsertLink={() => openPanel('link')}
                  onInsertImage={() => openPanel('image')}
                  onInsertTable={() => openPanel('table')}
                  onInsertShape={handleInsertShape}
                  onInsertHorizontalRule={() => handleEditAction('insertHorizontalRule')}
                  onAddComment={() => { saveSelection(); handleOpenCommentModal(); }}
                  onOpenSourceCode={() => setIsSourceCodeVisible(true)}
                  onOpenWordCount={() => setIsWordCountVisible(true)}
                  onToggleFullscreen={handleToggleFullscreen}
                  onPreview={() => printOrPreview(false)}
                  onShowComments={() => {
                    setIsCommentsSidebarVisible(prev => !prev);
                    setActivePanel(null);
                  }}
                  onOpenSpecialCharacters={() => { saveSelection(); setIsSpecialCharVisible(true); }}
                  isSaving={isSaving}
                  lastSaved={lastSaved}
                  isDocumentSaved={!!currentDocId}
                  onSetPageSize={setPageSize}
                  onSetPageOrientation={setPageOrientation}
                  onInsertPageBreak={handleInsertPageBreak}
                  onSetLanguage={setLanguage}
                  onAnalyzeImage={handleAnalyzeImage}
                  onToggleTranscription={handleToggleTranscriptionUI}
                  onReadAloud={handleReadAloud}
                  isReadingAloud={isReadingAloud}
                  t={t}
                />
                <Toolbar 
                  editorRef={editorRef} 
                  onCopyFormatting={handleCopyFormatting} 
                  isFormatPainterActive={isFormatPainterActive}
                  t={t}
                />
            </header>
            
            <div className="flex-grow flex overflow-hidden">
                <main className="flex-grow overflow-auto bg-gray-200 dark:bg-gray-600">
                    <div 
                        className="py-12 transition-transform duration-200" 
                        style={{ 
                            transform: `scale(${zoomLevel / 100})`, 
                            transformOrigin: 'top center' 
                        }}
                    >
                        <div 
                            id="editor-page" 
                            className="relative mx-auto bg-white dark:bg-gray-900 shadow-2xl"
                            style={pageStyle}
                        >
                            <Editor 
                              ref={editorRef} 
                              content={content} 
                              onChange={handleContentChange}
                              onMouseUp={handleEditorMouseUp}
                              onDoubleClick={handleDoubleClick}
                              onClick={handleClick}
                            />
                            {selectedElement && editorRef.current && (
                                <ObjectWrapper 
                                    targetElement={selectedElement}
                                    containerRef={editorRef}
                                    onUpdate={handleUpdateElementStyle}
                                    onDeselect={() => setSelectedElement(null)}
                                    onDoubleClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openPanelForElement(selectedElement);
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </main>
                
                <div className="flex-shrink-0">
                    {activePanel ? (
                        <SettingsSidebar
                            activePanel={activePanel}
                            editingElement={editingElement}
                            onClose={() => { setActivePanel(null); setEditingElement(null); setSelectedElement(null); }}
                            onReplaceAll={handleReplaceAll}
                            onApplyLink={handleApplyLink}
                            onApplyImageSettings={handleApplyImageSettings}
                            onInsertTable={handleInsertTable}
                            onUpdateElementStyle={handleUpdateElementStyle}
                            onChangeZIndex={handleChangeZIndex}
                            t={t}
                        />
                    ) : isCommentsSidebarVisible ? (
                        <CommentsSidebar 
                            comments={comments.filter(c => !c.resolved)} 
                            onResolve={handleResolveComment}
                            onClose={() => setIsCommentsSidebarVisible(false)}
                            onAddComment={() => { saveSelection(); handleOpenCommentModal(); }}
                            t={t}
                        />
                    ) : null}
                </div>
            </div>

            <StatusBar
                stats={wordCountStats}
                zoomLevel={zoomLevel}
                onZoomIn={() => handleZoom('in')}
                onZoomOut={() => handleZoom('out')}
                t={t}
            />
        </div>
      ) : (
        <SavedDocumentsView
          documents={documents}
          onOpenDocument={handleOpenDocument}
          onRenameDocument={handleRenameDocument}
          onDeleteDocument={handleDeleteDocument}
          onNewDocument={handleNewDocument}
          t={t}
        />
      )}
      
      {toast && (
        <div className={`fixed bottom-16 right-5 bg-gray-900 text-white px-5 py-3 rounded-lg shadow-lg z-50 ${isAnalyzing ? 'animate-pulse' : ''}`}>
          {toast}
        </div>
      )}
      
      {floatingToolbar && (
        <FloatingToolbar
            top={floatingToolbar.top}
            left={floatingToolbar.left}
            onAddComment={() => {
                saveSelection();
                handleOpenCommentModal();
                setFloatingToolbar(null);
            }}
            onCommand={handleFloatingToolbarCommand}
            onInsertLink={() => openPanel('link')}
            onAiAction={handleAiAction}
            t={t}
        />
      )}

      <SourceCodeModal isOpen={isSourceCodeVisible} onClose={() => setIsSourceCodeVisible(false)} content={content} onSave={handleUpdateSourceCode} t={t} />
      <WordCountModal isOpen={isWordCountVisible} onClose={() => setIsWordCountVisible(false)} stats={wordCountStats} t={t} />
      <UrlInputModal 
          isOpen={isSavePromptVisible} 
          onClose={() => setIsSavePromptVisible(false)} 
          onSubmit={handleSaveNewDocument} 
          title={t('modals.saveDoc.title')}
          label={t('modals.saveDoc.label')}
          initialValue={t('modals.saveDoc.placeholder')}
          submitButtonText={t('modals.saveDoc.save')} 
          t={t}
      />
      <SpecialCharactersModal isOpen={isSpecialCharVisible} onClose={() => setIsSpecialCharVisible(false)} onInsert={handleInsertCharacter} t={t} />
      <CommentInputModal isOpen={isCommentModalVisible} onClose={() => setIsCommentModalVisible(false)} onSubmit={handleAddComment} t={t} />
      {isTranscriptionUIActive && (
          <TranscriptionUI
              ai={aiRef.current}
              onClose={() => setIsTranscriptionUIActive(false)}
              onInsert={handleInsertTranscription}
              setToast={setToast}
              t={t}
          />
      )}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default App;
