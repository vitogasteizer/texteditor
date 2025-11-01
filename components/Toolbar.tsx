
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, ListOrderedIcon, ListUnorderedIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon, UndoIcon, RedoIcon, ClearFormattingIcon, ChevronDownIcon, TextColorIcon, BgColorIcon, LineHeightIcon, PaintBrushIcon, ChevronRightIcon, TextShadowIcon } from './icons/EditorIcons';
import TextShadowDropdown from './TextShadowDropdown';

interface ToolbarProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onCopyFormatting: () => void;
  isFormatPainterActive: boolean;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

interface FontWeight { value: string; label: string; }
interface FontFamily {
  value: string;
  label: string;
  weights?: FontWeight[];
}

const fontFamilies: FontFamily[] = [
  { value: 'Arial', label: 'Arial' },
  {
    value: 'Noto Sans Georgian',
    label: 'Noto Sans Georgian',
    weights: [
        { value: '300', label: 'Light' }, { value: '400', label: 'Normal' }, { value: '500', label: 'Medium' },
        { value: '700', label: 'Bold' }, { value: '900', label: 'Black' },
    ],
  },
  {
    value: 'FiraGO',
    label: 'FiraGO',
     weights: [
        { value: '300', label: 'Light' }, { value: '400', label: 'Normal' }, { value: '500', label: 'Medium' },
        { value: '700', label: 'Bold' }, { value: '900', label: 'Black' },
    ],
  },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Verdana', label: 'Verdana' },
  { 
    value: 'Roboto', 
    label: 'Roboto',
    weights: [
        { value: '300', label: 'Light' }, { value: '400', label: 'Normal' }, { value: '500', label: 'Medium' },
        { value: '700', label: 'Bold' }, { value: '900', label: 'Black' },
    ],
  },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Lobster', label: 'Lobster' },
];

const fontSizes = [
  { value: '1', label: '8pt' }, { value: '2', label: '10pt' }, { value: '3', label: '12pt' },
  { value: '4', label: '14pt' }, { value: '5', label: '18pt' }, { value: '6', label: '24pt' },
  { value: '7', label: '36pt' },
];
const sizeValueToLabelMap = new Map(fontSizes.map(s => [s.value, s.label]));

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

