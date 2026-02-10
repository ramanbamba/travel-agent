"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, CreditCard, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format-india";
import { toast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";

const BoardingPass = dynamic(
  () => import("./boarding-pass").then((mod) => mod.BoardingPass),
  { ssr: false }
);
import type { BookingConfirmation } from "@/types/flights";

interface BookingConfirmationCardProps {
  confirmation: BookingConfirmation;
}

/* CSS confetti particles */
function ConfettiParticles() {
  const colors = [
    "var(--glass-accent-blue)",
    "var(--glass-accent-green)",
    "var(--glass-accent-orange)",
    "#a78bfa",
    "#f472b6",
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[var(--glass-radius-card)]">
      {Array.from({ length: 24 }).map((_, i) => {
        const color = colors[i % colors.length];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const duration = 1.5 + Math.random() * 1;
        const size = 4 + Math.random() * 4;
        const rotation = Math.random() * 360;

        return (
          <span
            key={i}
            className="absolute animate-confetti opacity-0"
            style={{
              left: `${left}%`,
              top: "-8px",
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? "50%" : "1px",
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

/* Animated checkmark SVG */
function AnimatedCheckmark() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--glass-accent-green-light)]">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 13l4 4L19 7"
          stroke="var(--glass-accent-green)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-draw-check"
          pathLength="1"
        />
      </svg>
    </div>
  );
}

export function BookingConfirmationCard({
  confirmation,
}: BookingConfirmationCardProps) {
  const segment = confirmation.flight.segments[0];
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(confirmation.confirmationCode);
    toast({
      title: "PNR copied",
      description: confirmation.confirmationCode,
    });
  };

  const depDate = new Date(segment.departure.time).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        "rounded-[var(--glass-radius-card)]",
        "bg-[var(--glass-standard)]",
        "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
        "border border-[var(--glass-accent-green)]/20",
        "shadow-[var(--glass-shadow-md)]"
      )}
    >
      {/* Confetti */}
      {showConfetti && <ConfettiParticles />}

      {/* Top green accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-[var(--glass-accent-green)] via-[var(--glass-accent-blue)] to-[var(--glass-accent-green)]" />

      <div className="p-5">
        {/* Success header */}
        <div className="flex flex-col items-center text-center">
          <AnimatedCheckmark />
          <h3 className="mt-3 text-lg font-bold text-[var(--glass-text-primary)]">
            Booking Confirmed!
          </h3>
          <p className="mt-1 text-sm text-[var(--glass-text-secondary)]">
            Your flight has been booked successfully.
          </p>
        </div>

        {/* PNR / Confirmation code — boarding pass style */}
        <div
          className={cn(
            "mt-5 flex items-center justify-between",
            "rounded-xl",
            "bg-[var(--glass-subtle)]",
            "border border-[var(--glass-border)]",
            "px-4 py-3"
          )}
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--glass-text-tertiary)]">
              Confirmation Code
            </p>
            <p className="mt-0.5 font-mono text-xl font-bold tracking-[0.2em] text-[var(--glass-text-primary)]">
              {confirmation.confirmationCode}
            </p>
          </div>
          <button
            onClick={copyCode}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              "text-[var(--glass-text-tertiary)]",
              "hover:bg-[var(--glass-subtle)] hover:text-[var(--glass-text-primary)]",
              "transition-colors duration-200",
              "active:scale-90"
            )}
            aria-label="Copy confirmation code"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>

        {/* Dotted tear line separator */}
        <div className="relative my-4 flex items-center">
          <div className="absolute -left-5 h-4 w-4 rounded-full bg-[var(--glass-bg-page)]" />
          <div className="flex-1 border-t border-dashed border-[var(--glass-border)]" />
          <div className="absolute -right-5 h-4 w-4 rounded-full bg-[var(--glass-bg-page)]" />
        </div>

        {/* Flight info row */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--glass-accent-blue-light)]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="var(--glass-accent-blue)"
            >
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--glass-text-primary)]">
              {segment.departure.airportCode} → {segment.arrival.airportCode}
            </p>
            <p className="text-xs text-[var(--glass-text-tertiary)]">
              {segment.airline} {segment.flightNumber} · {depDate}
            </p>
          </div>
        </div>

        {/* Passenger */}
        <div className="mt-3 text-sm text-[var(--glass-text-secondary)]">
          Passenger: {confirmation.passenger.firstName}{" "}
          {confirmation.passenger.lastName}
        </div>

        {/* Total */}
        <div className="mt-2 text-sm text-[var(--glass-text-primary)]">
          Total paid:{" "}
          <span className="font-bold">
            {formatPrice(confirmation.totalPrice.amount, confirmation.totalPrice.currency)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex flex-col gap-2">
          <Link href="/dashboard/bookings" className="block">
            <button
              className={cn(
                "flex w-full items-center justify-center gap-2",
                "rounded-[var(--glass-radius-button)] px-4 py-2.5",
                "text-sm font-medium",
                "bg-[var(--glass-subtle)]",
                "border border-[var(--glass-border)]",
                "text-[var(--glass-text-primary)]",
                "transition-all duration-200 ease-spring",
                "hover:bg-[var(--glass-standard)]",
                "active:scale-[0.97]"
              )}
            >
              <ExternalLink className="h-4 w-4" />
              View in My Bookings
            </button>
          </Link>

          <BoardingPass
            confirmation={confirmation}
            trigger={
              <button
                className={cn(
                  "flex w-full items-center justify-center gap-2",
                  "rounded-[var(--glass-radius-button)] px-4 py-2.5",
                  "text-sm font-medium",
                  "bg-[var(--glass-subtle)]",
                  "border border-[var(--glass-border)]",
                  "text-[var(--glass-text-primary)]",
                  "transition-all duration-200 ease-spring",
                  "hover:bg-[var(--glass-standard)]",
                  "active:scale-[0.97]"
                )}
              >
                <CreditCard className="h-4 w-4" />
                View Boarding Pass
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}
