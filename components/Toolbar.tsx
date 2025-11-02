
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, ListOrderedIcon, ListUnorderedIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon, UndoIcon, RedoIcon, ClearFormattingIcon, ChevronDownIcon, TextColorIcon, BgColorIcon, LineHeightIcon, PaintBrushIcon, TextShadowIcon, SparklesIcon, ChecklistIcon, ChevronRightIcon } from './icons/EditorIcons';
import TextShadowDropdown from './TextShadowDropdown';

interface ToolbarProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onCopyFormatting: () => void;
  isFormatPainterActive: boolean;
  onToggleAiSidekick: () => void;
  onInsertChecklist: () => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

interface FontWeight {
  label: string;
  value: number; // e.g. 400 for normal, 700 for bold
}
interface FontFamily {
  value: string;
  label: string;
  weights?: FontWeight[];
}

const fontFamilies: FontFamily[] = [
  // System fonts
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'Times New Roman', Times, serif", label: 'Times New Roman' },
  { value: "'Courier New', Courier, monospace", label: 'Courier New' },
  // Georgian fonts from Google Fonts
  { value: "'Noto Sans Georgian', sans-serif", label: 'Noto Sans Georgian', weights: [{ label: 'Light', value: 300 }, { label: 'Normal', value: 400 }, { label: 'Medium', value: 500 }, { label: 'Bold', value: 700 }, { label: 'Black', value: 900 }] },
  { value: "'FiraGO', sans-serif", label: 'FiraGO', weights: [{ label: 'Light', value: 300 }, { label: 'Normal', value: 400 }, { label: 'Medium', value: 500 }, { label: 'Bold', value: 700 }, { label: 'Black', value: 900 }] },
  { value: "'Arimo', sans-serif", label: 'Arimo', weights: [{ label: 'Light', value: 300 }, { label: 'Normal', value: 400 }, { label: 'Medium', value: 500 }, { label: 'Bold', value: 700 }, { label: 'Black', value: 900 }] },
  // Other Google Fonts
  { value: "'Roboto', sans-serif", label: 'Roboto', weights: [{ label: 'Light', value: 300 }, { label: 'Normal', value: 400 }, { label: 'Medium', value: 500 }, { label: 'Bold', value: 700 }] },
  { value: "'Lato', sans-serif", label: 'Lato', weights: [{ label: 'Light', value: 300 }, { label: 'Normal', value: 400 }, { label: 'Bold', value: 700 }] },
  { value: "'Montserrat', sans-serif", label: 'Montserrat', weights: [{ label: 'Light', value: 300 }, { label: 'Normal', value: 400 }, { label: 'Medium', value: 500 }, { label: 'Bold', value: 700 }] },
  { value: "'Oswald', sans-serif", label: 'Oswald' },
  { value: "'Raleway', sans-serif", label: 'Raleway' },
  { value: "'Poppins', sans-serif", label: 'Poppins' },
  { value: "'Merriweather', serif", label: 'Merriweather' },
  { value: "'Playfair Display', serif", label: 'Playfair Display' },
  { value: "'Lobster', cursive", label: 'Lobster' },
];

const ToolbarButton: React.FC<{ onAction: (e: React.MouseEvent<HTMLButtonElement>) => void; children: React.ReactNode; tooltip: string; isActive?: boolean; buttonRef?: React.RefObject<HTMLButtonElement> }> = ({ onAction, children, tooltip, isActive = false, buttonRef }) => {
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); onAction(e); };
  return (
    <div className="relative group">
      <button ref={buttonRef} onMouseDown={handleMouseDown} className={`p-2 rounded-md transition-colors duration-150 ${isActive ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-200 dark:hover:bg-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500`}>
        {children}
      </button>
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {tooltip}
      </div>
    </div>
  );
};

