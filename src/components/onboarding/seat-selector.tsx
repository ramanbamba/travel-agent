"use client";

import { cn } from "@/lib/utils";

const SEAT_OPTIONS = [
  {
    value: "window" as const,
    label: "Window",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <path d="M6 3v18" />
        <circle cx="14" cy="12" r="3" />
      </svg>
    ),
    description: "Next to the view",
  },
  {
    value: "middle" as const,
    label: "Middle",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <path d="M8 3v18" />
        <path d="M16 3v18" />
      </svg>
    ),
    description: "Between neighbors",
  },
  {
    value: "aisle" as const,
    label: "Aisle",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <path d="M18 3v18" />
        <path d="M12 8v8" />
        <path d="M9 11l3-3 3 3" />
      </svg>
    ),
    description: "Easy access",
  },
  {
    value: "no_preference" as const,
    label: "No Preference",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
      </svg>
    ),
    description: "Any seat is fine",
  },
] as const;

type SeatValue = (typeof SEAT_OPTIONS)[number]["value"];

interface SeatSelectorProps {
  value: SeatValue;
  onChange: (value: SeatValue) => void;
}

export function SeatSelector({ value, onChange }: SeatSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {SEAT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200",
            value === option.value
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
              : "border-white/10 text-white/60 hover:border-white/20 hover:text-white/80"
          )}
        >
          {option.icon}
          <span className="text-sm font-medium">{option.label}</span>
          <span className="text-[11px] opacity-60">{option.description}</span>
        </button>
      ))}
    </div>
  );
}
