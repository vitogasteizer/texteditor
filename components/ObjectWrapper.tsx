import React, { useEffect, useRef } from 'react';

interface ObjectWrapperProps {
  targetElement: HTMLElement;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (element: HTMLElement, styles: React.CSSProperties) => void;
  onDeselect: () => void;
  onDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const ObjectWrapper: React.FC<ObjectWrapperProps> = ({ targetElement, containerRef, onUpdate, onDeselect, onDoubleClick }) => {
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

  useEffect(() => {
    const updatePosition = () => {
      if (!targetElement || !containerRef.current || !wrapperRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const scrollTop = containerRef.current.scrollTop;
      const scrollLeft = containerRef.current.scrollLeft;

      wrapperRef.current.style.top = `${targetRect.top - containerRect.top + scrollTop}px`;
      wrapperRef.current.style.left = `${targetRect.left - containerRect.left + scrollLeft}px`;
      wrapperRef.current.style.width = `${targetRect.width}px`;
      wrapperRef.current.style.height = `${targetRect.height}px`;
    };

    updatePosition();
    const observer = new MutationObserver(updatePosition);
    observer.observe(targetElement, { attributes: true, attributeFilter: ['style'] });
    
    containerRef.current?.addEventListener('scroll', updatePosition);

    return () => {
      observer.disconnect();
      containerRef.current?.removeEventListener('scroll', updatePosition);
    };
  }, [targetElement, containerRef]);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current) return;
    
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
      interaction.isDragging = true;
       if (targetElement.style.position !== 'absolute') {
            const rect = targetElement.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();
            
            const newTop = rect.top - containerRect.top + containerRef.current.scrollTop;
            const newLeft = rect.left - containerRect.left + containerRef.current.scrollLeft;

            targetElement.style.position = 'absolute';
            targetElement.style.top = `${newTop}px`;
            targetElement.style.left = `${newLeft}px`;
            
            interaction.startLeft = newLeft;
            interaction.startTop = newTop;
        } else {
            interaction.startLeft = targetElement.offsetLeft;
            interaction.startTop = targetElement.offsetTop;
        }
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
        let newLeft = interaction.startLeft;
        let newTop = interaction.startTop;

        if (interaction.handle.includes('e')) newWidth += dx;
        if (interaction.handle.includes('w')) {
            newWidth -= dx;
            newLeft += dx;
        }
        if (interaction.handle.includes('s')) newHeight += dy;
        if (interaction.handle.includes('n')) {
            newHeight -= dy;
            newTop += dy;
        }

        if (newWidth > 10) {
            newStyles.width = `${newWidth}px`;
            newStyles.left = `${newLeft}px`;
        }
        if (newHeight > 10) {
            newStyles.height = `${newHeight}px`;
            newStyles.top = `${newTop}px`;
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
            left: targetElement.style.left,
            top: targetElement.style.top,
            position: 'absolute', // Ensure position is saved
        };
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
      style={{ pointerEvents: 'auto', cursor: 'move' }}
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