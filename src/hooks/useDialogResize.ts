import { useRef, useEffect, useState, useCallback } from 'react';

interface UseDialogResizeOptions {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  initialWidth?: number;
  initialHeight?: number;
}

export function useDialogResize({
  minWidth = 350,
  minHeight = 400,
  maxWidth = 1200,
  maxHeight = 95, // percentage of viewport height
  initialWidth = 550,
  initialHeight = 90, // percentage of viewport height
}: UseDialogResizeOptions = {}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight,
  });
  const [isResizing, setIsResizing] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dialogRef.current) {
      setIsResizing(true);
      startPosRef.current = { x: e.clientX, y: e.clientY };
      startSizeRef.current = {
        width: dimensions.width,
        height: dimensions.height,
      };
    }
  }, [dimensions]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;

      const newWidth = Math.max(
        minWidth,
        Math.min(maxWidth, startSizeRef.current.width + deltaX)
      );
      const newHeight = Math.max(
        minHeight,
        Math.min(
          (window.innerHeight * maxHeight) / 100,
          startSizeRef.current.height + deltaY
        )
      );

      setDimensions({ width: newWidth, height: newHeight });
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
  }, [isResizing, minWidth, minHeight, maxWidth, maxHeight]);

  return {
    dialogRef,
    dimensions,
    isResizing,
    handleResizeStart,
  };
}
