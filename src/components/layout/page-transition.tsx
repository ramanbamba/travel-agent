"use client";

import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out fill-mode-both",
        className
      )}
    >
      {children}
    </div>
  );
}
