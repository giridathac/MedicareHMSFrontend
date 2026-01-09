"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { XIcon } from "lucide-react";
import { cn } from "./ui/utils";

interface CustomResizableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  closeOnOutsideClick?: boolean;
}

export function CustomResizableDialog({
  open,
  onOpenChange,
  children,
  className,
  initialWidth = 550,
  initialHeight = 90,
  minWidth = 350,
  minHeight = 400,
  maxWidth = typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.95) : 1800,
  maxHeight = 95,
  closeOnOutsideClick = false,
}: CustomResizableDialogProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({
    width: initialWidth,
    height: initialHeight,
  });
  const [isResizing, setIsResizing] = React.useState(false);
  const startPosRef = React.useRef<{ x: number; y: number; centerX?: number; centerY?: number }>({ x: 0, y: 0 });
  const startSizeRef = React.useRef({ width: 0, height: 0 });
  const resizeDirectionRef = React.useRef<string>('');
  const [position, setPosition] = React.useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setDimensions({ width: initialWidth, height: initialHeight });
      setPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, initialWidth, initialHeight]);

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    if (dialogRef.current) {
      const rect = dialogRef.current.getBoundingClientRect();
      startSizeRef.current = { width: rect.width, height: rect.height };
    }
    resizeDirectionRef.current = direction;
  };

  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;
      const direction = resizeDirectionRef.current;

      let newWidth = startSizeRef.current.width;
      let newHeight = startSizeRef.current.height;

      const effectiveMaxWidth = Math.min(maxWidth, window.innerWidth - 40);
      const effectiveMaxHeight = Math.min((window.innerHeight * maxHeight) / 100, window.innerHeight - 40);

      // Calculate new dimensions based on resize direction
      if (direction.includes('right')) {
        newWidth = Math.max(minWidth, Math.min(effectiveMaxWidth, startSizeRef.current.width + deltaX));
      } else if (direction.includes('left')) {
        newWidth = Math.max(minWidth, Math.min(effectiveMaxWidth, startSizeRef.current.width - deltaX));
      }

      if (direction.includes('bottom')) {
        newHeight = Math.max(minHeight, Math.min(effectiveMaxHeight, startSizeRef.current.height + deltaY));
      } else if (direction.includes('top')) {
        newHeight = Math.max(minHeight, Math.min(effectiveMaxHeight, startSizeRef.current.height - deltaY));
      }

      // Keep dialog centered - always use center positioning
      setDimensions({ width: newWidth, height: (newHeight / window.innerHeight) * 100 });
      setPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, minHeight, maxWidth, maxHeight]);

  if (!open) return null;

  const effectiveMaxWidth = Math.min(maxWidth, window.innerWidth - 40);

  const dialogContent = (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50",
          !closeOnOutsideClick && "pointer-events-none"
        )}
        onClick={() => {
          if (closeOnOutsideClick) {
            onOpenChange(false);
          }
        }}
      />
      
      {/* Dialog - Always centered */}
      <div
        ref={dialogRef}
        className={cn(
          "fixed z-[100]",
          "bg-white shadow-lg flex flex-col",
          className
        )}
        style={{
          top: position.top,
          left: position.left,
          transform: position.transform,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}vh`,
          maxWidth: `${effectiveMaxWidth}px`,
          minWidth: `${minWidth}px`,
          minHeight: `${minHeight}px`,
          position: 'relative',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          overflow: 'visible'
        }}
        onClick={(e) => {
          // Don't stop propagation if clicking on resize handles
          if ((e.target as HTMLElement).closest('[data-resize-handle]')) {
            return;
          }
          e.stopPropagation();
        }}
      >
        <div className="flex-1 flex flex-col min-h-0 relative z-10 pointer-events-auto" style={{ borderRadius: 'inherit', overflowY: 'auto', overflowX: 'visible' }}>
          {children}
        </div>
        
        {/* EDGE HANDLES - Invisible but functional */}
        {/* Right edge */}
        <div
          data-resize-handle
          className="absolute cursor-ew-resize z-[100] pointer-events-auto"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleResizeStart(e, 'right');
          }}
          title="Drag to resize width"
          style={{ 
            position: 'absolute',
            right: '0',
            top: '0',
            bottom: '0',
            width: '8px',
            cursor: 'ew-resize'
          }}
        />
        
        {/* Left edge */}
        <div
          data-resize-handle
          className="absolute cursor-ew-resize z-[100] pointer-events-auto"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleResizeStart(e, 'left');
          }}
          title="Drag to resize width"
          style={{ 
            position: 'absolute',
            left: '0',
            top: '0',
            bottom: '0',
            width: '8px',
            cursor: 'ew-resize'
          }}
        />
        
        {/* Bottom edge */}
        <div
          data-resize-handle
          className="absolute cursor-ns-resize z-[100] pointer-events-auto"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleResizeStart(e, 'bottom');
          }}
          title="Drag to resize height"
          style={{ 
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '8px',
            cursor: 'ns-resize'
          }}
        />
        
        {/* Top edge */}
        <div
          data-resize-handle
          className="absolute cursor-ns-resize z-[100] pointer-events-auto"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleResizeStart(e, 'top');
          }}
          title="Drag to resize height"
          style={{ 
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '8px',
            cursor: 'ns-resize'
          }}
        />
      </div>
    </div>
  );

  // Render dialog using portal to document.body to avoid z-index issues
  if (typeof window !== 'undefined') {
    return createPortal(dialogContent, document.body);
  }
  
  return dialogContent;
}

export function CustomResizableDialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {children}
    </div>
  );
}

export function CustomResizableDialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  );
}

export function CustomResizableDialogClose({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 z-10"
    >
      <XIcon className="size-4" />
      <span className="sr-only">Close</span>
    </button>
  );
}