const FontFamilyMenuItem: React.FC<{
    item: FontFamily;
    onSelect: (family: string, weight?: number) => void;
}> = ({ item, onSelect }) => {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
    const itemRef = useRef<HTMLButtonElement>(null);
    const submenuTimer = useRef<number | null>(null);
    const [submenuPosition, setSubmenuPosition] = useState<{ top: string; left: string } | null>(null);

    const handleMouseEnter = () => {
        if (submenuTimer.current) clearTimeout(submenuTimer.current);
        if (item.weights) {
            if (itemRef.current) {
                const rect = itemRef.current.getBoundingClientRect();
                setSubmenuPosition({ top: `${rect.top}px`, left: `${rect.right + 4}px` });
            }
            setIsSubmenuOpen(true);
        }
    };

    const handleMouseLeave = () => {
        submenuTimer.current = window.setTimeout(() => {
            setIsSubmenuOpen(false);
        }, 200);
    };

    const SubmenuPortal = (item.weights && isSubmenuOpen && submenuPosition) ? createPortal(
        <div 
            data-menu-part="true"
            className="fixed w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-[60] border border-gray-200 dark:border-gray-700"
            style={{ top: submenuPosition.top, left: submenuPosition.left }}
            onMouseEnter={handleMouseEnter} 
            onMouseLeave={handleMouseLeave}
        >
            {item.weights.map(weight => (
                <button key={weight.value} onMouseDown={(e) => { e.preventDefault(); onSelect(item.value, weight.value); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                    <span style={{ fontFamily: item.value, fontWeight: weight.value }}>{weight.label}</span>
                </button>
            ))}
        </div>,
        document.body
    ) : null;

    return (
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button
                ref={itemRef}
                onMouseDown={(e) => { e.preventDefault(); if (!item.weights) onSelect(item.value); }}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between"
            >
                <span style={{ fontFamily: item.value }}>{item.label}</span>
                {item.weights && <ChevronRightIcon />}
            </button>
            {SubmenuPortal}
        </div>
    );
};


const FontFamilyDropdown: React.FC<{
    label: string;
    items: FontFamily[];
    onSelect: (family: string, weight?: number) => void;
}> = ({ label, items, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const handleSelect = (family: string, weight?: number) => {
        onSelect(family, weight);
        setIsOpen(false);
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[data-menu-part="true"]')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const MenuPortal = createPortal(
        <div data-menu-part="true" ref={menuRef} style={{ 
            top: `${containerRef.current?.getBoundingClientRect().bottom + 4}px`, 
            left: `${containerRef.current?.getBoundingClientRect().left}px` 
        }} className="fixed w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto" role="menu">
            {items.map(item => (
                <FontFamilyMenuItem key={item.value} item={item} onSelect={handleSelect} />
            ))}
        </div>,
        document.body
    );

    return (
        <div ref={containerRef} data-menu-part="true" className="relative flex items-center border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 focus-within:ring-1 focus-within:ring-blue-500">
            <div className="flex-grow pl-2 pr-1 py-1.5 text-sm text-left truncate" style={{ maxWidth: '150px' }}>
                {label}
            </div>
            <div className="h-full w-px bg-gray-300 dark:bg-gray-600"></div>
            <button onMouseDown={(e) => { e.preventDefault(); setIsOpen(prev => !prev); }} aria-haspopup="true" aria-expanded={isOpen} className="p-1 rounded-r-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <ChevronDownIcon />
            </button>
            {isOpen && MenuPortal}
        </div>
    );
};


const ToolbarDropdown: React.FC<{ label: React.ReactNode; items: { value: string; label: string }[]; onSelect: (value: string) => void; widthClass?: string; }> = ({ label, items, onSelect, widthClass = "w-48" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({ top: rect.bottom + 4, left: rect.left });
        }
        setIsOpen(prev => !prev);
    };

    const handleSelect = (value: string) => { onSelect(value); setIsOpen(false); };

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (buttonRef.current && !buttonRef.current.contains(target)) {
                const portals = document.querySelectorAll('[role="menu"]');
                let isClickInsidePortal = false;
                portals.forEach(portal => { if (portal.contains(target)) { isClickInsidePortal = true; } });
                if (!isClickInsidePortal) { setIsOpen(false); }
            }
        };
        const handleScroll = () => setIsOpen(false);
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    const MenuPortal = menuPosition ? createPortal(
        <div style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }} className={`${widthClass} fixed bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700 flex flex-col`} role="menu">
            {items.map(item => (
                <button key={item.value} onMouseDown={(e) => { e.preventDefault(); handleSelect(item.value); }} className="text-left w-full px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600" role="menuitem">
                    {item.label}
                </button>
            ))}
        </div>,
        document.body
    ) : null;

    return (
        <>
            <button ref={buttonRef} onMouseDown={handleToggle} aria-haspopup="true" aria-expanded={isOpen} className="flex items-center gap-1 px-2 py-1.5 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150">
                <span className="truncate max-w-[120px]">{label}</span>
                <ChevronDownIcon />
            </button>
            {isOpen && MenuPortal}
        </>
    );
};


