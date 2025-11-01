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
  
  const handleBlur = useCallback(() => {
    const editor = contentRef && 'current' in contentRef ? contentRef.current : null;
    if (editor && editor.innerHTML !== content) {
      onChange(editor.innerHTML);
    }
  }, [content, onChange, contentRef]);

  useEffect(() => {
    const editor = contentRef && 'current' in contentRef ? contentRef.current : null;
    if (editor && editor.innerHTML !== content) {
      // This helps in preserving the cursor position on external updates.
      const selection = window.getSelection();
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      const startOffset = range?.startOffset;
      const startContainer = range?.startContainer;
      
      editor.innerHTML = content;
      
      if(range && startContainer && startOffset !== undefined) {
        try {
            // Check if the container is still in the DOM
            if (document.body.contains(startContainer)) {
                const newRange = document.createRange();
                newRange.setStart(startContainer, Math.min(startOffset, startContainer.textContent?.length || 0));
                newRange.collapse(true);
                selection?.removeAllRanges();
                selection?.addRange(newRange);
            }
        } catch(e){
            console.error("Failed to restore cursor position.", e);
        }
      }
    }
  }, [content, contentRef]);
  
  return (
    <div
      ref={contentRef}
      onBlur={handleBlur}
      onMouseUp={onMouseUp}
      onDoubleClick={onDoubleClick}
      onClick={onClick}
      contentEditable={true}
      suppressContentEditableWarning={true}
      className="relative px-16 py-20 min-h-full focus:outline-none prose dark:prose-invert max-w-none prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline"
    />
  );
});

Editor.displayName = 'Editor';

export default Editor;