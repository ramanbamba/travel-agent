"use client";

import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass";

type SlideDirection = "forward" | "back";

interface StepWrapperProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  direction?: SlideDirection;
  className?: string;
}

export function StepWrapper({
  title,
  subtitle,
  children,
  direction = "forward",
  className,
}: StepWrapperProps) {
  return (
    <div
      className={cn(
        "flex min-h-[100dvh] flex-col items-center justify-center px-4 py-20",
        direction === "forward"
          ? "animate-step-slide-left"
          : "animate-step-slide-right",
        className
      )}
    >
      <div className="w-full max-w-lg">
        {/* Title block */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--glass-text-primary)] sm:text-4xl">
            {title}
          </h2>
          <p className="mt-2 text-base text-[var(--glass-text-secondary)]">
            {subtitle}
          </p>
        </div>

        {/* Glass card container */}
        <GlassCard tier="standard" padding="lg" hover={false}>
          {children}
        </GlassCard>
      </div>
    </div>
  );
}
