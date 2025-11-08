

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import Toolbar from './components/Toolbar';
import Editor from './components/Editor';
import MenuBar from './components/MenuBar';
import SourceCodeModal from './components/SourceCodeModal';
import WordCountModal from './components/WordCountModal';
import UrlInputModal from './components/UrlInputModal';
import DriveView from './components/DriveView';
import CommentsSidebar from './components/CommentsSidebar';
import SettingsSidebar from './components/SettingsSidebar';
import SpecialCharactersModal from './components/SpecialCharactersModal';
import StatusBar from './components/StatusBar';
import ObjectWrapper from './components/ObjectWrapper';
import FloatingToolbar from './components/FloatingToolbar';
import CommentInputModal from './components/CommentInputModal';
import AiSidekick from './components/AiSidekick';
import PageSetupModal from './components/PageSetupModal';
import DocumentPreviewModal from './components/DocumentPreviewModal';
import AboutModal from './components/AboutModal';
import ShortcutsSidebar from './components/ShortcutsSidebar';
import ImportModal from './components/ImportModal';
import DrawingModal from './components/DrawingModal';
import CropModal from './components/CropModal';
import { translations, Language } from './lib/translations';


export interface Comment {
  id: string;
  text: string;
  createdAt: number;
  resolved: boolean;
  selectionId: string;
}