const FontFamilyDropdown: React.FC<{
    label: string;
    items: FontFamily[];
    onSelect: (family: string, weight?: string) => void;
    t: (key: string) => string;
}> = ({ label, items, onSelect, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({ top: rect.bottom + 4, left: rect.left });
        }
        setIsOpen(prev => !prev);
    };

    const handleSelect = (family: string, weight?: string) => {
        onSelect(family, weight);
        setIsOpen(false);
        setOpenSubmenu(null);
    };
    
    const handleItemClick = (item: FontFamily) => {
        if (item.weights) {
            setOpenSubmenu(prev => prev === item.value ? null : item.value);
        } else {
            handleSelect(item.value);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isClickingButton = buttonRef.current && buttonRef.current.contains(target);
            const isClickingMenu = menuRef.current && menuRef.current.contains(target);
            if (!isClickingButton && !isClickingMenu) {
                setIsOpen(false);
                setOpenSubmenu(null);
            }
        };
        const handleScroll = () => {
          setIsOpen(false);
          setOpenSubmenu(null);
        }

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);
    
    const getWeightLabel = (label: string): string => {
        return t(`toolbar.fontWeights.${label.toLowerCase()}`) || label;
    }


    const MenuPortal = menuPosition ? createPortal(
        <div ref={menuRef} style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }} className="fixed w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700" role="menu">
            {items.map(item => (
                <div key={item.value} className="relative">
                    <button onMouseDown={(e) => { e.preventDefault(); handleItemClick(item); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between">
                        <span style={{ fontFamily: item.value }}>{item.label}</span>
                        {item.weights && <ChevronRightIcon />}
                    </button>
                    {item.weights && openSubmenu === item.value && (
                        <div className="absolute left-full -top-1 ml-1 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                            {item.weights.map(weight => (
                                <button key={weight.value} onMouseDown={(e) => { e.preventDefault(); handleSelect(item.value, weight.value); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                                    <span style={{ fontFamily: item.value, fontWeight: parseInt(weight.value) }}>{getWeightLabel(weight.label)}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>,
        document.body
    ) : null;

    return (
        <>
            <button ref={buttonRef} onMouseDown={handleToggle} aria-haspopup="true" aria-expanded={isOpen} className="flex items-center gap-1 px-2 py-1.5 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150">
                <span className="truncate max-w-[150px]">{label}</span>
                <ChevronDownIcon />
            </button>
            {isOpen && MenuPortal}
        </>
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

const Toolbar: React.FC<ToolbarProps> = ({ editorRef, onCopyFormatting, isFormatPainterActive, t }) => {
    const [toolbarState, setToolbarState] = useState({
        fontName: 'Arial',
        fontSize: '12pt',
        fontWeight: 'Normal',
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
        
        const weightValueToLabelMap: Record<string, string> = { 
            '300': t('toolbar.fontWeights.light'), '400': t('toolbar.fontWeights.normal'), 'normal': t('toolbar.fontWeights.normal'), 
            '500': t('toolbar.fontWeights.medium'), '700': t('toolbar.fontWeights.bold'), 'bold': t('toolbar.fontWeights.bold'), '900': t('toolbar.fontWeights.black')
        };

        const styles = window.getComputedStyle(element as Element);
        const fontName = styles.fontFamily.split(',')[0].replace(/['"]/g, '').trim() || 'Arial';
        const fontSizeValue = document.queryCommandValue('fontSize');
        const fontSize = sizeValueToLabelMap.get(fontSizeValue) || '12pt';
        const fontWeightValue = styles.fontWeight;
        const fontWeight = weightValueToLabelMap[fontWeightValue] || t('toolbar.fontWeights.normal');
        const textShadow = styles.textShadow;
        
        setToolbarState({
            fontName, fontSize, fontWeight,
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikethrough'),
            ol: document.queryCommandState('insertOrderedList'),
            ul: document.queryCommandState('insertUnorderedList'),
            align: document.queryCommandState('justifyCenter') ? 'center' : document.queryCommandState('justifyRight') ? 'right' : document.queryCommandState('justifyFull') ? 'justify' : 'left',
            textShadow,
        });
    }, [editorRef, t]);

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
        // Handle cases where selection spans multiple blocks
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNode(span);
        selection.addRange(newRange);
        return span;
    } catch (e) {
        // Fallback for simpler selections
        try {
            range.surroundContents(span);
            selection.removeAllRanges();
            const newRange = document.createRange();
            newRange.selectNode(span);
            selection.addRange(newRange);
            return span;
        } catch (e2) {
            console.error("Could not wrap selection:", e2);
            return null;
        }
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
          // If no other styles, unwrap the span
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
  
  const applyFontAndWeight = (family: string, weight?: string) => {
    editorRef.current?.focus();
    executeCommand('fontName', family);

    if (weight) {
      wrapSelectionWithSpan({ fontWeight: weight, fontFamily: `'${family}', sans-serif`});
    }
    requestAnimationFrame(updateToolbarState);
  };

  const applyLineHeight = (value: string) => {
      editorRef.current?.focus();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      let node = selection.anchorNode;
      if (!node) return;
      while(node && node.nodeType !== Node.ELEMENT_NODE) { node = node.parentNode; }
      let element = node as HTMLElement;
      while (element && window.getComputedStyle(element).display.includes('inline')) {
          element = element.parentElement as HTMLElement;
      }
      if (element && element !== editorRef.current) { element.style.lineHeight = value; }
      else if (editorRef.current) {
          document.execCommand('formatBlock', false, 'p');
          const parentBlock = window.getSelection()?.getRangeAt(0).commonAncestorContainer.parentElement;
          if(parentBlock) { parentBlock.style.lineHeight = value; }
      }
  };

  const fontLabel = `${toolbarState.fontName}${toolbarState.fontWeight !== t('toolbar.fontWeights.normal') ? ` (${toolbarState.fontWeight})` : ''}`;
  const alignmentIcons = { left: <AlignLeftIcon />, center: <AlignCenterIcon />, right: <AlignRightIcon />, justify: <AlignJustifyIcon />, };
  const lineHeights = [ { value: '1', label: t('toolbar.lineHeights.single') }, { value: '1.5', label: '1.5' }, { value: '2', label: t('toolbar.lineHeights.double') }, { value: '2.5', label: '2.5' }, ];


  return (
    <div className="p-2 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap pb-2 -mb-2">
        <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
          <ToolbarButton onAction={() => executeCommand('undo')} tooltip={t('toolbar.undo')}><UndoIcon /></ToolbarButton>
          <ToolbarButton onAction={() => executeCommand('redo')} tooltip={t('toolbar.redo')}><RedoIcon /></ToolbarButton>
          <ToolbarButton onAction={onCopyFormatting} tooltip={t('toolbar.formatPainter')} isActive={isFormatPainterActive}><PaintBrushIcon /></ToolbarButton>
        </div>
        
        <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
           <FontFamilyDropdown label={fontLabel} items={fontFamilies} onSelect={applyFontAndWeight} t={t} />
           <ToolbarDropdown label={toolbarState.fontSize} items={fontSizes} onSelect={(value) => executeCommand('fontSize', value)} widthClass="w-24" />
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