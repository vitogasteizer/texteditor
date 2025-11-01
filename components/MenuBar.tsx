
import React, { useState, useRef, useEffect } from 'react';
// FIX: Import ChevronRightIcon to fix missing component error.
import { MenuIcon, CloseIcon, FilePlusIcon, SaveIcon, FolderIcon, DownloadIcon, PrinterIcon, UndoIcon, RedoIcon, ScissorsIcon, CopyIcon, ClipboardIcon, SelectAllIcon, SearchIcon, LinkIcon, ImageIcon, TableIcon, MinusIcon, MessageSquareIcon, CodeIcon, BarChartIcon, EyeIcon, MaximizeIcon, InfoIcon, OmegaIcon, PaintBrushIcon, PdfIcon, SquareIcon, CircleIcon, TriangleIcon, TypeIcon, ChevronRightIcon } from './icons/EditorIcons';
import type { ShapeType } from '../App';

type MenuItem =
  | {
      label: string;
      // FIX: Made action optional to allow menu items that are only containers for submenus.
      action?: () => void;
      icon?: React.ReactNode;
      separator?: false;
      items?: MenuItem[];
    }
  | {
      label?: string;
      action?: () => void;
      icon?: React.ReactNode;
      separator: true;
      items?: never;
    };

interface MenuBarProps {
  onNewDocument: () => void;
  onSave: () => void;
  onViewSaved: () => void;
  onExportToWord: () => void;
  onExportToPdf: () => void;
  onPrint: () => void;
  onEditAction: (command: string) => void;
  onOpenFindReplace: () => void;
  onCopyFormatting: () => void;
  onInsertLink: () => void;
  onInsertImage: () => void;
  onInsertTable: () => void;
  onInsertShape: (shapeType: ShapeType) => void;
  onInsertHorizontalRule: () => void;
  onAddComment: () => void;
  onOpenSourceCode: () => void;
  onOpenWordCount: () => void;
  onToggleFullscreen: () => void;
  onPreview: () => void;
  onShowComments: () => void;
  onOpenSpecialCharacters: () => void;
  isSaving: boolean;
  lastSaved: number | null;
  isDocumentSaved: boolean;
}

