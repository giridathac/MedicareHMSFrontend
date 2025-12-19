import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DialogContent } from './ui/dialog';
import { cn } from './ui/utils';
import * as DialogPrimitive from "@radix-ui/react-dialog@1.1.6";


interface ResizableDialogContentProps extends Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, 'style'> {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  initialWidth?: number;
  initialHeight?: number;
}

export function ResizableDialogContent({
  className,
  minWidth = 350,
  minHeight = 400,
  maxWidth = 1200,
  maxHeight = 95, // percentage of viewport height
  initialWidth = 550,
  initialHeight = 90, // percentage of viewport height
  children,
  ...props
}: ResizableDialogContentProps) {
  const dialogElementRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight,
  });
  const [isResizing, setIsResizing] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });

  // Find and store reference to the actual dialog element
  const findAndUpdateDialogElement = useCallback(() => {
    if (!containerRef.current) return null;
    
    // Try to find the dialog content element
    let element = containerRef.current.closest('[data-slot="dialog-content"]') as HTMLDivElement;
    if (!element) {
      // Fallback: search from document - find the most recently opened dialog
      const allDialogs = document.querySelectorAll('[data-slot="dialog-content"]');
      element = allDialogs[allDialogs.length - 1] as HTMLDivElement;
    }
    
    if (element && element !== dialogElementRef.current) {
      dialogElementRef.current = element;
      // Ensure the dialog element has position relative for absolute positioning of handle
      if (window.getComputedStyle(element).position === 'static') {
        element.style.setProperty('position', 'relative', 'important');
      }
    }
    
    return element;
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Always refresh the dialog element reference before resizing
    const element = findAndUpdateDialogElement();
    if (!element) {
      console.warn('ResizableDialogContent: Could not find dialog element');
      return;
    }
    
    // Store initial position and size to maintain top-left corner fixed
    const rect = element.getBoundingClientRect();
    (startPosRef.current as any).initialTop = rect.top;
    (startPosRef.current as any).initialLeft = rect.left;
    (startPosRef.current as any).initialWidth = rect.width;
    (startPosRef.current as any).initialHeight = rect.height;
    
    setIsResizing(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startSizeRef.current = {
      width: dimensions.width,
      height: dimensions.height,
    };
    // Store resize direction
    (startPosRef.current as any).direction = direction;
  }, [dimensions, findAndUpdateDialogElement]);

  // Update dialog element styles (only when not actively resizing)
  useEffect(() => {
    if (isResizing) return; // Don't update during resize - let handleMouseMove handle it
    
    const updateStyles = () => {
      const element = findAndUpdateDialogElement();
      if (!element) return;

      // Allow full width and height - use viewport dimensions
      const effectiveMaxWidth = window.innerWidth - 40;
      const effectiveMaxHeight = window.innerHeight - 40;

      // Apply styles with !important to override CSS
      element.style.setProperty('width', `${dimensions.width}px`, 'important');
      element.style.setProperty('height', `${dimensions.height}vh`, 'important');
      element.style.setProperty('max-width', `${effectiveMaxWidth}px`, 'important');
      element.style.setProperty('max-height', `${effectiveMaxHeight}px`, 'important');
      element.style.setProperty('min-width', `${minWidth}px`, 'important');
      element.style.setProperty('min-height', `${minHeight}px`, 'important');
      
      // Only set position if not already set (during resize it's handled by handleMouseMove)
      const currentPosition = window.getComputedStyle(element).position;
      if (currentPosition === 'static' || currentPosition === 'relative') {
        // Use center positioning for initial render
        element.style.setProperty('position', 'fixed', 'important');
        element.style.setProperty('top', '50%', 'important');
        element.style.setProperty('left', '50%', 'important');
        element.style.setProperty('transform', 'translate(-50%, -50%)', 'important');
      }
    };

    updateStyles();
    const timeout1 = setTimeout(updateStyles, 50);
    const timeout2 = setTimeout(updateStyles, 200);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [dimensions, maxWidth, maxHeight, minWidth, minHeight, findAndUpdateDialogElement, isResizing]);

  useEffect(() => {
    if (!isResizing) return;

    // Ensure we have the dialog element reference
    const element = findAndUpdateDialogElement();
    if (!element) {
      setIsResizing(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;
      const direction = (startPosRef.current as any).direction || 'bottom-right';
      const initialTop = (startPosRef.current as any).initialTop;
      const initialLeft = (startPosRef.current as any).initialLeft;
      const initialWidth = (startPosRef.current as any).initialWidth;
      const initialHeight = (startPosRef.current as any).initialHeight;

      // Allow full width and height - use viewport dimensions
      const effectiveMaxWidth = window.innerWidth - 40; // Full width minus padding
      const effectiveMaxHeight = window.innerHeight - 40; // Full height minus padding

      let newWidth = initialWidth;
      let newHeight = initialHeight;
      let newTop = initialTop;
      let newLeft = initialLeft;

      // Resize based on direction - expand from the dragged edge
      if (direction === 'right' || direction === 'top-right' || direction === 'bottom-right') {
        // Right edge: expand width to the right
        newWidth = Math.max(minWidth, Math.min(effectiveMaxWidth, initialWidth + deltaX));
      } else if (direction === 'left' || direction === 'top-left' || direction === 'bottom-left') {
        // Left edge: expand width to the left
        newWidth = Math.max(minWidth, Math.min(effectiveMaxWidth, initialWidth - deltaX));
        newLeft = initialLeft + deltaX;
      }

      if (direction === 'bottom' || direction === 'bottom-left' || direction === 'bottom-right') {
        // Bottom edge: expand height downward
        newHeight = Math.max(minHeight, Math.min(effectiveMaxHeight, initialHeight + deltaY));
      } else if (direction === 'top' || direction === 'top-left' || direction === 'top-right') {
        // Top edge: expand height upward
        newHeight = Math.max(minHeight, Math.min(effectiveMaxHeight, initialHeight - deltaY));
        newTop = initialTop + deltaY;
      }

      // Convert height to vh for state
      const newHeightVh = (newHeight / window.innerHeight) * 100;

      setDimensions({ width: newWidth, height: newHeightVh });
      
      // Immediately apply styles during resize for smooth feedback
      if (element && initialTop !== undefined && initialLeft !== undefined) {
        element.style.setProperty('position', 'fixed', 'important');
        element.style.setProperty('top', `${newTop}px`, 'important');
        element.style.setProperty('left', `${newLeft}px`, 'important');
        element.style.setProperty('transform', 'none', 'important');
        element.style.setProperty('width', `${newWidth}px`, 'important');
        element.style.setProperty('height', `${newHeight}px`, 'important');
        element.style.setProperty('max-width', 'none', 'important');
        element.style.setProperty('max-height', 'none', 'important');
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minWidth, minHeight, maxWidth, maxHeight, findAndUpdateDialogElement]);

  return (
    <>
      <style>{`
        .resizable-dialog-handle {
          position: absolute !important;
          z-index: 99999 !important;
          user-select: none !important;
          pointer-events: auto !important;
          background: transparent !important;
        }
        .resizable-dialog-handle-top {
          top: 0 !important;
          left: 12px !important;
          right: 12px !important;
          height: 4px !important;
          cursor: ns-resize !important;
        }
        .resizable-dialog-handle-right {
          top: 12px !important;
          right: 0 !important;
          bottom: 12px !important;
          width: 4px !important;
          cursor: ew-resize !important;
        }
        .resizable-dialog-handle-bottom {
          bottom: 0 !important;
          left: 12px !important;
          right: 12px !important;
          height: 4px !important;
          cursor: ns-resize !important;
        }
        .resizable-dialog-handle-left {
          top: 12px !important;
          left: 0 !important;
          bottom: 12px !important;
          width: 4px !important;
          cursor: ew-resize !important;
        }
        .resizable-dialog-handle-top-left {
          top: 0 !important;
          left: 0 !important;
          width: 12px !important;
          height: 12px !important;
          cursor: nwse-resize !important;
          z-index: 100000 !important;
        }
        .resizable-dialog-handle-top-right {
          top: 0 !important;
          right: 0 !important;
          width: 12px !important;
          height: 12px !important;
          cursor: nesw-resize !important;
          z-index: 100000 !important;
        }
        .resizable-dialog-handle-bottom-left {
          bottom: 0 !important;
          left: 0 !important;
          width: 12px !important;
          height: 12px !important;
          cursor: nesw-resize !important;
          z-index: 100000 !important;
        }
        .resizable-dialog-handle:hover {
          background: rgba(156, 163, 175, 0.2) !important;
        }
        .resizable-dialog-handle-top-left::before,
        .resizable-dialog-handle-top-right::before,
        .resizable-dialog-handle-bottom-left::before {
          content: '' !important;
          position: absolute !important;
          width: 6px !important;
          height: 1px !important;
          background: rgb(156, 163, 175) !important;
        }
        .resizable-dialog-handle-top-left::after,
        .resizable-dialog-handle-top-right::after,
        .resizable-dialog-handle-bottom-left::after {
          content: '' !important;
          position: absolute !important;
          width: 1px !important;
          height: 6px !important;
          background: rgb(156, 163, 175) !important;
        }
        .resizable-dialog-handle-top-left::before { top: 2px; left: 2px; }
        .resizable-dialog-handle-top-left::after { top: 2px; left: 2px; }
        .resizable-dialog-handle-top-right::before { top: 2px; right: 2px; }
        .resizable-dialog-handle-top-right::after { top: 2px; right: 2px; }
        .resizable-dialog-handle-bottom-left::before { bottom: 2px; left: 2px; }
        .resizable-dialog-handle-bottom-left::after { bottom: 2px; left: 2px; }
        .resizable-dialog-handle-top-left:hover::before,
        .resizable-dialog-handle-top-left:hover::after,
        .resizable-dialog-handle-top-right:hover::before,
        .resizable-dialog-handle-top-right:hover::after,
        .resizable-dialog-handle-bottom-left:hover::before,
        .resizable-dialog-handle-bottom-left:hover::after {
          background: rgb(75, 85, 99) !important;
        }
      `}</style>
      <DialogContent
        className={cn(className)}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}vh`,
          maxWidth: `${maxWidth}px`,
          maxHeight: `${maxHeight}vh`,
          minWidth: `${minWidth}px`,
          minHeight: `${minHeight}px`,
          position: 'relative',
        }}
        {...props}
      >
        <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100%' }}>
          {children}
        </div>
        {/* Edge handles */}
        <div
          className="resizable-dialog-handle resizable-dialog-handle-top"
          onMouseDown={(e) => handleResizeStart(e, 'top')}
          title="Drag to resize height"
        />
        <div
          className="resizable-dialog-handle resizable-dialog-handle-right"
          onMouseDown={(e) => handleResizeStart(e, 'right')}
          title="Drag to resize width"
        />
        <div
          className="resizable-dialog-handle resizable-dialog-handle-bottom"
          onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          title="Drag to resize height"
        />
        <div
          className="resizable-dialog-handle resizable-dialog-handle-left"
          onMouseDown={(e) => handleResizeStart(e, 'left')}
          title="Drag to resize width"
        />
        {/* Corner handles */}
        <div
          className="resizable-dialog-handle resizable-dialog-handle-top-left"
          onMouseDown={(e) => handleResizeStart(e, 'top-left')}
          title="Drag to resize"
        />
        <div
          className="resizable-dialog-handle resizable-dialog-handle-top-right"
          onMouseDown={(e) => handleResizeStart(e, 'top-right')}
          title="Drag to resize"
        />
        <div
          className="resizable-dialog-handle resizable-dialog-handle-bottom-left"
          onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
          title="Drag to resize"
        />
      </DialogContent>
    </>
  );
}