const ColorPicker: React.FC<{ onAction: (color: string) => void; tooltip: string; children: React.ReactNode }> = ({ onAction, tooltip, children }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => { onAction(e.target.value); };
    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); inputRef.current?.click(); };
    return (
        <div className="relative group">
            <button onMouseDown={handleButtonClick} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150">
                {children}
            </button>
            <input type="color" ref={inputRef} onChange={handleColorChange} className="absolute w-0 h-0 opacity-0" />
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {tooltip}
            </div>
        </div>
    );
};

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72];

const FontSizeCombobox: React.FC<{ value: string; onChange: (size: number) => void; }> = ({ value, onChange }) => {
    const [inputValue, setInputValue] = useState(String(parseInt(value, 10) || 12));
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimer = useRef<number | null>(null);

    useEffect(() => {
        if (document.activeElement !== inputRef.current) {
            setInputValue(String(parseInt(value, 10) || 12));
        }
    }, [value]);

    useEffect(() => {
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, []);

    const handleValueChange = (newStringValue: string) => {
        setInputValue(newStringValue);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = window.setTimeout(() => {
            const size = parseInt(newStringValue, 10);
            if (!isNaN(size) && size > 0) {
                onChange(size);
            }
        }, 300);
    };

    const handleBlur = () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        const size = parseInt(inputValue, 10);
        if (!isNaN(size) && size > 0) {
            if(size !== (parseInt(value, 10) || 12)) onChange(size);
        } else {
            setInputValue(String(parseInt(value, 10) || 12));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            const size = parseInt(inputValue, 10);
            if (!isNaN(size) && size > 0) {
                onChange(size);
            }
            inputRef.current?.blur();
        }
    };
    
    const handleSelect = (size: number) => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        setInputValue(String(size));
        onChange(size);
        setIsOpen(false);
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative flex items-center border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 focus-within:ring-1 focus-within:ring-blue-500">
            <input
                ref={inputRef}
                type="number"
                value={inputValue}
                onChange={(e) => handleValueChange(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-10 pl-2 py-1.5 text-center bg-transparent focus:outline-none text-sm [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="h-full w-px bg-gray-300 dark:bg-gray-600"></div>
            <button onMouseDown={(e) => { e.preventDefault(); setIsOpen(prev => !prev); }} className="p-1 rounded-r-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <ChevronDownIcon />
            </button>
            {isOpen && createPortal(
                <div 
                    style={{ 
                        top: `${containerRef.current?.getBoundingClientRect().bottom + 4}px`, 
                        left: `${containerRef.current?.getBoundingClientRect().left}px`,
                        width: `${containerRef.current?.getBoundingClientRect().width}px`
                    }}
                    className="fixed bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
                >
                    {fontSizes.map(size => (
                        <button 
                            key={size}
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(size); }}
                            className="w-full text-center px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            {size}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};


const Toolbar: React.FC<ToolbarProps> = ({ editorRef, onCopyFormatting, isFormatPainterActive, onToggleAiSidekick, onInsertChecklist, t }) => {
    const [toolbarState, setToolbarState] = useState({
        fontName: 'Arial',
        fontWeight: 400,
        fontSize: '12pt',
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        ol: false,
        ul: false,
        align: 'left' as 'left' | 'center' | 'right' | 'justify',
        textShadow: 'none',
    });
    const [isTextShadowDropdownOpen, setIsTextShadowDropdownOpen] = useState(false);
    const textShadowButtonRef = useRef<HTMLButtonElement>(null);
    
    const updateToolbarState = useCallback(() => {
        if (!editorRef.current || !document.getSelection()?.rangeCount) return;
        
        let element = window.getSelection()?.anchorNode;
        if (element?.nodeType !== Node.ELEMENT_NODE) {
            element = element?.parentElement;
        }
        if (!element) return;
        
        const styles = window.getComputedStyle(element as Element);
        const fontName = styles.fontFamily.split(',')[0].replace(/['"]/g, '').trim() || 'Arial';
        const fontWeight = parseInt(styles.fontWeight, 10) || 400;
        
        const fontSizePx = parseFloat(styles.fontSize);
        const fontSizePt = Math.round(fontSizePx * 0.75); // 1px = 0.75pt
        const fontSize = `${fontSizePt}pt`;

        const textShadow = styles.textShadow;
        
        setToolbarState({
            fontName, fontWeight, fontSize,
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikethrough'),
            ol: document.queryCommandState('insertOrderedList'),
            ul: document.queryCommandState('insertUnorderedList'),
            align: document.queryCommandState('justifyCenter') ? 'center' : document.queryCommandState('justifyRight') ? 'right' : document.queryCommandState('justifyFull') ? 'justify' : 'left',
            textShadow,
        });
    }, [editorRef]);

    useEffect(() => {
        const editor = editorRef.current;
        const handleSelectionChange = () => requestAnimationFrame(updateToolbarState);
        document.addEventListener('selectionchange', handleSelectionChange);
        if (editor) {
            editor.addEventListener('click', handleSelectionChange);
            editor.addEventListener('keyup', handleSelectionChange);
            editor.addEventListener('focus', handleSelectionChange);
        }
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            if (editor) {
                editor.removeEventListener('click', handleSelectionChange);
                editor.removeEventListener('keyup', handleSelectionChange);
                editor.removeEventListener('focus', handleSelectionChange);
            }
        };
    }, [editorRef, updateToolbarState]);

  const executeCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    updateToolbarState();
  };

  const wrapSelectionWithSpan = (style: Partial<CSSStyleDeclaration>): HTMLSpanElement | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    Object.assign(span.style, style);

    try {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNode(span);
        selection.addRange(newRange);
        return span;
    } catch (e) {
        // This can fail with complex selections (e.g. across table cells).
        // A more robust implementation would walk the DOM nodes in the range.
        console.error("Could not wrap selection:", e);
        return null;
    }
  };

  const getSelectionParentSpan = (styleProp: keyof CSSStyleDeclaration): HTMLSpanElement | null => {
      const selection = window.getSelection();
      if (!selection || !selection.anchorNode) return null;
      let parent = selection.anchorNode.parentElement;
      while (parent && parent !== editorRef.current) {
          if (parent.nodeName === 'SPAN' && parent.style[styleProp]) {
              return parent;
          }
          parent = parent.parentElement;
      }
      return null;
  };
  
  const applyTextShadow = (shadow: string) => {
      editorRef.current?.focus();
      const parentSpan = getSelectionParentSpan('textShadow');
      if (parentSpan) {
          parentSpan.style.textShadow = shadow;
      } else {
          wrapSelectionWithSpan({ textShadow: shadow });
      }
      updateToolbarState();
  };
  
  const removeTextShadow = () => {
      editorRef.current?.focus();
      const parentSpan = getSelectionParentSpan('textShadow');
      if (parentSpan) {
          parentSpan.style.textShadow = 'none';
          if (!parentSpan.getAttribute('style')) {
              const parent = parentSpan.parentNode;
              while (parentSpan.firstChild) {
                  parent?.insertBefore(parentSpan.firstChild, parentSpan);
              }
              parent?.removeChild(parentSpan);
          }
      }
      updateToolbarState();
  };
  
  const applyFont = (family: string, weight?: number) => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    const newStyles: Partial<CSSStyleDeclaration> = { fontFamily: family };
    if (weight) {
        newStyles.fontWeight = String(weight);
    } else {
        // Reset weight if not specified for this font family
        newStyles.fontWeight = '';
    }

    if (range.collapsed) {
        const span = document.createElement('span');
        Object.assign(span.style, newStyles);
        span.innerHTML = '&#8203;'; // Zero-width space
        range.insertNode(span);
        range.setStart(span, 1);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        // Use execCommand as a robust way to wrap content, even across block nodes.
        // We use a temporary, unique font name to find the elements later.
        const tempFontName = `__temp__${Date.now()}`;
        document.execCommand('fontName', false, tempFontName);
        
        const fontElements = editorRef.current?.querySelectorAll<HTMLElement>(`font[face="${tempFontName}"]`);
        
        fontElements?.forEach(fontElement => {
            const span = document.createElement('span');
            Object.assign(span.style, newStyles);
            
            while(fontElement.firstChild) {
                span.appendChild(fontElement.firstChild);
            }
            fontElement.parentNode?.replaceChild(span, fontElement);
        });
    }
    requestAnimationFrame(updateToolbarState);
  };

  const applyFontSize = (sizeInPt: number) => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    if (range.collapsed) {
        const span = document.createElement('span');
        span.style.fontSize = `${sizeInPt}pt`;
        span.innerHTML = '&#8203;'; // Zero-width space
        range.insertNode(span);
        range.setStart(span, 1);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        document.execCommand('fontSize', false, '1'); // Use a placeholder size
        const fontElements = editorRef.current?.querySelectorAll<HTMLElement>('font[size="1"]');
        fontElements?.forEach(fontElement => {
            fontElement.removeAttribute('size');
            fontElement.style.fontSize = `${sizeInPt}pt`;
        });
    }
    requestAnimationFrame(updateToolbarState);
  };


  const applyLineHeight = (value: string) => {
      editorRef.current?.focus();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      let commonAncestor = range.commonAncestorContainer;
      
      // Find the block-level parent(s) for the selection
      const getBlockParents = (node: Node): HTMLElement[] => {
          let current: Node | null = node;
          const parents: HTMLElement[] = [];
          while (current && current !== editorRef.current) {
              if (current.nodeType === Node.ELEMENT_NODE) {
                  const display = window.getComputedStyle(current as HTMLElement).display;
                  if (display.includes('block')) {
                      parents.push(current as HTMLElement);
                  }
              }
              current = current.parentNode;
          }
          return parents;
      };

      const blockParents = getBlockParents(commonAncestor);
      if (blockParents.length > 0) {
          blockParents.forEach(p => p.style.lineHeight = value);
      } else {
         // If no block parent is found, wrap the current paragraph
         document.execCommand('formatBlock', false, 'p');
         const newParentBlock = selection.getRangeAt(0).commonAncestorContainer.parentElement;
         if (newParentBlock && newParentBlock instanceof HTMLElement) {
             newParentBlock.style.lineHeight = value;
         }
      }
  };

  const currentFont = fontFamilies.find(f => f.value.toLowerCase().includes(toolbarState.fontName.toLowerCase())) || { label: toolbarState.fontName };
  const fontLabel = currentFont.label;
  const alignmentIcons = { left: <AlignLeftIcon />, center: <AlignCenterIcon />, right: <AlignRightIcon />, justify: <AlignJustifyIcon />, };
  const lineHeights = [ { value: '1', label: t('toolbar.lineHeights.single') }, { value: '1.5', label: '1.5' }, { value: '2', label: t('toolbar.lineHeights.double') }, { value: '2.5', label: '2.5' }, ];


  return (
    <div className="p-2 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
      <div className="flex-1 min-w-0 flex items-center flex-wrap gap-1">
        <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
          <ToolbarButton onAction={() => executeCommand('undo')} tooltip={t('toolbar.undo')}><UndoIcon /></ToolbarButton>
          <ToolbarButton onAction={() => executeCommand('redo')} tooltip={t('toolbar.redo')}><RedoIcon /></ToolbarButton>
          <ToolbarButton onAction={onCopyFormatting} tooltip={t('toolbar.formatPainter')} isActive={isFormatPainterActive}><PaintBrushIcon /></ToolbarButton>
        </div>
        
        <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
           <FontFamilyDropdown label={fontLabel} items={fontFamilies} onSelect={applyFont} />
           <FontSizeCombobox value={toolbarState.fontSize} onChange={applyFontSize} />
        </div>

        <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
          <ToolbarButton onAction={() => executeCommand('bold')} tooltip={t('toolbar.bold')} isActive={toolbarState.bold}><BoldIcon /></ToolbarButton>
          <ToolbarButton onAction={() => executeCommand('italic')} tooltip={t('toolbar.italic')} isActive={toolbarState.italic}><ItalicIcon /></ToolbarButton>
          <ToolbarButton onAction={() => executeCommand('underline')} tooltip={t('toolbar.underline')} isActive={toolbarState.underline}><UnderlineIcon /></ToolbarButton>
          <ToolbarButton onAction={() => executeCommand('strikethrough')} tooltip={t('toolbar.strikethrough')} isActive={toolbarState.strikethrough}><StrikethroughIcon /></ToolbarButton>
        </div>
        
        <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
            <ColorPicker onAction={(color) => executeCommand('foreColor', color)} tooltip={t('toolbar.textColor')}><TextColorIcon /></ColorPicker>
            <ColorPicker onAction={(color) => executeCommand('hiliteColor', color)} tooltip={t('toolbar.bgColor')}><BgColorIcon /></ColorPicker>
            <ToolbarButton buttonRef={textShadowButtonRef} onAction={() => setIsTextShadowDropdownOpen(true)} tooltip={t('toolbar.textShadow')} isActive={toolbarState.textShadow !== 'none'}><TextShadowIcon /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
          <ToolbarButton onAction={() => executeCommand('insertUnorderedList')} tooltip={t('toolbar.bulletedList')} isActive={toolbarState.ul}><ListUnorderedIcon /></ToolbarButton>
          <ToolbarButton onAction={() => executeCommand('insertOrderedList')} tooltip={t('toolbar.numberedList')} isActive={toolbarState.ol}><ListOrderedIcon /></ToolbarButton>
          <ToolbarButton onAction={onInsertChecklist} tooltip={t('toolbar.checklist')}><ChecklistIcon /></ToolbarButton>
        </div>
        
        <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
            <ToolbarDropdown
                label={alignmentIcons[toolbarState.align]}
                items={[
                    { value: 'justifyLeft', label: t('toolbar.alignLeft') }, { value: 'justifyCenter', label: t('toolbar.alignCenter') },
                    { value: 'justifyRight', label: t('toolbar.alignRight') }, { value: 'justifyFull', label: t('toolbar.alignJustify') },
                ]}
                onSelect={executeCommand} widthClass="w-56"
            />
            <ToolbarDropdown label={<LineHeightIcon />} items={lineHeights} onSelect={applyLineHeight} widthClass="w-28" />
        </div>

         <div className="flex items-center gap-1">
          <ToolbarButton onAction={() => executeCommand('removeFormat')} tooltip={t('toolbar.clearFormatting')}><ClearFormattingIcon /></ToolbarButton>
        </div>
      </div>
      <div className="flex items-center pl-2">
        <ToolbarButton onAction={onToggleAiSidekick} tooltip={t('toolbar.aiAssistant')}>
            <SparklesIcon className="text-yellow-500" />
        </ToolbarButton>
      </div>
      {isTextShadowDropdownOpen && (
          <TextShadowDropdown
            targetRef={textShadowButtonRef}
            initialValue={toolbarState.textShadow}
            onApply={applyTextShadow}
            onRemove={removeTextShadow}
            onClose={() => setIsTextShadowDropdownOpen(false)}
          />
      )}
    </div>
  );
};

export default Toolbar;