import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';

interface ScrollableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  loadingContent?: React.ReactNode;
  className?: string;
}

export function ScrollableDialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
  loading = false,
  loadingContent,
  className = '',
}: ScrollableDialogProps) {
  return (
    <>
      <style>{`
        .scrollable-dialog-container {
          scrollbar-width: auto !important;
          scrollbar-color: #888 #f1f1f1 !important;
          scroll-behavior: smooth !important;
        }
        .scrollable-dialog-container::-webkit-scrollbar {
          width: 16px !important;
          display: block !important;
          -webkit-appearance: none !important;
        }
        .scrollable-dialog-container::-webkit-scrollbar-track {
          background: #e5e5e5 !important;
          border-radius: 8px !important;
          border: 1px solid #d0d0d0 !important;
        }
        .scrollable-dialog-container::-webkit-scrollbar-thumb {
          background: #888 !important;
          border-radius: 8px !important;
          border: 2px solid #e5e5e5 !important;
          min-height: 30px !important;
          transition: background 0.2s ease !important;
        }
        .scrollable-dialog-container::-webkit-scrollbar-thumb:hover {
          background: #666 !important;
        }
        .scrollable-dialog-container::-webkit-scrollbar-thumb:active {
          background: #444 !important;
        }
        .scrollable-dialog-container::-webkit-scrollbar-corner {
          background: #e5e5e5 !important;
        }
        .sticky-section-header {
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
          background: white !important;
          padding-top: 1rem !important;
          padding-bottom: 0.5rem !important;
          margin-top: 0 !important;
          margin-bottom: 1rem !important;
          border-bottom: 1px solid #e5e7eb !important;
        }
      `}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className={`h-[90vh] flex flex-col p-0 ${className}`}
        >
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle className={typeof title === 'string' ? '' : 'flex items-center gap-2'}>
              {title}
            </DialogTitle>
          </DialogHeader>
          {loading ? (
            loadingContent || (
              <div className="flex items-center justify-center py-12 flex-1">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-blue-600">Loading...</p>
                </div>
              </div>
            )
          ) : (
            <>
              <div 
                className="flex-1 min-h-0 overflow-y-scroll px-6 py-4 scrollable-dialog-container"
              >
                {children}
              </div>
              {footer && (
                <div className="flex justify-end gap-2 px-6 py-4 border-t flex-shrink-0">
                  {footer}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface StickySectionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function StickySectionHeader({ children, className = '' }: StickySectionHeaderProps) {
  return (
    <div className={`sticky-section-header ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        {children}
      </h3>
    </div>
  );
}