const MenuDropdown: React.FC<{ label: string; items: MenuItem[] }> = ({ label, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setOpenSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action?: () => void) => {
    if (action) {
      action();
      setIsOpen(false);
      setOpenSubmenu(null);
    }
  };

  return (
    <div className="relative" ref={menuRef} onMouseLeave={() => setOpenSubmenu(null)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="px-3 py-1.5 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-150"
      >
        {label}
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700" role="menu">
          {items.map((item, index) =>
            item.separator ? (
              <div key={`sep-${index}`} className="border-t border-gray-200 dark:border-gray-700 my-1" />
            ) : (
              <div key={item.label} className="relative" onMouseEnter={() => item.items && setOpenSubmenu(item.label)}>
                  <button
                    onClick={() => handleAction(item.action)}
                    className="text-left w-full px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between"
                    role="menuitem"
                  >
                    <div className="flex items-center">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.items && <ChevronRightIcon />}
                  </button>
                  {item.items && openSubmenu === item.label && (
                    <div className="absolute left-full -top-1 ml-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20 border border-gray-200 dark:border-gray-700">
                        {item.items.map(subItem => (
                             <button
                                key={subItem.label}
                                onClick={() => handleAction(subItem.action)}
                                className="text-left w-full px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
                                role="menuitem"
                            >
                                {subItem.icon}
                                <span>{subItem.label}</span>
                            </button>
                        ))}
                    </div>
                  )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};


const MobileAccordionItem: React.FC<{ 
    label: string; 
    items: MenuItem[]; 
    onAction: (action?: () => void) => void;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ label, items, onAction, isOpen, onToggle }) => {
    return (
        <li className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <button
                onClick={onToggle}
                className="w-full text-left flex justify-between items-center p-4"
                aria-expanded={isOpen}
            >
                <span className="text-lg font-medium">{label}</span>
                <svg className={`w-5 h-5 transform transition-transform text-gray-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="pb-2 px-4">
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                        {items.map((item, index) =>
                            item.separator ? (
                                <div key={`sep-${index}`} className="border-t border-gray-200 dark:border-gray-700 my-1" />
                            ) : item.items ? (
                                <div key={item.label}>
                                    <h3 className="px-2 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center">{item.icon} {item.label}</h3>
                                    <div className="pl-4">
                                        {item.items.map(subItem => (
                                             <button
                                                key={subItem.label}
                                                onClick={() => onAction(subItem.action)}
                                                className="text-left block w-full px-2 py-2 text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md flex items-center"
                                            >
                                                {subItem.icon}
                                                <span>{subItem.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <button
                                    key={item.label}
                                    onClick={() => onAction(item.action)}
                                    className="text-left block w-full px-2 py-2 text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md flex items-center"
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </button>
                            )
                        )}
                    </div>
                </div>
            )}
        </li>
    );
};

const AutoSaveStatus: React.FC<{ isSaving: boolean; lastSaved: number | null; isDocumentSaved: boolean }> = ({ isSaving, lastSaved, isDocumentSaved }) => {
    if (!isDocumentSaved) return null;

    let statusText = '';
    if (isSaving) {
        statusText = 'Saving...';
    } else if (lastSaved) {
        const time = new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        statusText = `Last saved at ${time}`;
    }

    return (
        <div className="hidden md:flex items-center text-sm text-gray-500 dark:text-gray-400 transition-opacity">
            {statusText}
        </div>
    );
};

const MenuBar: React.FC<MenuBarProps> = (props) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);

    const handleAccordionToggle = (label: string) => {
        setOpenAccordion(currentOpen => (currentOpen === label ? null : label));
    };

    const fileMenuItems: MenuItem[] = [
        { label: 'New Document', action: props.onNewDocument, icon: <FilePlusIcon isMenuIcon /> },
        { label: 'Save', action: props.onSave, icon: <SaveIcon isMenuIcon /> },
        { label: 'View Saved', action: props.onViewSaved, icon: <FolderIcon isMenuIcon /> },
        { separator: true },
        { label: 'Export to Word', action: props.onExportToWord, icon: <DownloadIcon isMenuIcon /> },
        { label: 'Export to PDF', action: props.onExportToPdf, icon: <PdfIcon isMenuIcon /> },
        { separator: true },
        { label: 'Print...', action: props.onPrint, icon: <PrinterIcon isMenuIcon /> },
    ];

    const editMenuItems: MenuItem[] = [
        { label: 'Undo', action: () => props.onEditAction('undo'), icon: <UndoIcon isMenuIcon /> },
        { label: 'Redo', action: () => props.onEditAction('redo'), icon: <RedoIcon isMenuIcon /> },
        { separator: true },
        { label: 'Cut', action: () => props.onEditAction('cut'), icon: <ScissorsIcon isMenuIcon /> },
        { label: 'Copy', action: () => props.onEditAction('copy'), icon: <CopyIcon isMenuIcon /> },
        { label: 'Paste', action: () => props.onEditAction('paste'), icon: <ClipboardIcon isMenuIcon /> },
        { separator: true },
        { label: 'Format Painter', action: props.onCopyFormatting, icon: <PaintBrushIcon isMenuIcon /> },
        { separator: true },
        { label: 'Select All', action: () => props.onEditAction('selectAll'), icon: <SelectAllIcon isMenuIcon /> },
        { separator: true },
        { label: 'Find and Replace...', action: props.onOpenFindReplace, icon: <SearchIcon isMenuIcon /> },
    ];
    
    const insertMenuItems: MenuItem[] = [
        { label: 'Link...', action: props.onInsertLink, icon: <LinkIcon isMenuIcon /> },
        { label: 'Image...', action: props.onInsertImage, icon: <ImageIcon isMenuIcon /> },
        { label: 'Table...', action: props.onInsertTable, icon: <TableIcon isMenuIcon /> },
        { label: 'Shapes', icon: <SquareIcon isMenuIcon />, items: [
            { label: 'Textbox', action: () => props.onInsertShape('textbox'), icon: <TypeIcon isMenuIcon /> },
            { label: 'Rectangle', action: () => props.onInsertShape('rectangle'), icon: <SquareIcon isMenuIcon /> },
            { label: 'Circle', action: () => props.onInsertShape('circle'), icon: <CircleIcon isMenuIcon /> },
            { label: 'Triangle', action: () => props.onInsertShape('triangle'), icon: <TriangleIcon isMenuIcon /> },
        ] },
        { label: 'Horizontal Line', action: props.onInsertHorizontalRule, icon: <MinusIcon isMenuIcon /> },
        { label: 'Special character...', action: props.onOpenSpecialCharacters, icon: <OmegaIcon isMenuIcon /> },
        { separator: true },
        { label: 'Add Comment', action: props.onAddComment, icon: <MessageSquareIcon isMenuIcon /> },
    ];
    
    const toolsMenuItems: MenuItem[] = [
        { label: 'Source code', action: props.onOpenSourceCode, icon: <CodeIcon isMenuIcon /> },
        { label: 'Word count', action: props.onOpenWordCount, icon: <BarChartIcon isMenuIcon /> },
    ];

    const viewMenuItems: MenuItem[] = [
        { label: 'Preview', action: props.onPreview, icon: <EyeIcon isMenuIcon /> },
        { label: 'Fullscreen', action: props.onToggleFullscreen, icon: <MaximizeIcon isMenuIcon /> },
        { separator: true },
        { label: 'Show Comments', action: props.onShowComments, icon: <MessageSquareIcon isMenuIcon /> },
    ];

    const helpMenuItems: MenuItem[] = [{ label: 'About', action: () => alert('This is an online text editor.'), icon: <InfoIcon isMenuIcon /> }];

    const menus = [
        { label: 'File', items: fileMenuItems },
        { label: 'Edit', items: editMenuItems },
        { label: 'Insert', items: insertMenuItems },
        { label: 'Tools', items: toolsMenuItems },
        { label: 'View', items: viewMenuItems },
        { label: 'Help', items: helpMenuItems },
    ];

    const handleMobileAction = (action?: () => void) => {
        if(action) action();
        setIsMobileMenuOpen(false);
    };

    return (
        <nav className="px-2 py-1 flex items-center">
            <div className="md:hidden">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                    aria-label="Open menu"
                >
                    <MenuIcon />
                </button>
            </div>

            <div className="hidden md:flex items-center gap-1">
                {menus.map(menu => <MenuDropdown key={menu.label} label={menu.label} items={menu.items} />)}
            </div>
            
            <div className="flex-grow" />

            <AutoSaveStatus isSaving={props.isSaving} lastSaved={props.lastSaved} isDocumentSaved={props.isDocumentSaved} />
            
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col" role="dialog" aria-modal="true">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold">Menu</h2>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2" aria-label="Close menu">
                            <CloseIcon />
                        </button>
                    </div>
                    <ul className="flex-grow overflow-y-auto">
                        {menus.map(menu => (
                            <MobileAccordionItem 
                                key={menu.label} 
                                label={menu.label} 
                                items={menu.items} 
                                onAction={handleMobileAction} 
                                isOpen={openAccordion === menu.label} 
                                onToggle={() => handleAccordionToggle(menu.label)} 
                            />
                        ))}
                    </ul>
                </div>
            )}
        </nav>
    );
};

export default MenuBar;