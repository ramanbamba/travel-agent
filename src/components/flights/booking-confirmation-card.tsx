"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, CreditCard, ExternalLink, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format-india";
import { toast } from "@/hooks/use-toast";
import { buildShareText, buildWhatsAppShareUrl } from "@/lib/referrals";
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

/* WhatsApp icon */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function BookingConfirmationCard({
  confirmation,
}: BookingConfirmationCardProps) {
  const segment = confirmation.flight.segments[0];
  const [showConfetti, setShowConfetti] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch referral code for sharing
  useEffect(() => {
    async function loadReferralCode() {
      try {
        const res = await fetch("/api/referrals");
        if (res.ok) {
          const json = await res.json();
          setReferralCode(json.data?.referralCode ?? null);
        }
      } catch {
        // Non-critical — share without referral code
      }
    }
    loadReferralCode();
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

  const route = `${segment.departure.airportCode} → ${segment.arrival.airportCode}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://skyswift.app";

  const shareText = referralCode
    ? buildShareText({ route, referralCode, appUrl })
    : `Just booked ${route} on SkySwift! ✈️`;

  const handleWhatsAppShare = () => {
    window.open(buildWhatsAppShareUrl(shareText), "_blank");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Flight Booked on SkySwift",
          text: shareText,
        });
      } catch {
        // User cancelled or not supported
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard",
        description: "Share text copied — paste it anywhere!",
      });
    }
  };

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
              {route}
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

        {/* Share section */}
        <div className="mt-5 border-t border-dashed border-[var(--glass-border)] pt-4">
          <p className="text-center text-xs font-medium text-[var(--glass-text-tertiary)] mb-3">
            Share with friends — first 100 users get zero fees
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleWhatsAppShare}
              className={cn(
                "flex flex-1 items-center justify-center gap-2",
                "rounded-[var(--glass-radius-button)] px-4 py-2.5",
                "text-sm font-medium text-white",
                "bg-[#25D366]",
                "transition-all duration-200 ease-spring",
                "hover:opacity-90 active:scale-[0.97]"
              )}
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </button>
            <button
              onClick={handleShare}
              className={cn(
                "flex flex-1 items-center justify-center gap-2",
                "rounded-[var(--glass-radius-button)] px-4 py-2.5",
                "text-sm font-medium",
                "text-[var(--glass-text-primary)]",
                "bg-[var(--glass-subtle)]",
                "border border-[var(--glass-border)]",
                "transition-all duration-200 ease-spring",
                "hover:bg-[var(--glass-standard)] active:scale-[0.97]"
              )}
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex flex-col gap-2">
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
