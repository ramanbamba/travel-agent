"use client";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format-india";
import type { FlightOption } from "@/types/flights";

interface FlightCardProps {
  flight: FlightOption;
  onSelect?: (flightId: string) => void;
}

export function FlightCard({ flight, onSelect }: FlightCardProps) {
  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];
  const cabinLabel = firstSegment.cabin.replace("_", " ");

  const connectionInfo =
    flight.segments.length > 1
      ? flight.segments
          .slice(0, -1)
          .map((s) => s.arrival.airportCode)
          .join(", ")
      : null;

  const depTime = new Date(firstSegment.departure.time).toLocaleTimeString(
    "en-US",
    { hour: "2-digit", minute: "2-digit", hour12: false }
  );
  const arrTime = new Date(lastSegment.arrival.time).toLocaleTimeString(
    "en-US",
    { hour: "2-digit", minute: "2-digit", hour12: false }
  );

  return (
    <div
      className={cn(
        "group w-full",
        "rounded-[var(--glass-radius-card)]",
        "bg-[var(--glass-subtle)]",
        "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
        "border border-[var(--glass-border)]",
        "shadow-[var(--glass-shadow-sm)] [box-shadow:var(--glass-shadow-sm),var(--glass-inner-glow)]",
        "p-4",
        "transition-all duration-300 ease-expo-out",
        "hover:shadow-[var(--glass-shadow-hover)] hover:-translate-y-0.5",
        "active:translate-y-0 active:shadow-[var(--glass-shadow-sm)]"
      )}
    >
      {/* Top row: airline + cabin */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--glass-text-primary)]">
            {firstSegment.airline}
          </span>
          <span className="text-xs text-[var(--glass-text-tertiary)]">
            {firstSegment.flightNumber}
          </span>
          {firstSegment.aircraft && (
            <span className="text-[10px] text-[var(--glass-text-tertiary)]">
              {firstSegment.aircraft}
            </span>
          )}
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5",
            "text-[11px] font-medium capitalize",
            "bg-[var(--glass-accent-blue-light)] text-[var(--glass-accent-blue)]"
          )}
        >
          {cabinLabel}
        </span>
      </div>

      {/* Route visualization */}
      <div className="flex items-center gap-3">
        {/* Departure */}
        <div className="text-center min-w-[52px]">
          <p className="text-xl font-bold tracking-tight text-[var(--glass-text-primary)]">
            {depTime}
          </p>
          <p className="text-xs font-medium text-[var(--glass-text-tertiary)]">
            {firstSegment.departure.airportCode}
          </p>
        </div>

        {/* Animated route line */}
        <div className="flex flex-1 flex-col items-center gap-1 px-1">
          <span className="text-[10px] text-[var(--glass-text-tertiary)]">
            {flight.totalDuration}
          </span>
          <div className="relative flex w-full items-center">
            {/* Base dotted line */}
            <svg className="w-full h-[14px]" preserveAspectRatio="none">
              <line
                x1="6"
                y1="7"
                x2="100%"
                y2="7"
                stroke="var(--glass-border)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                className="transition-all duration-500"
              />
              {/* Animated trace line */}
              <line
                x1="6"
                y1="7"
                x2="100%"
                y2="7"
                stroke="var(--glass-accent-blue)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
            </svg>
            {/* Departure dot */}
            <div className="absolute left-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--glass-accent-blue)] bg-[var(--glass-bg-page)]" />
            {/* Stop dots */}
            {flight.stops > 0 &&
              Array.from({ length: flight.stops }).map((_, i) => (
                <div
                  key={i}
                  className="absolute h-2 w-2 rounded-full bg-[var(--glass-text-tertiary)]"
                  style={{
                    left: `${((i + 1) / (flight.stops + 1)) * 100}%`,
                    transform: "translateX(-50%)",
                  }}
                />
              ))}
            {/* Plane icon at end */}
            <div className="absolute right-0 -translate-y-px">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="var(--glass-accent-blue)"
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              >
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </div>
          </div>
          <span className="text-[10px] text-[var(--glass-text-tertiary)]">
            {flight.stops === 0
              ? "Nonstop"
              : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}${connectionInfo ? ` · ${connectionInfo}` : ""}`}
          </span>
        </div>

        {/* Arrival */}
        <div className="text-center min-w-[52px]">
          <p className="text-xl font-bold tracking-tight text-[var(--glass-text-primary)]">
            {arrTime}
          </p>
          <p className="text-xs font-medium text-[var(--glass-text-tertiary)]">
            {lastSegment.arrival.airportCode}
          </p>
        </div>
      </div>

      {/* Bottom row: price + seats + select */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-[var(--glass-text-primary)]">
            {formatPrice(flight.price.amount, flight.price.currency)}
          </span>
          <span className="text-[11px] text-[var(--glass-text-tertiary)]">
            {flight.price.currency}
          </span>
          {flight.seatsRemaining != null && flight.seatsRemaining <= 5 && (
            <span className="ml-2 text-[11px] font-medium text-[var(--glass-accent-orange)]">
              {flight.seatsRemaining} seat{flight.seatsRemaining !== 1 ? "s" : ""} left
            </span>
          )}
        </div>
        {onSelect && (
          <button
            onClick={() => onSelect(flight.id)}
            aria-label={`Select ${firstSegment.airline} flight ${firstSegment.flightNumber}, ${formatPrice(flight.price.amount, flight.price.currency)}`}
            className={cn(
              "flex items-center gap-1.5",
              "rounded-full px-4 py-1.5",
              "text-[13px] font-semibold",
              "bg-[var(--glass-accent-blue)] text-white",
              "shadow-[0_1px_4px_rgba(0,113,227,0.25)]",
              "transition-all duration-200 ease-spring",
              "hover:shadow-[0_2px_8px_rgba(0,113,227,0.35)]",
              "active:scale-95"
            )}
          >
            Select
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
