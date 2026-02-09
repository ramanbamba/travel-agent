"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}

export function GlassSheet({
  open,
  onClose,
  children,
  title,
  className,
}: GlassSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--glass-z-sheet)]">
      {/* Overlay */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-black/30",
          "backdrop-blur-sm",
          "animate-in fade-in duration-200"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute bottom-0 left-0 right-0",
          "max-h-[85vh]",
          "overflow-y-auto overscroll-contain",
          // Glass surface
          "bg-[var(--glass-elevated)]",
          "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
          "border-t border-[var(--glass-border)]",
          "rounded-t-[var(--glass-radius-modal)]",
          "shadow-[var(--glass-shadow-xl)]",
          // Animation
          "animate-sheet-up",
          // Safe area
          "pb-[env(safe-area-inset-bottom)]",
          className
        )}
      >
        {/* Drag indicator */}
        <div className="sticky top-0 z-10 flex justify-center pb-2 pt-3">
          <div className="h-1 w-9 rounded-full bg-[var(--glass-text-tertiary)] opacity-40" />
        </div>

        {title && (
          <div className="px-5 pb-3">
            <h2 className="text-glass-heading">{title}</h2>
          </div>
        )}

        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
