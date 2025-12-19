import React, { useRef, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface ResizableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export function ResizableDialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
  className = '',
  initialWidth = 550,
  initialHeight = 90,
  minWidth = 350,
  minHeight = 400,
  maxWidth = 1200,
  maxHeight = 95,
}: ResizableDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (open) {
      setDimensions({ width: initialWidth, height: initialHeight });
    }
  }, [open, initialWidth, initialHeight]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;

      const newWidth = Math.max(
        minWidth,
        Math.min(maxWidth, startSize.width + deltaX)
      );
      const newHeight = Math.max(
        minHeight,
        Math.min(
          (window.innerHeight * maxHeight) / 100,
          startSize.height + deltaY
        )
      );

      setDimensions({ width: newWidth, height: newHeight });
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
  }, [isResizing, startPos, startSize, minWidth, minHeight, maxWidth, maxHeight]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (dialogRef.current) {
      setIsResizing(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      setStartSize({ width: dimensions.width, height: dimensions.height });
    }
  };

  return (
    <>
      <style>{`
        .resizable-dialog-content {
          resize: none !important;
          overflow: visible !important;
        }
        .resizable-dialog-handle {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 20px;
          height: 20px;
          background: linear-gradient(
            -45deg,
            transparent 0%,
            transparent 30%,
            rgb(156, 163, 175) 30%,
            rgb(156, 163, 175) 40%,
            transparent 40%,
            transparent 60%,
            rgb(156, 163, 175) 60%,
            rgb(156, 163, 175) 70%,
            transparent 70%
          );
          cursor: nwse-resize;
          z-index: 10000;
          user-select: none;
          transition: background 0.2s ease;
        }
        .resizable-dialog-handle:hover {
          background: linear-gradient(
            -45deg,
            transparent 0%,
            transparent 30%,
            rgb(75, 85, 99) 30%,
            rgb(75, 85, 99) 40%,
            transparent 40%,
            transparent 60%,
            rgb(75, 85, 99) 60%,
            rgb(75, 85, 99) 70%,
            transparent 70%
          );
        }
        .resizable-dialog-handle:active {
          background: linear-gradient(
            -45deg,
            transparent 0%,
            transparent 30%,
            rgb(55, 65, 81) 30%,
            rgb(55, 65, 81) 40%,
            transparent 40%,
            transparent 60%,
            rgb(55, 65, 81) 60%,
            rgb(55, 65, 81) 70%,
            transparent 70%
          );
        }
      `}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          ref={dialogRef}
          className={`p-0 gap-0 large-dialog dialog-content-standard resizable-dialog-content ${className}`}
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}vh`,
            maxWidth: `${maxWidth}px`,
            maxHeight: `${maxHeight}vh`,
            minWidth: `${minWidth}px`,
            minHeight: `${minHeight}px`,
          }}
        >
          <div
            ref={resizeHandleRef}
            className="resizable-dialog-handle"
            onMouseDown={handleResizeStart}
          />
          <div className="dialog-scrollable-wrapper dialog-content-scrollable">
            <DialogHeader className="dialog-header-standard">
              <DialogTitle className={typeof title === 'string' ? 'dialog-title-standard' : 'dialog-title-standard flex items-center gap-2'}>
                {title}
              </DialogTitle>
            </DialogHeader>
            <div className="dialog-body-content-wrapper">
              {children}
            </div>
            {footer && (
              <div className="flex justify-end gap-2 px-6 py-4 border-t flex-shrink-0">
                {footer}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
