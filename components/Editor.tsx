
import React, { forwardRef, useCallback, useEffect, useRef } from 'react';

declare var katex: any;

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onMouseUp: () => void;
  onDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  spellCheck: boolean;
}

const Editor = forwardRef<HTMLDivElement, EditorProps>(({ content, onChange, onMouseUp, onDoubleClick, onClick, spellCheck }, ref) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const contentRef = ref || internalRef;
  const resizingRef = useRef<{
      isResizing: boolean;
      table: HTMLTableElement | null;
      column: HTMLTableCellElement | null;
      startX: number;
      startWidth: number;
  }>({ isResizing: false, table: null, column: null, startX: 0, startWidth: 0 });

  const handleInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
    onChange(event.currentTarget.innerHTML);
  }, [onChange]);

  // Math Rendering Logic
  const renderMath = () => {
      const editor = contentRef && 'current' in contentRef ? contentRef.current : null;
      if (!editor || typeof katex === 'undefined') return;

      const mathNodes = editor.querySelectorAll('.math-node');
      mathNodes.forEach(node => {
          const latex = (node as HTMLElement).dataset.latex;
          if (latex && !node.getAttribute('data-rendered')) {
              try {
                  katex.render(latex, node, { throwOnError: false });
                  node.setAttribute('data-rendered', 'true');
                  // Make it non-editable content-wise so backspace deletes the whole unit
                  node.setAttribute('contenteditable', 'false'); 
              } catch (e) {
                  console.error(e);
              }
          }
      });
  };

  useEffect(() => {
    renderMath();
  }, [content]);

  useEffect(() => {
    const editor = contentRef && 'current' in contentRef ? contentRef.current : null;
    if (editor && editor.innerHTML !== content) {
      // This helps in preserving the cursor position on external updates (like loading a doc).
      const selection = window.getSelection();
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
      
      editor.innerHTML = content;
      renderMath();
      
      if(range && selection) {
        try {
            // Check if the container is still in the DOM before restoring
            if (document.body.contains(range.startContainer)) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
        } catch(e){
            console.error("Failed to restore cursor position.", e);
        }
      }
    }
  }, [content, contentRef]);

  // Table Resizing Logic
  useEffect(() => {
      const editor = contentRef && 'current' in contentRef ? (contentRef as React.RefObject<HTMLDivElement>).current : null;
      if (!editor) return;

      const handleMouseMove = (e: MouseEvent) => {
          // If resizing, process the drag
          if (resizingRef.current.isResizing && resizingRef.current.column) {
              const diffX = e.clientX - resizingRef.current.startX;
              const newWidth = Math.max(20, resizingRef.current.startWidth + diffX);
              resizingRef.current.column.style.width = `${newWidth}px`;
              e.preventDefault(); // Prevent text selection
              return;
          }

          // Detect hover over cell borders
          const target = e.target as HTMLElement;
          const cell = target.closest('td, th') as HTMLTableCellElement;
          if (!cell || !editor.contains(cell)) {
              editor.style.cursor = 'auto';
              return;
          }

          const rect = cell.getBoundingClientRect();
          const edgeThreshold = 5; // pixels
          const isRightEdge = e.clientX > rect.right - edgeThreshold;
          
          if (isRightEdge) {
              editor.style.cursor = 'col-resize';
          } else {
              editor.style.cursor = 'auto';
          }
      };

      const handleMouseDown = (e: MouseEvent) => {
          if (editor.style.cursor === 'col-resize') {
              const target = e.target as HTMLElement;
              const cell = target.closest('td, th') as HTMLTableCellElement;
              if (cell) {
                  resizingRef.current = {
                      isResizing: true,
                      table: cell.closest('table'),
                      column: cell,
                      startX: e.clientX,
                      startWidth: cell.offsetWidth,
                  };
                  e.preventDefault();
                  e.stopPropagation();
              }
          }
      };

      const handleMouseUpGlobal = () => {
          if (resizingRef.current.isResizing) {
              resizingRef.current.isResizing = false;
              resizingRef.current.table = null;
              resizingRef.current.column = null;
              editor.style.cursor = 'auto';
              // Trigger change to save state
              onChange(editor.innerHTML);
          }
      };

      editor.addEventListener('mousemove', handleMouseMove);
      editor.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUpGlobal);

      return () => {
          editor.removeEventListener('mousemove', handleMouseMove);
          editor.removeEventListener('mousedown', handleMouseDown);
          window.removeEventListener('mouseup', handleMouseUpGlobal);
      };
  }, [onChange, contentRef]);
  
  return (
    <div
      ref={contentRef}
      onInput={handleInput}
      onMouseUp={onMouseUp}
      onDoubleClick={onDoubleClick}
      onClick={onClick}
      contentEditable={true}
      spellCheck={spellCheck}
      suppressContentEditableWarning={true}
      className="relative min-h-full focus:outline-none prose dark:prose-invert max-w-none prose-a:text-blue-600 dark:prose-a:text-blue-400"
      // The initial content is set via useEffect to avoid hydration issues.
    />
  );
});

Editor.displayName = 'Editor';

export default Editor;
