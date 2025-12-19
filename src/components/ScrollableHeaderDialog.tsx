import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface ScrollableHeaderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function ScrollableHeaderDialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
  className = '',
}: ScrollableHeaderDialogProps) {
  return (
    <>
      <style>{`
        .scrollable-header-dialog-container {
          scrollbar-width: auto !important;
          scrollbar-color: #888 #f1f1f1 !important;
          scroll-behavior: smooth !important;
        }
        .scrollable-header-dialog-container::-webkit-scrollbar {
          width: 16px !important;
          display: block !important;
          -webkit-appearance: none !important;
        }
        .scrollable-header-dialog-container::-webkit-scrollbar-track {
          background: #e5e5e5 !important;
          border-radius: 8px !important;
          border: 1px solid #d0d0d0 !important;
        }
        .scrollable-header-dialog-container::-webkit-scrollbar-thumb {
          background: #888 !important;
          border-radius: 8px !important;
          border: 2px solid #e5e5e5 !important;
          min-height: 30px !important;
          transition: background 0.2s ease !important;
        }
        .scrollable-header-dialog-container::-webkit-scrollbar-thumb:hover {
          background: #666 !important;
        }
        .scrollable-header-dialog-container::-webkit-scrollbar-thumb:active {
          background: #444 !important;
        }
        .scrollable-header-dialog-container::-webkit-scrollbar-corner {
          background: #e5e5e5 !important;
        }
      `}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className={`h-[90vh] flex flex-col p-0 ${className}`}
        >
          <div 
            className="flex-1 min-h-0 overflow-y-scroll scrollable-header-dialog-container"
          >
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className={typeof title === 'string' ? '' : 'flex items-center gap-2'}>
                {title}
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4">
              {children}
            </div>
            {footer && (
              <div className="flex justify-end gap-2 px-6 py-4 border-t">
                {footer}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

