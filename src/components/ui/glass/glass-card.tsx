"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type GlassTier = "subtle" | "standard" | "elevated";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tier?: GlassTier;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const tierStyles: Record<GlassTier, string> = {
  subtle: "bg-[var(--glass-subtle)]",
  standard: "bg-[var(--glass-standard)]",
  elevated: "bg-[var(--glass-elevated)]",
};

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      tier = "standard",
      hover = true,
      padding = "md",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base glass surface
          tierStyles[tier],
          "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
          "rounded-[var(--glass-radius-card)]",
          "border border-[var(--glass-border)]",
          "shadow-[var(--glass-shadow-sm)] [box-shadow:var(--glass-shadow-sm),var(--glass-inner-glow)]",
          // Padding
          paddingStyles[padding],
          // Transition
          "transition-all duration-300 ease-expo-out",
          // Hover lift
          hover && [
            "hover:shadow-[var(--glass-shadow-hover)]",
            "hover:-translate-y-0.5",
            "active:translate-y-0 active:shadow-[var(--glass-shadow-sm)]",
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";
