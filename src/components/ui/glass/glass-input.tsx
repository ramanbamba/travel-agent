"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: boolean;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ icon, error, className, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-tertiary)]">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            // Base glass surface
            "w-full",
            "bg-[var(--glass-subtle)]",
            "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
            "rounded-[var(--glass-radius-input)]",
            "border border-[var(--glass-border)]",
            "px-3 py-2.5",
            "text-sm text-[var(--glass-text-primary)]",
            "placeholder:text-[var(--glass-text-tertiary)]",
            // Focus
            "transition-all duration-200 ease-expo-out",
            "focus:outline-none",
            "focus:border-[var(--glass-accent-blue)]",
            "focus:bg-[var(--glass-standard)]",
            "focus:shadow-[0_0_0_3px_var(--glass-accent-blue-light),var(--glass-shadow-sm)]",
            "focus:ring-0",
            // Error
            error && [
              "border-[var(--glass-accent-red)]",
              "focus:border-[var(--glass-accent-red)]",
              "focus:shadow-[0_0_0_3px_var(--glass-accent-red-light)]",
            ],
            // Disabled
            "disabled:opacity-40 disabled:cursor-not-allowed",
            // Icon padding
            icon && "pl-10",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";
