"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type GlassButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type GlassButtonSize = "sm" | "md" | "lg" | "icon";

interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
}

const variantStyles: Record<GlassButtonVariant, string> = {
  primary: cn(
    "bg-[var(--glass-accent-blue)] text-white",
    "hover:bg-[var(--glass-accent-blue-hover)]",
    "shadow-[0_1px_2px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,113,227,0.25)]",
    "hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,113,227,0.3)]",
    "active:scale-[0.97] active:shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
  ),
  secondary: cn(
    "bg-[var(--glass-standard)]",
    "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
    "border border-[var(--glass-border)]",
    "text-[var(--glass-text-primary)]",
    "shadow-[var(--glass-shadow-sm)]",
    "[box-shadow:var(--glass-shadow-sm),var(--glass-inner-glow)]",
    "hover:bg-[var(--glass-elevated)]",
    "hover:shadow-[var(--glass-shadow-md)]",
    "active:scale-[0.97]"
  ),
  ghost: cn(
    "bg-transparent",
    "text-[var(--glass-text-secondary)]",
    "hover:bg-[var(--glass-subtle)]",
    "hover:text-[var(--glass-text-primary)]",
    "active:scale-[0.97]"
  ),
  danger: cn(
    "bg-[var(--glass-accent-red)] text-white",
    "hover:brightness-110",
    "shadow-[0_1px_2px_rgba(0,0,0,0.1),0_2px_8px_rgba(255,59,48,0.25)]",
    "active:scale-[0.97]"
  ),
};

const sizeStyles: Record<GlassButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
  icon: "h-10 w-10 p-0 justify-center",
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    { variant = "primary", size = "md", className, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base
          "inline-flex items-center justify-center",
          "rounded-[var(--glass-radius-button)]",
          "font-medium",
          "transition-all duration-200 ease-spring",
          "select-none",
          // Focus
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--glass-accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--glass-bg-page)]",
          // Disabled
          "disabled:pointer-events-none disabled:opacity-40",
          // Variant + size
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";
