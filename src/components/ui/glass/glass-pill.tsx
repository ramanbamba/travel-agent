"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type GlassPillVariant = "default" | "blue" | "green" | "amber" | "red";
type GlassPillSize = "sm" | "md";

interface GlassPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: GlassPillVariant;
  size?: GlassPillSize;
  dot?: boolean;
}

const variantStyles: Record<GlassPillVariant, string> = {
  default: cn(
    "bg-[var(--glass-subtle)]",
    "text-[var(--glass-text-secondary)]",
    "border-[var(--glass-border)]"
  ),
  blue: cn(
    "bg-[var(--glass-accent-blue-light)]",
    "text-[var(--glass-accent-blue)]",
    "border-[var(--glass-accent-blue-light)]"
  ),
  green: cn(
    "bg-[var(--glass-accent-green-light)]",
    "text-[var(--glass-accent-green)]",
    "border-[var(--glass-accent-green-light)]"
  ),
  amber: cn(
    "bg-[var(--glass-accent-amber-light)]",
    "text-[var(--glass-accent-amber)]",
    "border-[var(--glass-accent-amber-light)]"
  ),
  red: cn(
    "bg-[var(--glass-accent-red-light)]",
    "text-[var(--glass-accent-red)]",
    "border-[var(--glass-accent-red-light)]"
  ),
};

const dotColors: Record<GlassPillVariant, string> = {
  default: "bg-[var(--glass-text-tertiary)]",
  blue: "bg-[var(--glass-accent-blue)]",
  green: "bg-[var(--glass-accent-green)]",
  amber: "bg-[var(--glass-accent-amber)]",
  red: "bg-[var(--glass-accent-red)]",
};

const sizeStyles: Record<GlassPillSize, string> = {
  sm: "h-5 px-2 text-[11px]",
  md: "h-6 px-2.5 text-xs",
};

export const GlassPill = forwardRef<HTMLSpanElement, GlassPillProps>(
  (
    { variant = "default", size = "sm", dot, className, children, ...props },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5",
          "rounded-[var(--glass-radius-pill)]",
          "border",
          "font-medium leading-none",
          "animate-pill-in",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              dotColors[variant]
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

GlassPill.displayName = "GlassPill";
