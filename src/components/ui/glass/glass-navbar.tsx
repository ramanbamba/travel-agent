"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassNavbarProps {
  children: ReactNode;
  className?: string;
}

export function GlassNavbar({ children, className }: GlassNavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;

    const handleScroll = () => {
      setScrolled(main.scrollTop > 8);
    };

    main.addEventListener("scroll", handleScroll, { passive: true });
    return () => main.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        // Base
        "sticky top-0 z-[var(--glass-z-nav)]",
        "flex shrink-0 items-center justify-between",
        "px-4 sm:px-6",
        "transition-all duration-300 ease-expo-out",
        // Glass on scroll
        scrolled
          ? [
              "h-14",
              "bg-[var(--glass-elevated)]",
              "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
              "border-b border-[var(--glass-border)]",
              "shadow-[var(--glass-shadow-sm)]",
            ]
          : [
              "h-16",
              "bg-transparent",
              "border-b border-transparent",
            ],
        className
      )}
    >
      {children}
    </header>
  );
}
