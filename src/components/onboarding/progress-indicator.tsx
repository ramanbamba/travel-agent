"use client";

const TOTAL_STEPS = 5;

interface ProgressIndicatorProps {
  currentStep: number;
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 h-[3px] bg-[var(--glass-border)]">
      <div
        className="h-full rounded-r-full bg-gradient-to-r from-[var(--glass-accent-blue)] to-[var(--glass-accent-blue)] transition-all duration-500 ease-expo-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
