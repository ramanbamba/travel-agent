"use client";

import { useState } from "react";
import { Plane, User, Armchair, Award, ShieldCheck, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const PaymentSelector = dynamic(
  () => import("./payment-selector").then((mod) => mod.PaymentSelector),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-6">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--glass-text-tertiary)] border-t-transparent" />
      </div>
    ),
  }
);
import type { BookingSummary } from "@/types/flights";

interface BookingSummaryCardProps {
  summary: BookingSummary;
  onConfirm?: (bookingId: string, paymentMethodId: string) => void;
}

function formatSeatPref(pref: string) {
  return pref
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function BookingSummaryCard({
  summary,
  onConfirm,
}: BookingSummaryCardProps) {
  const segment = summary.flight.segments[0];
  const { passenger } = summary;
  const [showPayment, setShowPayment] = useState(false);
  const [paying, setPaying] = useState(false);

  function handlePay(paymentMethodId: string) {
    setPaying(true);
    onConfirm?.(summary.id, paymentMethodId);
  }

  return (
    <div
      className={cn(
        "w-full",
        "rounded-[var(--glass-radius-card)]",
        "bg-[var(--glass-standard)]",
        "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
        "border border-[var(--glass-border)]",
        "shadow-[var(--glass-shadow-sm)] [box-shadow:var(--glass-shadow-sm),var(--glass-inner-glow)]"
      )}
    >
      {/* Header */}
      <div className="border-b border-[var(--glass-border)] px-5 py-3">
        <h3 className="text-sm font-semibold text-[var(--glass-text-primary)]">
          Booking Summary
        </h3>
      </div>

      <div className="space-y-3.5 p-5">
        {/* Flight details */}
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--glass-accent-blue-light)]">
            <Plane className="h-4 w-4 text-[var(--glass-accent-blue)]" />
          </div>
          <div className="space-y-0.5 text-sm">
            <p className="font-semibold text-[var(--glass-text-primary)]">
              {segment.departure.airportCode} → {segment.arrival.airportCode}
            </p>
            <p className="text-[var(--glass-text-tertiary)]">
              {segment.airline} {segment.flightNumber} · {summary.flight.totalDuration}
            </p>
            <p className="text-[var(--glass-text-tertiary)]">
              {new Date(segment.departure.time).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}{" "}
              at{" "}
              {new Date(segment.departure.time).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>
        </div>

        {/* Passenger */}
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--glass-subtle)]">
            <User className="h-4 w-4 text-[var(--glass-text-secondary)]" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-[var(--glass-text-primary)]">
              {passenger.firstName} {passenger.lastName}
            </p>
            <p className="text-[var(--glass-text-tertiary)]">{passenger.email}</p>
          </div>
        </div>

        {/* Seat preference */}
        {passenger.seatPreference && passenger.seatPreference !== "no_preference" && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--glass-subtle)]">
              <Armchair className="h-4 w-4 text-[var(--glass-text-secondary)]" />
            </div>
            <div className="text-sm">
              <span className="text-[var(--glass-text-tertiary)]">Seat: </span>
              <span className="font-medium text-[var(--glass-text-primary)]">
                {formatSeatPref(passenger.seatPreference)}
              </span>
            </div>
          </div>
        )}

        {/* Loyalty program */}
        {passenger.loyaltyProgram && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--glass-subtle)]">
              <Award className="h-4 w-4 text-[var(--glass-text-secondary)]" />
            </div>
            <div className="text-sm">
              <span className="text-[var(--glass-text-tertiary)]">Loyalty: </span>
              <span className="font-medium text-[var(--glass-text-primary)]">
                {passenger.loyaltyProgram}
              </span>
              {passenger.loyaltyNumber && (
                <span className="ml-1 text-[var(--glass-text-tertiary)]">
                  ({passenger.loyaltyNumber})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Passport status */}
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--glass-subtle)]">
            <ShieldCheck className="h-4 w-4 text-[var(--glass-text-secondary)]" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--glass-text-tertiary)]">Passport:</span>
            {passenger.passportOnFile ? (
              <span className="rounded-full bg-[var(--glass-accent-green-light)] px-2 py-0.5 text-[11px] font-medium text-[var(--glass-accent-green)]">
                On file
              </span>
            ) : (
              <span className="rounded-full bg-[var(--glass-accent-orange)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--glass-accent-orange)]">
                Not added
              </span>
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-[var(--glass-border)]" />

        {/* Price breakdown */}
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--glass-subtle)]">
            <CreditCard className="h-4 w-4 text-[var(--glass-text-secondary)]" />
          </div>
          <div className="w-full space-y-1.5 text-sm">
            {summary.totalPrice.serviceFee ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--glass-text-tertiary)]">Flight fare</span>
                  <span className="text-[var(--glass-text-primary)]">
                    $
                    {(
                      summary.totalPrice.amount - summary.totalPrice.serviceFee
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {summary.totalPrice.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--glass-text-tertiary)]">Service fee</span>
                  <span className="text-[var(--glass-text-primary)]">
                    $
                    {summary.totalPrice.serviceFee.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {summary.totalPrice.currency}
                  </span>
                </div>
                <div className="border-t border-[var(--glass-border)]" />
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--glass-text-primary)]">
                    Total
                  </span>
                  <span className="text-lg font-bold text-[var(--glass-text-primary)]">
                    $
                    {summary.totalPrice.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {summary.totalPrice.currency}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[var(--glass-text-tertiary)]">Total</span>
                <span className="text-lg font-bold text-[var(--glass-text-primary)]">
                  ${summary.totalPrice.amount.toLocaleString()}{" "}
                  {summary.totalPrice.currency}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment selector */}
        {showPayment && onConfirm && (
          <>
            <div className="border-t border-[var(--glass-border)]" />
            <PaymentSelector
              amount={summary.totalPrice.amount}
              currency={summary.totalPrice.currency}
              onPay={handlePay}
              onCancel={() => setShowPayment(false)}
              disabled={paying}
            />
          </>
        )}
      </div>

      {/* Confirm & Pay button */}
      {onConfirm && !showPayment && (
        <div className="border-t border-[var(--glass-border)] px-5 py-4">
          <button
            onClick={() => setShowPayment(true)}
            className={cn(
              "flex w-full items-center justify-center",
              "rounded-[var(--glass-radius-button)] px-4 py-2.5",
              "text-sm font-semibold text-white",
              "bg-[var(--glass-accent-blue)]",
              "shadow-[0_1px_2px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,113,227,0.25)]",
              "transition-all duration-200 ease-spring",
              "hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,113,227,0.3)]",
              "active:scale-[0.97]"
            )}
          >
            Confirm & Pay
          </button>
        </div>
      )}
    </div>
  );
}
