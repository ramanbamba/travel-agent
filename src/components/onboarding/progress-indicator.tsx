"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  "Personal Info",
  "Travel Docs",
  "Loyalty Programs",
  "Preferences",
  "Review",
];

interface ProgressIndicatorProps {
  currentStep: number;
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((label, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-300",
                  isCompleted &&
                    "border-emerald-500 bg-emerald-500 text-white",
                  isActive &&
                    "border-white bg-white text-black",
                  !isCompleted &&
                    !isActive &&
                    "border-white/20 text-white/40"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "hidden text-[10px] sm:block",
                  isActive ? "text-white font-medium" : "text-white/40"
                )}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-6 sm:w-10 transition-colors duration-300 mb-4",
                  index < currentStep ? "bg-emerald-500" : "bg-white/10"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
