"use client";

import { cn } from "@/lib/utils";

interface StepWrapperProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}

export function StepWrapper({
  title,
  subtitle,
  children,
  className,
}: StepWrapperProps) {
  return (
    <div className={cn("animate-slide-in-right", className)}>
      {/* Avatar + chat bubble */}
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-white/60">{subtitle}</p>
        </div>
      </div>

      {/* Glass card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