export type PageSize = 'Letter' | 'A4' | 'Legal';
export type PageOrientation = 'portrait' | 'landscape';
export interface PageMargins {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export interface Doc {
  id:string;
  name: string;
  content: string;
  comments: Comment[];
  createdAt: number;
  updatedAt: number;
  pageSize?: PageSize;
  pageOrientation?: PageOrientation;
  pageMargins?: PageMargins;
  pageColor?: string;
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

export type ShapeType = 'textbox' | 'rectangle' | 'circle' | 'triangle' | 'line';
export type ActivePanel = 'link' | 'image' | 'table' | 'findReplace' | 'shape' | null;

export interface ImageOptions {
    src: string;
    width: string;
    height: string;
    align: 'none' | 'left' | 'center' | 'right' | 'absolute';
}

export type ChatMessage = {
    role: 'user' | 'model';
    text: string;
    isThinking?: boolean;
    sources?: any[];
};

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
  const [view, setView] = useState<'editor' | 'drive'>('editor');
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [content, setContent] = useState<string>('<p><br></p>');
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
  const [isAiSidekickVisible, setIsAiSidekickVisible] = useState(false);
  const [isPageSetupVisible, setIsPageSetupVisible] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewDocContent, setPreviewDocContent] = useState('');
  const [isAboutModalVisible, setIsAboutModalVisible] = useState(false);
  const [isShortcutsSidebarVisible, setIsShortcutsSidebarVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [isDrawingModalVisible, setIsDrawingModalVisible] = useState(false);
  const [editingDrawingElement, setEditingDrawingElement] = useState<HTMLImageElement | null>(null);
  const [isCropModalVisible, setIsCropModalVisible] = useState(false);
  const [croppingImageElement, setCroppingImageElement] = useState<HTMLImageElement | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  
  const [zoomLevel, setZoomLevel] = useState(100);
  const [wordCountStats, setWordCountStats] = useState<WordCountStats>({ words: 0, characters: 0 });

  const [isFormatPainterActive, setIsFormatPainterActive] = useState(false);
  const [copiedFormatting, setCopiedFormatting] = useState<CopiedFormatting | null>(null);
  const [isSpellcheckEnabled, setIsSpellcheckEnabled] = useState(false);

  const [pageSize, setPageSize] = useState<PageSize>('Letter');
  const [pageOrientation, setPageOrientation] = useState<PageOrientation>('portrait');
  const [pageColor, setPageColor] = useState('#FFFFFF');
  const [pageMargins, setPageMargins] = useState<PageMargins>({ top: 1, bottom: 1, left: 1, right: 1 });

  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const debouncedSaveRef = useRef<number | null>(null);
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

  const saveDocumentChanges = useCallback(() => {
      if (!currentDocId) return;

      setIsSaving(true);
      const docToSave: Partial<Doc> = {
          content: editorRef.current?.innerHTML || content,
          comments,
          updatedAt: Date.now(),
          pageSize,
          pageOrientation,
          pageMargins,
          pageColor,
      };
      setDocuments(docs =>
          docs.map(doc =>
              doc.id === currentDocId
                  ? { ...doc, ...docToSave }
                  : doc
          )
      );
      setLastSaved(Date.now());
      setTimeout(() => setIsSaving(false), 500);
  }, [content, comments, currentDocId, pageColor, pageMargins, pageOrientation, pageSize]);

  // Debounced auto-save effect
  useEffect(() => {
    if (currentDocId) {
        if (debouncedSaveRef.current) {
            clearTimeout(debouncedSaveRef.current);
        }
        debouncedSaveRef.current = window.setTimeout(() => {
            saveDocumentChanges();
        }, AUTOSAVE_INTERVAL);
    }
    
    return () => {
        if (debouncedSaveRef.current) {
            clearTimeout(debouncedSaveRef.current);
        }
    };
  }, [content, comments, currentDocId, saveDocumentChanges]);

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
            const selection = window.getSelection();
            
            // If the user's cursor is inside the selected element (e.g., editing text in a table or shape),
            // let the default key action proceed and do not delete the entire element.
            if (selection && selection.anchorNode && selectedElement.contains(selection.anchorNode)) {
                // Extra check for empty textboxes. Allow deletion if the inner div is empty.
                const shapeText = selectedElement.querySelector('[contenteditable="true"]');
                if (shapeText && shapeText.textContent?.trim() === '') {
                   // Allow deletion to proceed
                } else {
                   return;
                }
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
    const defaultsString = localStorage.getItem('defaultPageSettings');
    const defaults = defaultsString ? JSON.parse(defaultsString) : {};

    setContent('<p><br></p>');
    setComments([]);
    setCurrentDocId(null);
    setLastSaved(null);
    setView('editor');
    setIsCommentsSidebarVisible(false);
    setActivePanel(null);
    setEditingElement(null);
    setSelectedElement(null);
    setFloatingToolbar(null);
    setIsAiSidekickVisible(false);
    setPageSize(defaults.size || 'Letter');
    setPageOrientation(defaults.orientation || 'portrait');
    setPageMargins(defaults.margins || { top: 1, bottom: 1, left: 1, right: 1 });
    setPageColor(defaults.color || '#FFFFFF');
    focusEditor();
  };

  const handleSaveDocument = () => {
    if (currentDocId) {
      const now = Date.now();
      const currentContent = editorRef.current?.innerHTML || content;
      setDocuments(docs =>
        docs.map(doc =>
          doc.id === currentDocId
            ? { ...doc, content: currentContent, comments, updatedAt: now, pageSize, pageOrientation, pageMargins, pageColor }
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
        pageSize,
        pageOrientation,
        pageMargins,
        pageColor,
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
      setIsAiSidekickVisible(false);
      setPageSize(docToOpen.pageSize || 'Letter');
      setPageOrientation(docToOpen.pageOrientation || 'portrait');
      setPageMargins(docToOpen.pageMargins || { top: 1, bottom: 1, left: 1, right: 1 });
      setPageColor(docToOpen.pageColor || '#FFFFFF');
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

  const handleDuplicateDocument = (docId: string) => {
    const docToDuplicate = documents.find(doc => doc.id === docId);
    if (!docToDuplicate) return;
    const now = Date.now();
    const newDoc: Doc = {
        ...docToDuplicate,
        id: `doc_${now}`,
        name: t('drive.copyOf', { name: docToDuplicate.name }),
        createdAt: now,
        updatedAt: now,
    };
    setDocuments(docs => [...docs, newDoc]);
    setToast(t('toasts.docDuplicated'));
  };

  const handlePreviewDocument = (docId: string) => {
    const docToPreview = documents.find(doc => doc.id === docId);
    if (docToPreview) {
      setPreviewDocContent(docToPreview.content);
      setIsPreviewModalVisible(true);
    }
  };

  const handleExportAllDocuments = () => {
    try {
        const dataStr = JSON.stringify(documents, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'editor-backup.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    } catch (error) {
        console.error("Failed to export documents:", error);
        setToast(t('toasts.docsImportedError')); // Re-use error toast
    }
  };

  const handleImportAllDocuments = (jsonContent: string) => {
    try {
        const importedDocs: Doc[] = JSON.parse(jsonContent);

        if (!Array.isArray(importedDocs)) {
            throw new Error("Invalid format: Not an array.");
        }
        
        let newDocsCount = 0;
        setDocuments(currentDocs => {
            const currentDocIds = new Set(currentDocs.map(d => d.id));
            const docsToAdd = importedDocs.filter(importedDoc => {
                if (typeof importedDoc.id !== 'string' || typeof importedDoc.name !== 'string' || typeof importedDoc.content !== 'string') {
                    return false; // Basic validation
                }
                return !currentDocIds.has(importedDoc.id);
            });
            newDocsCount = docsToAdd.length;
            return [...currentDocs, ...docsToAdd];
        });

        if (newDocsCount > 0) {
            setToast(t('toasts.docsImportedSuccess', { count: newDocsCount }));
        } else {
            setToast(t('toasts.docsImportedNothingNew'));
        }
    } catch (error) {
        console.error("Failed to import documents:", error);
        setToast(t('toasts.docsImportedError'));
    }
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
            margin:       [pageMargins.top, pageMargins.right, pageMargins.bottom, pageMargins.left],
            filename:     'document.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, backgroundColor: pageColor },
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
        body { font-family: 'Inter', sans-serif; line-height: 1.6; background-color: ${pageColor}; }
        @page {
            size: ${pageSize.toLowerCase()} ${pageOrientation};
            margin-top: ${pageMargins.top}in;
            margin-right: ${pageMargins.right}in;
            margin-bottom: ${pageMargins.bottom}in;
            margin-left: ${pageMargins.left}in;
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
        
        ul:not([data-type="checklist"]) { list-style-type: disc; padding-left: 2em; }
        ol { list-style-type: decimal; padding-left: 2em; }
        
        ul[data-type="checklist"] { list-style-type: none !important; padding-left: 0 !important; }
        ul[data-type="checklist"] > li { display: flex; align-items: center; gap: 0.5rem; }
        ul[data-type="checklist"] > li[data-checked="true"] > div:last-of-type { text-decoration: line-through; color: #888; }
        ul[data-type="checklist"] input[type="checkbox"] { margin-right: 8px; }

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
  
  const handleApplyImageSettings = (options: ImageOptions, elementToUpdate: HTMLImageElement | null, keepPanelOpen = false) => {
    const { src, width, height, align } = options;
    const applyStyles = (el: HTMLImageElement) => {
        el.style.width = width ? `${width}px` : 'auto';
        el.style.height = height ? `${height}px` : 'auto';
        
        // Reset all positioning styles
        el.style.float = 'none';
        el.style.display = '';
        el.style.margin = '';
        el.style.position = '';
        el.style.top = '';
        el.style.left = '';
        el.style.zIndex = '';

        if (el.parentElement?.dataset.wrapper === 'image-center-wrapper') {
          const parent = el.parentElement;
          const grandparent = parent.parentElement;
          if (grandparent) {
            grandparent.insertBefore(el, parent);
            grandparent.removeChild(parent);
          }
        }

        switch(align) {
            case 'left':
                el.style.float = 'left';
                el.style.margin = '0.5rem 1rem 0.5rem 0';
                break;
            case 'right':
                el.style.float = 'right';
                el.style.margin = '0.5rem 0 0.5rem 1rem';
                break;
            case 'center':
                el.style.display = 'block';
                el.style.margin = '0.5rem auto';
                break;
            case 'absolute':
                el.style.position = 'absolute';
                el.style.top = el.style.top || '100px';
                el.style.left = el.style.left || '100px';
                el.style.zIndex = '10';
                break;
            case 'none':
            default:
                el.style.display = 'inline';
                break;
        }
    }

    if (elementToUpdate) {
        if (elementToUpdate.src !== src) {
          elementToUpdate.src = src;
        }
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
    if (editorRef.current) {
        handleContentChange(editorRef.current.innerHTML);
    }
    if (!keepPanelOpen) {
      setActivePanel(null);
      setEditingElement(null);
    }
  };

  const handleInsertShape = (shapeType: ShapeType) => {
    restoreSelection();
    const id = `shape-${Date.now()}`;
    let shapeHtml = '';

    const defaultStyles = `position: absolute; top: 100px; left: 100px; z-index: 1;`;
    const placeholderText = t('panes.shape.typeHere');

    switch (shapeType) {
        case 'textbox':
            shapeHtml = `<div id="${id}" data-shape-type="textbox" style="${defaultStyles} width: 150px; height: 50px; border: 1px solid black; padding: 5px; background-color: rgba(255, 255, 255, 1);" contenteditable="false"><div contenteditable="true" style="color: black; border: none; outline: none; min-height: 1em; height: 100%;">${placeholderText}</div></div>`;
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
        case 'line':
            shapeHtml = `<div id="${id}" data-shape-type="line" style="${defaultStyles} width: 100px; height: 2px; background-color: #333; transform-origin: center;" contenteditable="false"></div>`;
            break;
    }

    if (editorRef.current) {
      editorRef.current.insertAdjacentHTML('beforeend', shapeHtml);
      const newShape = editorRef.current.querySelector(`#${id}`) as HTMLElement;
      if (newShape) {
        newShape.removeAttribute('id');
        setSelectedElement(newShape);
        if (shapeType === 'textbox') {
            const innerDiv = newShape.querySelector('[contenteditable="true"]') as HTMLElement;
            if (innerDiv) {
                innerDiv.focus();
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(innerDiv);
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        }
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
      editor.querySelectorAll('[data-shape-type], img[style*="position: absolute"], table[style*="position: absolute"]')
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

  const handleInsertChecklist = () => {
    restoreSelection();
    const selection = window.getSelection();
    if (!selection) return;

    let content = selection.toString().trim() || '<br>';

    const checklistHtml = `
      <ul data-type="checklist">
        <li data-checked="false">
          <span contenteditable="false">
            <input type="checkbox" />
          </span>
          <div>${content}</div>
        </li>
      </ul><p><br></p>`; // Add a new paragraph after the list

    document.execCommand('insertHTML', false, checklistHtml);
    focusEditor();
  };

  const getCurrentTableSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      const anchorNode = selection.anchorNode;
      if (!anchorNode) return null;

      const cell = (anchorNode.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : anchorNode as HTMLElement)?.closest('td, th');
      if (!cell) return null;
      
      const row = cell.closest('tr');
      if (!row) return null;

      const table = row.closest('table');
      if (!table || table !== editingElement) return null;

      const cellIndex = Array.from(row.cells).indexOf(cell as HTMLTableCellElement);
      const rowIndex = row.rowIndex;
      
      return { table, row, cell, rowIndex, cellIndex };
  };
  
  // Table cell merge/split helpers
  const getSelectedTableCells = (tableEl: HTMLTableElement): HTMLTableCellElement[] => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return [];
      const selectedCells: HTMLTableCellElement[] = [];
      const cells = tableEl.querySelectorAll('td, th');
      for (const cell of Array.from(cells)) {
          if (selection.containsNode(cell, true)) {
              selectedCells.push(cell as HTMLTableCellElement);
          }
      }
      return [...new Set(selectedCells)];
  };

  const buildTableMatrix = (table: HTMLTableElement): ({ cell: HTMLTableCellElement; isPlaceholder: boolean } | null)[][] => {
      const matrix: ({ cell: HTMLTableCellElement; isPlaceholder: boolean } | null)[][] = [];
      const rows = Array.from(table.rows);

      rows.forEach((row, rowIndex) => {
          if (!matrix[rowIndex]) matrix[rowIndex] = [];
          let matrixColIndex = 0;
          const cells = Array.from(row.cells);
          cells.forEach((cell) => {
              while (matrix[rowIndex][matrixColIndex]) {
                  matrixColIndex++;
              }
              const colSpan = cell.colSpan || 1;
              const rowSpan = cell.rowSpan || 1;
              for (let r = 0; r < rowSpan; r++) {
                  for (let c = 0; c < colSpan; c++) {
                      const targetRow = rowIndex + r;
                      if (!matrix[targetRow]) matrix[targetRow] = [];
                      matrix[targetRow][matrixColIndex + c] = { cell, isPlaceholder: r > 0 || c > 0 };
                  }
              }
              matrixColIndex += colSpan;
          });
      });
      return matrix;
  };


  const handleTableAction = (action: 'addRowAbove' | 'addRowBelow' | 'deleteRow' | 'addColLeft' | 'addColRight' | 'deleteCol' | 'deleteTable' | 'mergeCells' | 'splitCell') => {
      if (action === 'deleteTable') {
          if (editingElement && editingElement.tagName === 'TABLE') {
              editingElement.remove();
              handleContentChange(editorRef.current!.innerHTML);
              setActivePanel(null);
              setSelectedElement(null);
          }
          return;
      }
      
      const table = editingElement as HTMLTableElement;
      if (!table) return;

      if (action === 'mergeCells') {
          const selectedCells = getSelectedTableCells(table);
          if (selectedCells.length < 2) {
              setToast(t('toasts.tableMergeContext'));
              return;
          }
          
          const matrix = buildTableMatrix(table);
          let minR = Infinity, minC = Infinity, maxR = -1, maxC = -1;
          
          const cellCoords = new Map<HTMLTableCellElement, {r: number, c: number}>();
          
          for(let r = 0; r < matrix.length; r++) {
              for(let c = 0; c < (matrix[r]?.length ?? 0); c++) {
                  const matrixCell = matrix[r][c];
                  if(matrixCell && selectedCells.includes(matrixCell.cell) && !matrixCell.isPlaceholder) {
                       if(!cellCoords.has(matrixCell.cell)) {
                           cellCoords.set(matrixCell.cell, {r, c});
                       }
                  }
              }
          }

          selectedCells.forEach(cell => {
              const coords = cellCoords.get(cell);
              if(coords) {
                minR = Math.min(minR, coords.r);
                minC = Math.min(minC, coords.c);
                maxR = Math.max(maxR, coords.r + cell.rowSpan - 1);
                maxC = Math.max(maxC, coords.c + cell.colSpan - 1);
              }
          });

          const primaryCell = selectedCells[0];
          let combinedContent = '';

          selectedCells.forEach((cell, index) => {
              if (index > 0) {
                  combinedContent += cell.innerHTML;
                  cell.remove();
              }
          });
          primaryCell.innerHTML += combinedContent;
          primaryCell.rowSpan = maxR - minR + 1;
          primaryCell.colSpan = maxC - minC + 1;

          handleContentChange(editorRef.current!.innerHTML);
          return;
      }

      if (action === 'splitCell') {
          const selectedCells = getSelectedTableCells(table);
          if (selectedCells.length !== 1 || (selectedCells[0].colSpan <= 1 && selectedCells[0].rowSpan <= 1)) {
              setToast(t('toasts.tableSplitContext'));
              return;
          }
          const cellToSplit = selectedCells[0];
          const { rowSpan, colSpan } = cellToSplit;
          
          const matrix = buildTableMatrix(table);
          let startR = -1, startC = -1;
          
          for(let r=0; r < matrix.length; r++) {
              const cIndex = matrix[r].findIndex(c => c?.cell === cellToSplit);
              if (cIndex !== -1) {
                  startR = r;
                  startC = cIndex;
                  break;
              }
          }

          for (let r = 0; r < rowSpan; r++) {
              for (let c = 0; c < colSpan; c++) {
                  if (r === 0 && c === 0) continue;
                  const newCell = document.createElement('td');
                  newCell.style.border = '1px solid #ccc';
                  newCell.style.padding = '8px';
                  newCell.innerHTML = '<p>&nbsp;</p>';
                  
                  const targetRow = table.rows[startR + r];
                  const insertBeforeCell = matrix[startR+r][startC+c+1]?.cell;
                  targetRow.insertBefore(newCell, insertBeforeCell || null);
              }
          }
          cellToSplit.rowSpan = 1;
          cellToSplit.colSpan = 1;

          handleContentChange(editorRef.current!.innerHTML);
          return;
      }

      const selection = getCurrentTableSelection();
      if (!selection) {
          setToast(t('toasts.tableActionContext'));
          return;
      }
      const { row, rowIndex, cellIndex } = selection;

      switch(action) {
          case 'addRowAbove':
          case 'addRowBelow': {
              const newRow = table.insertRow(action === 'addRowBelow' ? rowIndex + 1 : rowIndex);
              for (let i = 0; i < row.cells.length; i++) {
                  const newCell = newRow.insertCell(i);
                  newCell.style.border = '1px solid #ccc';
                  newCell.style.padding = '8px';
                  newCell.innerHTML = '<p>&nbsp;</p>';
              }
              break;
          }
          case 'deleteRow':
              table.deleteRow(rowIndex);
              break;
          case 'addColLeft':
          case 'addColRight': {
              const newCellIndex = action === 'addColRight' ? cellIndex + 1 : cellIndex;
              for (let i = 0; i < table.rows.length; i++) {
                  const newCell = table.rows[i].insertCell(newCellIndex);
                  newCell.style.border = '1px solid #ccc';
                  newCell.style.padding = '8px';
                  newCell.innerHTML = '<p>&nbsp;</p>';
              }
              break;
          }
          case 'deleteCol':
              for (let i = 0; i < table.rows.length; i++) {
                  table.rows[i].deleteCell(cellIndex);
              }
              break;
      }
      handleContentChange(editorRef.current!.innerHTML);
  };
  
  const handleTableStyle = (style: React.CSSProperties, applyTo: 'cell' | 'table') => {
    if (applyTo === 'table' && editingElement) {
        Object.assign(editingElement.style, style);
        // Apply to all cells too for borders
        if(style.borderColor || style.borderWidth) {
          const cells = editingElement.querySelectorAll('td, th');
          cells.forEach((cell) => {
            if(style.borderColor) (cell as HTMLElement).style.borderColor = style.borderColor as string;
            if(style.borderWidth) (cell as HTMLElement).style.borderWidth = style.borderWidth as string;
          });
        }
    } else {
        const selection = getCurrentTableSelection();
        if (selection && selection.cell) {
            Object.assign((selection.cell as HTMLElement).style, style);
        } else {
            setToast(t('toasts.tableActionContext'));
        }
    }
    handleContentChange(editorRef.current!.innerHTML);
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
    if (document.queryCommandState('underline') !== copiedFormatting.underline) document.execCommand('underline');
    if (document.queryCommandState('strikethrough') !== copiedFormatting.strikethrough) document.execCommand('strikethrough');

    setIsFormatPainterActive(false);
    setCopiedFormatting(null);
    window.getSelection()?.collapseToEnd();
    editorRef.current?.focus();
  };

  const handleEditorMouseUp = () => {
    handlePasteFormatting();
    
    if (window.innerWidth < 768) { // Don't show on mobile
      setFloatingToolbar(null);
      return;
    }

    // Add a small delay to allow the selection to be updated in the DOM
    setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && editorRef.current?.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Don't show if selecting an entire shape/image
            const parent = range.commonAncestorContainer.parentElement;
            if (parent?.closest('[data-shape-type], img, table')) {
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
    setIsAiSidekickVisible(false);
    setIsShortcutsSidebarVisible(false);
    setFloatingToolbar(null);
  }

  const openPanelForElement = (element: HTMLElement | null): boolean => {
    if (!element) return false;
    const image = element.closest('img');
    const link = element.closest('a');
    const shape = element.closest('[data-shape-type]') as HTMLElement;
    const table = element.closest('table');

    if (table) {
        openPanel('table', table);
        return true;
    } else if (shape) {
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
    const drawing = target.closest('img[data-drawing="true"]') as HTMLImageElement;

    if (drawing) {
      e.preventDefault();
      setEditingDrawingElement(drawing);
      setIsDrawingModalVisible(true);
      return;
    }
    
    if (openPanelForElement(target)) {
      e.preventDefault();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Checklist handler
    if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
        const li = target.closest('li');
        if (li && li.parentElement?.dataset.type === 'checklist') {
            // Defer update to allow browser to update checkbox 'checked' state
            setTimeout(() => {
                const isChecked = (target as HTMLInputElement).checked;
                li.dataset.checked = isChecked ? 'true' : 'false';
                if (editorRef.current) {
                    handleContentChange(editorRef.current.innerHTML);
                }
            }, 0);
            return; // Stop further processing
        }
    }

    // Link handler
    const link = target.closest('a');
    if (link && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) {
            window.open(href, '_blank', 'noopener,noreferrer');
        }
        return;
    }
    
    const interactiveElement = target.closest('img, [data-shape-type], table') as HTMLElement;
    if (interactiveElement) {
        if (interactiveElement.tagName === 'TABLE') {
          openPanel('table', interactiveElement);
        } else {
          setSelectedElement(interactiveElement);
        }
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

  const checkAiAvailability = () => {
      if (!aiRef.current) {
          setToast(t('toasts.aiNotAvailable'));
          return false;
      }
      return true;
  };

  const handleReadAloud = async () => {
    if (isReadingAloud) {
      stopReadingAloud();
      return;
    }
    if (!checkAiAvailability()) return;

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
      const response = await aiRef.current!.models.generateContent({
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
    if (!checkAiAvailability()) return;

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
      const response = await aiRef.current!.models.generateContent({ model, contents: prompt });
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

  const handleAiImageEdit = async (prompt: string, imageElement: HTMLImageElement) => {
    if (!checkAiAvailability() || !prompt || !imageElement) return;

    setIsAnalyzing(true);
    setToast(t('toasts.aiEditingImage'));
    try {
        // Convert image src to base64
        const response = await fetch(imageElement.src);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            
            const imagePart = {
                inlineData: { data: base64Data, mimeType: blob.type },
            };
            const textPart = { text: prompt };

            const editResponse = await aiRef.current!.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [imagePart, textPart] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            
            for (const part of editResponse.candidates[0].content.parts) {
              if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const newSrc = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                (imageElement as HTMLElement).style.backgroundColor = 'transparent';
                imageElement.src = newSrc;
                handleContentChange(editorRef.current!.innerHTML);
                setToast(t('toasts.aiImageEdited'));
                return;
              }
            }
            throw new Error("No image data in response");
        };
    } catch (error) {
        console.error("AI image edit failed:", error);
        setToast(t('toasts.aiError'));
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleOcrImport = async (base64Image: string) => {
    if (!checkAiAvailability()) return;

    setIsImportModalVisible(false);
    setIsAnalyzing(true);
    setToast(t('toasts.ocrInProgress'));

    try {
        const imagePart = {
            inlineData: {
                data: base64Image.split(',')[1],
                mimeType: base64Image.match(/data:([^;]+);/)?.[1] || 'image/jpeg',
            },
        };
        const textPart = { text: "Extract all text from this image, preserving line breaks." };

        const response = await aiRef.current!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });
        
        const extractedText = response.text;

        const htmlText = extractedText
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .split('\n').map(p => `<p>${p || '<br>'}</p>`).join('');

        restoreSelection();
        document.execCommand('insertHTML', false, htmlText);
        if (editorRef.current) {
            handleContentChange(editorRef.current.innerHTML);
        }
        setToast(t('toasts.ocrComplete'));
    } catch (error) {
        console.error("OCR failed:", error);
        setToast(t('toasts.aiError'));
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSaveDrawing = (imageDataUrl: string) => {
    if (editingDrawingElement) {
        editingDrawingElement.src = imageDataUrl;
        handleContentChange(editorRef.current!.innerHTML);
    } else {
        restoreSelection();
        const id = `drawing-${Date.now()}`;
        const imageHtml = `<img id="${id}" src="${imageDataUrl}" data-drawing="true" style="display: inline-block; max-width: 100%;" />`;
        document.execCommand('insertHTML', false, imageHtml);
        const newImg = editorRef.current?.querySelector(`#${id}`) as HTMLImageElement;
        if (newImg) newImg.removeAttribute('id');
    }
    setIsDrawingModalVisible(false);
    setEditingDrawingElement(null);
  };

  const handleOpenCropModal = () => {
    if (editingElement && editingElement.tagName === 'IMG') {
        setCroppingImageElement(editingElement as HTMLImageElement);
        setIsCropModalVisible(true);
    }
  };

  const handleApplyCrop = (dataUrl: string, newWidth: number, newHeight: number) => {
    if (croppingImageElement) {
        croppingImageElement.src = dataUrl;
        
        const currentWidth = croppingImageElement.offsetWidth;
        const newAspectRatio = newWidth / newHeight;
        const newDisplayHeight = currentWidth / newAspectRatio;

        croppingImageElement.style.width = `${currentWidth}px`;
        croppingImageElement.style.height = `${newDisplayHeight}px`;
        
        if (editorRef.current) {
            handleContentChange(editorRef.current.innerHTML);
        }
    }
    setIsCropModalVisible(false);
    setCroppingImageElement(null);
  };


  const pageDimensions: Record<PageSize, { width: string; height: string }> = {
    Letter: { width: '8.5in', height: '11in' },
    A4: { width: '8.27in', height: '11.69in' },
    Legal: { width: '8.5in', height: '14in' },
  };

  const { width, height } = pageDimensions[pageSize];
  const pageStyle: React.CSSProperties = {
    ...(pageOrientation === 'portrait'
        ? { width, minHeight: height }
        : { width: height, minHeight: width }),
    backgroundColor: pageColor,
    padding: `${pageMargins.top}in ${pageMargins.right}in ${pageMargins.bottom}in ${pageMargins.left}in`,
  };
  
  const handleApplyPageSetup = (settings: {
    size: PageSize,
    orientation: PageOrientation,
    margins: PageMargins,
    color: string,
    setAsDefault: boolean
  }) => {
    setPageSize(settings.size);
    setPageOrientation(settings.orientation);
    setPageMargins(settings.margins);
    setPageColor(settings.color);
    if (settings.setAsDefault) {
        localStorage.setItem('defaultPageSettings', JSON.stringify({
            size: settings.size,
            orientation: settings.orientation,
            margins: settings.margins,
            color: settings.color,
        }));
    }
    setIsPageSetupVisible(false);
  };

  const handleCloseSidebars = () => {
    setActivePanel(null);
    setEditingElement(null);
    setSelectedElement(null);
    setIsCommentsSidebarVisible(false);
    setIsAiSidekickVisible(false);
    setIsShortcutsSidebarVisible(false);
  };

  const isAnySidebarOpen = isAiSidekickVisible || activePanel || isCommentsSidebarVisible || isShortcutsSidebarVisible;

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col font-sans">
      {view === 'editor' ? (
        <div className="flex-grow flex flex-col overflow-hidden">
            <header className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-800 shadow-sm flex items-center md:block border-b border-gray-200 dark:border-gray-700">
                 <MenuBar 
                  onNewDocument={handleNewDocument}
                  onSave={handleSaveDocument}
                  onViewSaved={() => setView('drive')}
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
                    setIsAiSidekickVisible(false);
                    setIsShortcutsSidebarVisible(false);
                  }}
                  onToggleAiSidekick={() => {
                      if (!checkAiAvailability()) return;
                      setIsAiSidekickVisible(prev => !prev);
                      setActivePanel(null);
                      setIsCommentsSidebarVisible(false);
                      setIsShortcutsSidebarVisible(false);
                  }}
                  onOpenShortcuts={() => {
                    setIsShortcutsSidebarVisible(prev => !prev);
                    setActivePanel(null);
                    setIsCommentsSidebarVisible(false);
                    setIsAiSidekickVisible(false);
                  }}
                  onOpenSpecialCharacters={() => { saveSelection(); setIsSpecialCharVisible(true); }}
                  isSaving={isSaving}
                  lastSaved={lastSaved}
                  isDocumentSaved={!!currentDocId}
                  onOpenPageSetup={() => setIsPageSetupVisible(true)}
                  onOpenAboutModal={() => setIsAboutModalVisible(true)}
                  onInsertPageBreak={handleInsertPageBreak}
                  onSetLanguage={setLanguage}
                  onReadAloud={handleReadAloud}
                  isReadingAloud={isReadingAloud}
                  onToggleSpellcheck={() => setIsSpellcheckEnabled(prev => !prev)}
                  isSpellcheckEnabled={isSpellcheckEnabled}
                  onOpenFileImport={() => { saveSelection(); setIsImportModalVisible(true); }}
                  onInsertDrawing={() => { saveSelection(); setIsDrawingModalVisible(true); setEditingDrawingElement(null); }}
                  t={t}
                />
                <div className="w-full md:border-t md:border-gray-200 md:dark:border-gray-700">
                    <Toolbar 
                      editorRef={editorRef} 
                      onCopyFormatting={handleCopyFormatting} 
                      isFormatPainterActive={isFormatPainterActive}
                      onToggleAiSidekick={() => {
                          if (!checkAiAvailability()) return;
                          setIsAiSidekickVisible(prev => !prev);
                          setActivePanel(null);
                          setIsCommentsSidebarVisible(false);
                          setIsShortcutsSidebarVisible(false);
                      }}
                      onInsertChecklist={handleInsertChecklist}
                      t={t}
                    />
                </div>
            </header>
            
            <div className="flex-grow flex overflow-hidden relative">
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
                            className="relative mx-auto bg-white dark:bg-gray-900 shadow-2xl box-content"
                            style={pageStyle}
                        >
                            <Editor 
                              ref={editorRef} 
                              content={content} 
                              onChange={handleContentChange}
                              onMouseUp={handleEditorMouseUp}
                              onDoubleClick={handleDoubleClick}
                              onClick={handleClick}
                              spellCheck={isSpellcheckEnabled}
                            />
                            {selectedElement && (
                                <ObjectWrapper 
                                    targetElement={selectedElement}
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
                
                {isAnySidebarOpen && (
                    <>
                        {/* Backdrop for mobile */}
                        <div 
                            className="md:hidden fixed inset-0 bg-black bg-opacity-25 z-30" 
                            onClick={handleCloseSidebars} 
                        />
                        {/* Sidebar container */}
                        <div className="absolute top-0 right-0 h-full w-screen max-w-sm md:w-auto md:max-w-none md:relative z-40 md:flex-shrink-0">
                            {isAiSidekickVisible ? (
                                <AiSidekick
                                    ai={aiRef.current}
                                    onClose={handleCloseSidebars}
                                    onInsertText={(text) => {
                                        saveSelection();
                                        restoreSelection();
                                        document.execCommand('insertHTML', false, text);
                                    }}
                                    setToast={setToast}
                                    t={t}
                                />
                            ) : activePanel ? (
                                <SettingsSidebar
                                    activePanel={activePanel}
                                    editingElement={editingElement}
                                    onClose={handleCloseSidebars}
                                    onReplaceAll={handleReplaceAll}
                                    onApplyLink={handleApplyLink}
                                    onApplyImageSettings={handleApplyImageSettings}
                                    onInsertTable={handleInsertTable}
                                    onUpdateElementStyle={handleUpdateElementStyle}
                                    onChangeZIndex={handleChangeZIndex}
                                    onAiImageEdit={(prompt) => handleAiImageEdit(prompt, editingElement as HTMLImageElement)}
                                    onOpenCropModal={handleOpenCropModal}
                                    onTableAction={handleTableAction}
                                    onTableStyle={handleTableStyle}
                                    t={t}
                                />
                            ) : isCommentsSidebarVisible ? (
                                <CommentsSidebar 
                                    comments={comments.filter(c => !c.resolved)} 
                                    onResolve={handleResolveComment}
                                    onClose={handleCloseSidebars}
                                    onAddComment={() => { saveSelection(); handleOpenCommentModal(); }}
                                    t={t}
                                />
                            ) : isShortcutsSidebarVisible ? (
                                <ShortcutsSidebar 
                                    onClose={handleCloseSidebars}
                                    t={t}
                                />
                            ) : null}
                        </div>
                    </>
                )}
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
        <DriveView
          documents={documents}
          onOpenDocument={handleOpenDocument}
          onRenameDocument={handleRenameDocument}
          onDeleteDocument={handleDeleteDocument}
          onDuplicateDocument={handleDuplicateDocument}
          onPreviewDocument={handlePreviewDocument}
          onCreateNewDocument={handleNewDocument}
          onClose={() => setView('editor')}
          onExportAllDocuments={handleExportAllDocuments}
          onImportAllDocuments={handleImportAllDocuments}
          currentDocId={currentDocId}
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
      <PageSetupModal 
        isOpen={isPageSetupVisible} 
        onClose={() => setIsPageSetupVisible(false)} 
        onApply={handleApplyPageSetup}
        pageSettings={{
            size: pageSize,
            orientation: pageOrientation,
            margins: pageMargins,
            color: pageColor,
        }}
        t={t}
      />
      <DocumentPreviewModal 
        isOpen={isPreviewModalVisible} 
        onClose={() => setIsPreviewModalVisible(false)} 
        content={previewDocContent} 
        t={t} 
      />
      <AboutModal 
        isOpen={isAboutModalVisible} 
        onClose={() => setIsAboutModalVisible(false)} 
        t={t} 
      />
      <ImportModal 
        isOpen={isImportModalVisible} 
        onClose={() => setIsImportModalVisible(false)} 
        onImport={handleOcrImport} 
        t={t} 
      />
      <DrawingModal
        isOpen={isDrawingModalVisible}
        onClose={() => {
            setIsDrawingModalVisible(false);
            setEditingDrawingElement(null);
        }}
        onSave={handleSaveDrawing}
        initialDataUrl={editingDrawingElement?.src}
        t={t}
      />
      <CropModal
        isOpen={isCropModalVisible}
        onClose={() => {
            setIsCropModalVisible(false);
            setCroppingImageElement(null);
        }}
        onApply={handleApplyCrop}
        imageSrc={croppingImageElement?.src || null}
        t={t}
      />
    </div>
  );
};

export default App;