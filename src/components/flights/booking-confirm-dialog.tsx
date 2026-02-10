"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, formatTimeIST, formatDateIST } from "@/lib/utils/format-india";
import { isLiveMode } from "@/lib/config/app-mode";
import type { BookingSummary } from "@/types/flights";

interface BookingConfirmDialogProps {
  booking: BookingSummary;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BookingConfirmDialog({
  booking,
  onConfirm,
  onCancel,
}: BookingConfirmDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const segment = booking.flight.segments[0];
  const liveMode = isLiveMode();

  return (
    <div className="space-y-4">
      {liveMode && (
        <div className="flex items-start gap-3 rounded-[var(--glass-radius-button)] bg-amber-500/10 p-3 border border-amber-500/20">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-[var(--glass-text-primary)]">
              You are about to book a REAL flight.
            </p>
            <div className="mt-1.5 space-y-0.5 text-[var(--glass-text-secondary)]">
              <p>
                {segment.airline} {segment.flightNumber} · {segment.departure.airportCode} → {segment.arrival.airportCode}
              </p>
              <p>
                {formatDateIST(segment.departure.time)} · {formatTimeIST(segment.departure.time)}
              </p>
              <p className="font-medium text-[var(--glass-text-primary)]">
                Total: {formatPrice(booking.totalPrice.amount, booking.totalPrice.currency)}
              </p>
            </div>
            <p className="mt-2 text-xs text-[var(--glass-text-tertiary)]">
              Your payment method will be charged. This is a real airline ticket.
            </p>
          </div>
        </div>
      )}

      {liveMode && (
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--glass-border)] text-[var(--glass-accent-blue)] focus:ring-[var(--glass-accent-blue)]"
          />
          <span className="text-xs text-[var(--glass-text-secondary)]">
            I understand this is a real booking
          </span>
        </label>
      )}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className={cn(
            "flex-1 rounded-[var(--glass-radius-button)] px-4 py-2.5",
            "text-sm font-medium",
            "text-[var(--glass-text-secondary)]",
            "border border-[var(--glass-border)]",
            "bg-[var(--glass-subtle)]",
            "transition-all duration-200 ease-spring",
            "hover:bg-[var(--glass-standard)] active:scale-[0.97]"
          )}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={liveMode && !acknowledged}
          className={cn(
            "flex-1 rounded-[var(--glass-radius-button)] px-4 py-2.5",
            "text-sm font-semibold text-white",
            "bg-[#0A84FF]",
            "shadow-[0_1px_3px_rgba(10,132,255,0.3)]",
            "transition-all duration-200 ease-spring",
            "hover:opacity-90 active:scale-[0.97]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Proceed to Pay
        </button>
      </div>
    </div>
  );
}
