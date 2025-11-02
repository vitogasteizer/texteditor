
import React, { forwardRef, useCallback, useEffect, useRef } from 'react';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onMouseUp: () => void;
  onDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const Editor = forwardRef<HTMLDivElement, EditorProps>(({ content, onChange, onMouseUp, onDoubleClick, onClick }, ref) => {
  const contentRef = ref || useRef<HTMLDivElement>(null);
  
  // onInput is intentionally removed to let the browser handle its own undo/redo stack
  // for contentEditable elements. Changes are synced back to React state onBlur.

  const handleBlur = useCallback(() => {
    const editor = contentRef && 'current' in contentRef ? contentRef.current : null;
    if (editor && editor.innerHTML !== content) {
      onChange(editor.innerHTML);
    }
  }, [content, onChange, contentRef]);

  useEffect(() => {
    const editor = contentRef && 'current' in contentRef ? contentRef.current : null;
    if (editor && editor.innerHTML !== content) {
      // This helps in preserving the cursor position on external updates (like loading a doc).
      const selection = window.getSelection();
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
      
      editor.innerHTML = content;
      
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]); // Intentionally dependent only on content to react to external changes.
  
  return (
    <div
      ref={contentRef}
      onBlur={handleBlur}
      onMouseUp={onMouseUp}
      onDoubleClick={onDoubleClick}
      onClick={onClick}
      contentEditable={true}
      suppressContentEditableWarning={true}
      className="relative min-h-full focus:outline-none prose dark:prose-invert max-w-none prose-a:text-blue-600 dark:prose-a:text-blue-400"
      // The initial content is set via useEffect to avoid hydration issues.
    />
  );
});

Editor.displayName = 'Editor';

export default Editor;
