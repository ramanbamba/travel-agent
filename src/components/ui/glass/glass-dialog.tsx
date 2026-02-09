"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassDialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function GlassDialog({
  open,
  onClose,
  children,
  title,
  description,
  className,
}: GlassDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Trap focus
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const firstFocusable = dialogRef.current.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--glass-z-dialog)] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-black/25",
          "backdrop-blur-md",
          "animate-in fade-in duration-200"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10",
          "w-full max-w-md",
          "max-h-[85vh] overflow-y-auto",
          // Glass surface
          "bg-[var(--glass-elevated)]",
          "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
          "border border-[var(--glass-border)]",
          "rounded-[var(--glass-radius-modal)]",
          "shadow-[var(--glass-shadow-xl)]",
          "[box-shadow:var(--glass-shadow-xl),var(--glass-inner-glow)]",
          // Animation
          "animate-glass-in",
          className
        )}
      >
        {(title || description) && (
          <div className="px-6 pt-6 pb-2">
            {title && <h2 className="text-glass-heading">{title}</h2>}
            {description && (
              <p className="mt-1 text-glass-caption">{description}</p>
            )}
          </div>
        )}

        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
