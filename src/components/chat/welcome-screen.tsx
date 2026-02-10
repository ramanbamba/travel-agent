"use client";

import { MapPin, ArrowRight } from "lucide-react";

interface WelcomeScreenProps {
  onSuggestedPrompt: (prompt: string) => void;
}

const suggestions = [
  { route: "SFO → London", prompt: "Book a flight from SFO to London next Friday" },
  { route: "NYC → Tokyo", prompt: "Round trip from JFK to Tokyo, departing March 15, returning March 22" },
  { route: "LAX → Paris", prompt: "Find me a business class flight to Paris next month" },
  { route: "ORD → Miami", prompt: "Find me the cheapest flight to Miami this weekend" },
];

export function WelcomeScreen({ onSuggestedPrompt }: WelcomeScreenProps) {
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
        Tell me your destination and I&apos;ll find the best flights for you.
      </p>

      {/* Suggestion pills */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
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
    </div>
  );
}
