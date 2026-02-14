"use client";

import { MapPin, ArrowRight, Repeat, Plane } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

export interface QuickAction {
  label: string;
  prompt: string;
  type: "usual" | "frequent" | "suggestion";
  meta?: {
    airline?: string;
    flightNumber?: string;
    time?: string;
    price?: number;
    route?: string;
  };
}

interface WelcomeScreenProps {
  onSuggestedPrompt: (prompt: string) => void;
  /** Personalized quick actions from returning-user API */
  quickActions?: QuickAction[];
  /** Pattern-aware greeting for the usual flight */
  patternGreeting?: string;
  /** Whether returning-user data is still loading */
  loading?: boolean;
}

// ── Default suggestions for new users ────────────────────────────────────────

const defaultSuggestions = [
  { route: "Delhi next Tuesday", prompt: "Delhi next Tuesday" },
  { route: "Mumbai tomorrow", prompt: "I need to fly to Mumbai tomorrow" },
  { route: "Goa this weekend", prompt: "Goa this weekend, cheapest option" },
  { route: "BLR → London", prompt: "Book a flight to London next month" },
];

// ── Component ────────────────────────────────────────────────────────────────

export function WelcomeScreen({
  onSuggestedPrompt,
  quickActions,
  patternGreeting,
  loading,
}: WelcomeScreenProps) {
  const isReturning = quickActions && quickActions.length > 0;
  const usualAction = quickActions?.find((a) => a.type === "usual");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      {/* Icon */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--glass-accent-blue-light)]">
        <MapPin className="h-6 w-6 text-[var(--glass-accent-blue)]" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h1 className="mt-6 text-center font-display text-[2.5rem] font-bold leading-[1.1] tracking-tight text-[var(--glass-text-primary)]">
        Where to?
      </h1>
      <p className="mt-3 max-w-sm text-center text-[15px] leading-relaxed text-[var(--glass-text-secondary)]">
        {isReturning
          ? "Your routes are loaded. Tap to book or tell me something new."
          : "Tell me your destination and I\u2019ll find the best flights for you."}
      </p>

      {/* ── One-tap "The Usual" card for autopilot routes ── */}
      {usualAction?.meta && (
        <button
          onClick={() => onSuggestedPrompt(usualAction.prompt)}
          className={cn(
            "mt-8 w-full max-w-sm rounded-2xl p-4",
            "border border-[var(--glass-accent-blue)]/30",
            "bg-[var(--glass-accent-blue-light)]",
            "backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)] [backdrop-filter:blur(24px)_saturate(1.8)]",
            "transition-all duration-200 ease-spring",
            "hover:border-[var(--glass-accent-blue)]/60 hover:shadow-lg",
            "active:scale-[0.98]",
            "group text-left"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Repeat className="h-3.5 w-3.5 text-[var(--glass-accent-blue)]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--glass-accent-blue)]">
                  The usual
                </span>
              </div>
              {patternGreeting ? (
                <p className="mt-2 text-[15px] font-medium leading-snug text-[var(--glass-text-primary)]">
                  {patternGreeting}
                </p>
              ) : (
                <p className="mt-2 text-[15px] font-medium leading-snug text-[var(--glass-text-primary)]">
                  {usualAction.label}
                  {usualAction.meta.airline && usualAction.meta.flightNumber && (
                    <span className="text-[var(--glass-text-secondary)]">
                      {" "}— {usualAction.meta.airline} {usualAction.meta.flightNumber}
                    </span>
                  )}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-3 text-[13px] text-[var(--glass-text-tertiary)]">
                {usualAction.meta.time && <span>{usualAction.meta.time}</span>}
                {usualAction.meta.price && (
                  <span>~₹{usualAction.meta.price.toLocaleString("en-IN")}</span>
                )}
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--glass-accent-blue)] text-white transition-transform duration-200 group-hover:scale-105">
              <Plane className="h-4 w-4" />
            </div>
          </div>
        </button>
      )}

      {/* ── Quick action pills ── */}
      <div className={cn("flex flex-wrap justify-center gap-2", usualAction?.meta ? "mt-4" : "mt-8")}>
        {isReturning
          ? quickActions
              .filter((a) => a !== usualAction)
              .map((action) => (
                <button
                  key={action.label}
                  onClick={() => onSuggestedPrompt(action.prompt)}
                  className={cn(
                    "group flex items-center gap-2 rounded-[var(--glass-radius-pill)]",
                    "border border-[var(--glass-border)]",
                    "bg-[var(--glass-subtle)] px-4 py-2.5",
                    "text-[13px] font-medium text-[var(--glass-text-secondary)]",
                    "backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)] [backdrop-filter:blur(24px)_saturate(1.8)]",
                    "transition-all duration-200 ease-spring",
                    "hover:border-[var(--glass-accent-blue)] hover:bg-[var(--glass-accent-blue-light)] hover:text-[var(--glass-accent-blue)]",
                    "active:scale-95"
                  )}
                >
                  {action.type === "frequent" && (
                    <Plane className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                  )}
                  <span>{action.label}</span>
                  <ArrowRight className="h-3 w-3 opacity-0 transition-all duration-200 ease-spring group-hover:opacity-100 group-hover:translate-x-0.5" />
                </button>
              ))
          : defaultSuggestions.map((s) => (
              <button
                key={s.route}
                onClick={() => onSuggestedPrompt(s.prompt)}
                className="group flex items-center gap-2 rounded-[var(--glass-radius-pill)] border border-[var(--glass-border)] bg-[var(--glass-subtle)] px-4 py-2.5 text-[13px] font-medium text-[var(--glass-text-secondary)] backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)] [backdrop-filter:blur(24px)_saturate(1.8)] transition-all duration-200 ease-spring hover:border-[var(--glass-accent-blue)] hover:bg-[var(--glass-accent-blue-light)] hover:text-[var(--glass-accent-blue)] active:scale-95"
              >
                <span>{s.route}</span>
                <ArrowRight className="h-3 w-3 opacity-0 transition-all duration-200 ease-spring group-hover:opacity-100 group-hover:translate-x-0.5" />
              </button>
            ))}
      </div>

      {/* Loading skeleton */}
      {loading && !isReturning && (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 w-28 animate-pulse rounded-[var(--glass-radius-pill)] bg-[var(--glass-subtle)]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
