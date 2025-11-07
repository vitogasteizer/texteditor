

import React, { useEffect, useRef } from 'react';

interface ObjectWrapperProps {
  targetElement: HTMLElement;
  onUpdate: (element: HTMLElement, styles: React.CSSProperties) => void;
  onDeselect: () => void;
  onDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const ObjectWrapper: React.FC<ObjectWrapperProps> = ({ targetElement, onUpdate, onDeselect, onDoubleClick }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef({
    isDragging: false,
    isResizing: false,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startLeft: 0,
    startTop: 0,
    handle: ''
  });

  const isAbsolute = targetElement.style.position === 'absolute';

  useEffect(() => {
    const updatePosition = () => {
      if (!targetElement || !wrapperRef.current) return;
      
      // Use offsetTop/Left for positioning, as it's relative to the offsetParent (#editor-page),
      // which is the same context as the wrapper itself. This is more reliable than getBoundingClientRect
      // for elements within a scrolling container.
      wrapperRef.current.style.top = `${targetElement.offsetTop}px`;
      wrapperRef.current.style.left = `${targetElement.offsetLeft}px`;
      wrapperRef.current.style.width = `${targetElement.offsetWidth}px`;
      wrapperRef.current.style.height = `${targetElement.offsetHeight}px`;
    };

    updatePosition();
    // Watch for style changes on the target element to keep the wrapper in sync.
    const observer = new MutationObserver(updatePosition);
    observer.observe(targetElement, { attributes: true, attributeFilter: ['style', 'class'] });

    return () => {
      observer.disconnect();
    };
  }, [targetElement]);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const interaction = interactionRef.current;
    interaction.startX = e.clientX;
    interaction.startY = e.clientY;
    interaction.startWidth = targetElement.offsetWidth;
    interaction.startHeight = targetElement.offsetHeight;

    if (handle) {
      interaction.isResizing = true;
      interaction.handle = handle;
      interaction.startLeft = targetElement.offsetLeft;
      interaction.startTop = targetElement.offsetTop;
    } else {
      if (!isAbsolute) return;
      interaction.isDragging = true;
      interaction.startLeft = targetElement.offsetLeft;
      interaction.startTop = targetElement.offsetTop;
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    e.preventDefault();
    const interaction = interactionRef.current;
    if (!interaction.isDragging && !interaction.isResizing) return;

    const dx = e.clientX - interaction.startX;
    const dy = e.clientY - interaction.startY;

    const newStyles: React.CSSProperties = {};

    if (interaction.isDragging) {
      newStyles.left = `${interaction.startLeft + dx}px`;
      newStyles.top = `${interaction.startTop + dy}px`;
    } else if (interaction.isResizing) {
        let newWidth = interaction.startWidth;
        let newHeight = interaction.startHeight;

        if (interaction.handle.includes('e')) newWidth += dx;
        if (interaction.handle.includes('w')) newWidth -= dx;
        if (interaction.handle.includes('s')) newHeight += dy;
        if (interaction.handle.includes('n')) newHeight -= dy;
        
        if (newWidth > 10) newStyles.width = `${newWidth}px`;
        if (newHeight > 10) newStyles.height = `${newHeight}px`;

        if (isAbsolute) {
            let newLeft = interaction.startLeft;
            let newTop = interaction.startTop;
            if (interaction.handle.includes('w')) newLeft += dx;
            if (interaction.handle.includes('n')) newTop += dy;
            
            if (newWidth > 10) newStyles.left = `${newLeft}px`;
            if (newHeight > 10) newStyles.top = `${newTop}px`;
        }
    }
    
    Object.assign(targetElement.style, newStyles);
  };
  
  const handleMouseUp = (e: MouseEvent) => {
    e.preventDefault();
    const interaction = interactionRef.current;
    
    if (interaction.isDragging || interaction.isResizing) {
        const finalStyles: React.CSSProperties = {
            width: targetElement.style.width,
            height: targetElement.style.height,
        };
        if (isAbsolute) {
            finalStyles.left = targetElement.style.left;
            finalStyles.top = targetElement.style.top;
            finalStyles.position = 'absolute';
        }
        onUpdate(targetElement, finalStyles);
    }
    
    interaction.isDragging = false;
    interaction.isResizing = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

  return (
    <div
      ref={wrapperRef}
      className="absolute border-2 border-blue-500 pointer-events-none z-20"
      onMouseDown={(e) => handleMouseDown(e)}
      onDoubleClick={onDoubleClick}
      style={{ pointerEvents: 'auto', cursor: isAbsolute ? 'move' : 'default' }}
    >
      {handles.map(handle => (
        <div
          key={handle}
          onMouseDown={(e) => handleMouseDown(e, handle)}
          className={`absolute w-3 h-3 bg-white border border-blue-600 rounded-full z-30 cursor-${handle}-resize`}
          style={{
            top: handle.includes('n') ? '-7px' : handle.includes('s') ? 'calc(100% - 7px)' : 'calc(50% - 7px)',
            left: handle.includes('w') ? '-7px' : handle.includes('e') ? 'calc(100% - 7px)' : 'calc(50% - 7px)',
            pointerEvents: 'auto'
          }}
        />
      ))}
    </div>
  );
};

export default ObjectWrapper;