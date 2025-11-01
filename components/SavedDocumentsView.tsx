import React, { useState, useRef, useEffect } from 'react';
import type { Doc } from '../App';
import { GridViewIcon, ListViewIcon, MoreVerticalIcon, FileTextIcon, Trash2Icon, EditIcon } from './icons/EditorIcons';

interface SavedDocumentsViewProps {
  documents: Doc[];
  onOpenDocument: (docId: string) => void;
  onRenameDocument: (docId: string, newName: string) => void;
  onDeleteDocument: (docId: string) => void;
  onNewDocument: () => void;
}

const DocumentItemMenu: React.FC<{
  onRename: () => void;
  onDelete: () => void;
}> = ({ onRename, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(prev => !prev); }}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
        aria-label="Document options"
      >
        <MoreVerticalIcon className="w-5 h-5" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
          <button
            onClick={(e) => { e.stopPropagation(); onRename(); setIsOpen(false); }}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <EditIcon className="w-4 h-4 mr-2" /> Rename
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); setIsOpen(false); }}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <Trash2Icon className="w-4 h-4 mr-2" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

const DocumentItem: React.FC<{
  doc: Doc;
  viewMode: 'grid' | 'list';
  onOpenDocument: (docId: string) => void;
  onRenameDocument: (docId: string, newName: string) => void;
  onDeleteDocument: (docId: string) => void;
}> = ({ doc, viewMode, onOpenDocument, onRenameDocument, onDeleteDocument }) => {
  
  const handleRename = () => {
    const newName = prompt("Enter new name for the document:", doc.name);
    if (newName && newName.trim() !== "") {
      onRenameDocument(doc.id, newName.trim());
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      onDeleteDocument(doc.id);
    }
  };
  
  const formattedDate = new Date(doc.updatedAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  if (viewMode === 'grid') {
    return (
      <div
        onClick={() => onOpenDocument(doc.id)}
        className="group cursor-pointer flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200"
      >
        <div className="flex-grow p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center h-32">
          <FileTextIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
        </div>
        <div className="p-3 flex items-center justify-between">
          <div className="flex-grow overflow-hidden">
            <p className="font-medium text-sm truncate text-gray-800 dark:text-gray-100">{doc.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Updated: {formattedDate}</p>
          </div>
          <div className="flex-shrink-0 -mr-2">
            <DocumentItemMenu onRename={handleRename} onDelete={handleDelete} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onOpenDocument(doc.id)}
      className="group cursor-pointer flex items-center p-3 bg-white dark:bg-gray-800 rounded-md border border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-200 dark:hover:border-gray-700 transition-colors duration-150"
    >
      <FileTextIcon className="w-6 h-6 mr-4 text-gray-400 dark:text-gray-500" />
      <div className="flex-grow">
        <p className="font-medium text-sm text-gray-800 dark:text-gray-100">{doc.name}</p>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 w-40 text-right hidden md:block">
        Updated: {formattedDate}
      </div>
      <div className="ml-4 flex-shrink-0">
         <DocumentItemMenu onRename={handleRename} onDelete={handleDelete} />
      </div>
    </div>
  );
};


const SavedDocumentsView: React.FC<SavedDocumentsViewProps> = (props) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const sortedDocs = [...props.documents].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="h-full flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2 bg-white dark:bg-gray-800">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Saved Documents</h1>
          <div className="flex items-center gap-2">
            <button
                onClick={props.onNewDocument}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                New Document
            </button>
            <div className="flex items-center bg-gray-100 dark:bg-gray-900/50 p-1 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-blue-600' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                aria-label="Grid view"
              >
                <GridViewIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-blue-600' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                aria-label="List view"
              >
                <ListViewIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-grow overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
           <div className="max-w-5xl mx-auto p-4 md:p-6">
              {sortedDocs.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {sortedDocs.map(doc => <DocumentItem key={doc.id} doc={doc} viewMode="grid" {...props} />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sortedDocs.map(doc => <DocumentItem key={doc.id} doc={doc} viewMode="list" {...props} />)}
                  </div>
                )
              ) : (
                <div className="text-center py-16">
                  <FileTextIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">No Saved Documents</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Click "New Document" to get started.</p>
                </div>
              )}
           </div>
        </main>
    </div>
  );
};

export default SavedDocumentsView;
