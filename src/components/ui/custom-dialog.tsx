"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import { cn } from "./utils";

interface CustomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  closeOnOutsideClick?: boolean;
}

interface CustomDialogContentProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface CustomDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CustomDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CustomDialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function CustomDialog({ open, onOpenChange, children, className, style, closeOnOutsideClick = false }: CustomDialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = () => {
    if (closeOnOutsideClick) {
      onOpenChange(false);
    }
  };

  return (
    <div className={cn("fixed inset-0 z-50", className)} style={style}>
      <CustomDialogOverlay onClick={handleOverlayClick} closeOnOutsideClick={closeOnOutsideClick} />
      {children}
    </div>
  );
}

export function CustomDialogOverlay({ onClick, closeOnOutsideClick }: { onClick?: () => void; closeOnOutsideClick?: boolean }) {
  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/50 z-50",
        !closeOnOutsideClick && "pointer-events-none"
      )}
      onClick={() => {
        if (closeOnOutsideClick && onClick) {
          onClick();
        }
      }}
    />
  );
}

export const CustomDialogContent = React.forwardRef<HTMLDivElement, CustomDialogContentProps>(
  ({ children, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
          "bg-white rounded-lg shadow-lg",
          className
        )}
        style={style}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CustomDialogContent.displayName = "CustomDialogContent";

export function CustomDialogHeader({ children, className }: CustomDialogHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {children}
    </div>
  );
}

export function CustomDialogTitle({ children, className }: CustomDialogTitleProps) {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  );
}

export function CustomDialogTrigger({ asChild, children, onClick }: CustomDialogTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick } as any);
  }
  return (
    <button onClick={onClick}>
      {children}
    </button>
  );
}

export function CustomDialogClose({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100"
    >
      <XIcon className="size-4" />
      <span className="sr-only">Close</span>
    </button>
  );
}
