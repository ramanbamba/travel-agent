"use client";

import { useState } from "react";
import { Plane, User, Armchair, Award, ShieldCheck, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format-india";
import { isSandbox } from "@/lib/config/app-mode";
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

const RazorpayPayment = dynamic(
  () => import("./razorpay-payment").then((mod) => mod.RazorpayPayment),
  { ssr: false }
);

const BookingConfirmDialog = dynamic(
  () => import("./booking-confirm-dialog").then((mod) => mod.BookingConfirmDialog),
  { ssr: false }
);

import type { BookingSummary } from "@/types/flights";

interface BookingSummaryCardProps {
  summary: BookingSummary;
  onConfirm?: (bookingId: string, paymentMethodId: string) => void;
  onRazorpayConfirm?: (bookingId: string, razorpayResponse: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
}

function formatSeatPref(pref: string) {
  return pref
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function BookingSummaryCard({
  summary,
  onConfirm,
  onRazorpayConfirm,
}: BookingSummaryCardProps) {
  const segment = summary.flight.segments[0];
  const { passenger } = summary;
  const [showPayment, setShowPayment] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayConfirmed, setRazorpayConfirmed] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const currency = summary.totalPrice.currency;

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
                    {formatPrice(summary.totalPrice.amount - summary.totalPrice.serviceFee, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--glass-text-tertiary)]">Service fee</span>
                  <span className="text-[var(--glass-text-primary)]">
                    {formatPrice(summary.totalPrice.serviceFee, currency)}
                  </span>
                </div>
                <div className="border-t border-[var(--glass-border)]" />
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--glass-text-primary)]">
                    Total
                  </span>
                  <span className="text-lg font-bold text-[var(--glass-text-primary)]">
                    {formatPrice(summary.totalPrice.amount, currency)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[var(--glass-text-tertiary)]">Total</span>
                <span className="text-lg font-bold text-[var(--glass-text-primary)]">
                  {formatPrice(summary.totalPrice.amount, currency)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment selector (Stripe) */}
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

        {/* Razorpay confirmation + payment flow */}
        {showRazorpay && !razorpayConfirmed && (
          <>
            <div className="border-t border-[var(--glass-border)]" />
            <BookingConfirmDialog
              booking={summary}
              onConfirm={() => setRazorpayConfirmed(true)}
              onCancel={() => {
                setShowRazorpay(false);
                setRazorpayConfirmed(false);
              }}
            />
          </>
        )}

        {showRazorpay && razorpayConfirmed && (
          <>
            <div className="border-t border-[var(--glass-border)]" />
            <RazorpayPayment
              amount={summary.totalPrice.amount}
              currency={currency}
              description={`${segment.departure.airportCode} → ${segment.arrival.airportCode} · ${segment.airline} ${segment.flightNumber}`}
              userName={`${passenger.firstName} ${passenger.lastName}`}
              userEmail={passenger.email}
              confirmed={razorpayConfirmed}
              onSuccess={(response) => {
                setPaying(true);
                onRazorpayConfirm?.(summary.id, response);
              }}
              onFailure={(error) => {
                setPayError(error);
                setRazorpayConfirmed(false);
              }}
            />
            {payError && (
              <p className="text-xs text-red-500 text-center">{payError}</p>
            )}
          </>
        )}
      </div>

      {/* Confirm & Pay buttons */}
      {onConfirm && !showPayment && !showRazorpay && (
        <div className="border-t border-[var(--glass-border)] px-5 py-4 space-y-2.5">
          {/* Demo Pay — sandbox only, bypasses payment */}
          {isSandbox() && (
            <>
              <button
                onClick={() => {
                  setPaying(true);
                  onConfirm(summary.id, "demo");
                }}
                disabled={paying}
                className={cn(
                  "flex w-full items-center justify-center gap-2",
                  "rounded-[var(--glass-radius-button)] px-4 py-2.5",
                  "text-sm font-semibold text-white",
                  "bg-black dark:bg-white dark:text-black",
                  "shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
                  "transition-all duration-200 ease-spring",
                  "hover:opacity-90 active:scale-[0.97]",
                  "disabled:opacity-50"
                )}
              >
                {paying ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.72 5.011H8.17l.27-1.57a1 1 0 0 1 .98-.82h6.47a3.72 3.72 0 0 1 1.83 6.96v.01c-.07.02-.14.05-.22.07a3.72 3.72 0 0 1-2.59-.14 3.72 3.72 0 0 1-2.15-3.37H8.44L7.09 14.1h9.73a1 1 0 0 1 .89.55l2.34 4.68a1 1 0 0 1-.9 1.45H4.12a1 1 0 0 1-.97-1.22l1.2-5.42.01-.05L5.8 6.73l.01-.05.6-2.79A1 1 0 0 1 7.38 3h9.73a1 1 0 0 1 .61.2z" />
                  </svg>
                )}
                {paying ? "Booking..." : "Demo Pay"}
              </button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--glass-border)]" />
                </div>
                <span className="relative bg-[var(--glass-standard)] px-2 text-[11px] text-[var(--glass-text-tertiary)]">
                  or
                </span>
              </div>
            </>
          )}

          {/* Razorpay — UPI, cards, wallets for India */}
          <button
            onClick={() => setShowRazorpay(true)}
            disabled={paying}
            className={cn(
              "flex w-full items-center justify-center gap-2",
              "rounded-[var(--glass-radius-button)] px-4 py-2.5",
              "text-sm font-semibold text-white",
              "bg-[#0A84FF]",
              "shadow-[0_1px_3px_rgba(10,132,255,0.3)]",
              "transition-all duration-200 ease-spring",
              "hover:opacity-90 active:scale-[0.97]",
              "disabled:opacity-50"
            )}
          >
            Pay {formatPrice(summary.totalPrice.amount, currency)}
          </button>

          {/* Stripe card option */}
          <button
            onClick={() => setShowPayment(true)}
            disabled={paying}
            className={cn(
              "flex w-full items-center justify-center",
              "rounded-[var(--glass-radius-button)] px-4 py-2.5",
              "text-sm font-medium",
              "text-[var(--glass-text-secondary)]",
              "border border-[var(--glass-border)]",
              "bg-[var(--glass-subtle)]",
              "transition-all duration-200 ease-spring",
              "hover:bg-[var(--glass-standard)] active:scale-[0.97]",
              "disabled:opacity-50"
            )}
          >
            Pay with saved card
          </button>
        </div>
      )}
    </div>
  );
}
