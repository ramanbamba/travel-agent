"use client";

import { useState } from "react";
import {
  ChevronDown,
  Copy,
  Plane,
  CreditCard,
  Calendar,
  XCircle,
  Clock,
  User,
} from "lucide-react";
import { GlassCard, GlassButton, GlassPill, GlassDialog } from "@/components/ui/glass";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { BookingWithSegments } from "@/types";

const statusConfig: Record<string, { variant: "green" | "blue" | "amber" | "red" | "default"; label: string }> = {
  confirmed: { variant: "green", label: "Confirmed" },
  ticketed: { variant: "blue", label: "Ticketed" },
  pending: { variant: "amber", label: "Pending" },
  cancelled: { variant: "red", label: "Cancelled" },
  failed: { variant: "red", label: "Failed" },
};

const paymentStatusConfig: Record<string, { variant: "green" | "amber" | "red" | "default"; label: string }> = {
  captured: { variant: "green", label: "Paid" },
  refunded: { variant: "amber", label: "Refunded" },
  pending: { variant: "amber", label: "Pending" },
  failed: { variant: "red", label: "Failed" },
};

function getCountdown(departureTime: string): string | null {
  const now = new Date();
  const dep = new Date(departureTime);
  const diff = dep.getTime() - now.getTime();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days === 0 && hours <= 1) return "Boarding soon";
  if (days === 0) return `In ${hours}h`;
  if (days === 1) return "Tomorrow";
  if (days < 7) return `In ${days} days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `In ${weeks} week${weeks > 1 ? "s" : ""}`;
  }
  return `In ${days} days`;
}

function AnimatedRoute({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold tracking-tight text-[var(--glass-text-primary)]">
        {from}
      </span>
      <div className="relative flex flex-1 items-center px-1">
        <div className="h-[1.5px] flex-1 bg-gradient-to-r from-[var(--glass-accent-blue)] via-[var(--glass-accent-blue)]/40 to-[var(--glass-border)]" />
        <Plane className="mx-1 h-3.5 w-3.5 shrink-0 text-[var(--glass-accent-blue)]" />
        <div className="h-[1.5px] flex-1 bg-gradient-to-r from-[var(--glass-border)] via-[var(--glass-accent-blue)]/40 to-[var(--glass-accent-blue)]" />
      </div>
      <span className="text-lg font-bold tracking-tight text-[var(--glass-text-primary)]">
        {to}
      </span>
    </div>
  );
}

interface BookingCardProps {
  booking: BookingWithSegments;
  passengerName?: string;
  passengerEmail?: string;
  onCancel?: (bookingId: string) => Promise<void>;
}

export function BookingCard({
  booking,
  passengerName,
  passengerEmail,
  onCancel,
}: BookingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const firstSegment = booking.flight_segments[0];
  const lastSegment =
    booking.flight_segments[booking.flight_segments.length - 1];

  const fromAirport = firstSegment?.departure_airport ?? "???";
  const toAirport = lastSegment?.arrival_airport ?? "???";

  const departureDate = firstSegment
    ? new Date(firstSegment.departure_time).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";

  const departureTime = firstSegment
    ? new Date(firstSegment.departure_time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const arrivalTime = lastSegment
    ? new Date(lastSegment.arrival_time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const price = booking.total_price_cents
    ? `$${(booking.total_price_cents / 100).toLocaleString()}`
    : null;

  const countdown = firstSegment && booking.status !== "cancelled"
    ? getCountdown(firstSegment.departure_time)
    : null;

  const status = statusConfig[booking.status] ?? {
    variant: "default" as const,
    label: booking.status,
  };

  const flightLabel = firstSegment
    ? `${firstSegment.airline_code} ${firstSegment.flight_number}`
    : null;

  const bookedDate = booking.booked_at
    ? new Date(booking.booked_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  function copyPnr() {
    if (booking.pnr) {
      navigator.clipboard.writeText(booking.pnr);
      toast({ title: "PNR copied", description: booking.pnr });
    }
  }

  async function handleCancel() {
    if (!onCancel) return;
    setCancelling(true);
    try {
      await onCancel(booking.id);
    } finally {
      setCancelling(false);
      setConfirmOpen(false);
    }
  }

  const canCancel = booking.status === "confirmed" && onCancel;

  return (
    <>
      <GlassCard
        tier="subtle"
        hover
        padding="none"
        className="overflow-hidden"
      >
        {/* Clickable main area */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={`${fromAirport} to ${toAirport} on ${departureDate}. ${expanded ? "Hide" : "Show"} details`}
          className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--glass-accent-blue)] focus-visible:ring-inset"
        >
          <div className="p-4">
            {/* Top row: status + countdown + price */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GlassPill variant={status.variant} size="sm" dot>
                  {status.label}
                </GlassPill>
                {countdown && (
                  <span className="flex items-center gap-1 text-xs font-medium text-[var(--glass-accent-blue)]">
                    <Clock className="h-3 w-3" />
                    {countdown}
                  </span>
                )}
              </div>
              {price && (
                <span className="text-sm font-semibold text-[var(--glass-text-primary)]">
                  {price}
                </span>
              )}
            </div>

            {/* Animated route */}
            <AnimatedRoute from={fromAirport} to={toAirport} />

            {/* Bottom row: date, time, flight */}
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-[var(--glass-text-secondary)]">
                {departureDate}
                {departureTime && arrivalTime && (
                  <span className="ml-1 text-[var(--glass-text-tertiary)]">
                    &middot; {departureTime} – {arrivalTime}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                {flightLabel && (
                  <span className="font-mono text-xs text-[var(--glass-text-tertiary)]">
                    {flightLabel}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-[var(--glass-text-tertiary)] transition-transform duration-300 ease-spring",
                    expanded && "rotate-180"
                  )}
                />
              </div>
            </div>
          </div>
        </button>

        {/* Expandable details - spring transition via grid */}
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-spring",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden">
            <div className="border-t border-[var(--glass-border)] px-4 pb-4 pt-3">
              {/* Flight segments */}
              <div className="space-y-3">
                {booking.flight_segments.map((seg) => (
                  <div
                    key={seg.id}
                    className="rounded-[var(--glass-radius-sm)] bg-[var(--glass-subtle)] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--glass-text-tertiary)]">
                          Leg {seg.segment_order}
                        </span>
                        <span className="font-mono text-xs text-[var(--glass-text-tertiary)]">
                          {seg.airline_code} {seg.flight_number}
                        </span>
                      </div>
                      {seg.aircraft_type && (
                        <span className="text-xs text-[var(--glass-text-tertiary)]">
                          {seg.aircraft_type}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--glass-text-primary)]">
                          {seg.departure_airport}
                        </p>
                        <p className="text-xs text-[var(--glass-text-secondary)]">
                          {new Date(seg.departure_time).toLocaleTimeString(
                            "en-US",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </p>
                      </div>
                      <div className="flex-1 px-3">
                        <div className="h-px bg-[var(--glass-border)]" />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[var(--glass-text-primary)]">
                          {seg.arrival_airport}
                        </p>
                        <p className="text-xs text-[var(--glass-text-secondary)]">
                          {new Date(seg.arrival_time).toLocaleTimeString(
                            "en-US",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-[var(--glass-text-tertiary)]">
                      <span className="capitalize">
                        {seg.cabin_class?.replace("_", " ")}
                      </span>
                      {seg.seat_number && (
                        <>
                          <span>&middot;</span>
                          <span>Seat {seg.seat_number}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Info rows */}
              <div className="mt-3 space-y-2">
                {/* PNR */}
                {booking.pnr && (
                  <div className="flex items-center justify-between rounded-[var(--glass-radius-sm)] bg-[var(--glass-subtle)] p-3">
                    <div>
                      <p className="text-xs font-medium text-[var(--glass-text-tertiary)]">
                        Confirmation code
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-semibold tracking-wider text-[var(--glass-text-primary)]">
                        {booking.pnr}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyPnr();
                      }}
                      aria-label={`Copy confirmation code ${booking.pnr}`}
                      className="flex h-8 w-8 items-center justify-center rounded-[var(--glass-radius-sm)] text-[var(--glass-text-tertiary)] transition-colors hover:bg-[var(--glass-standard)] hover:text-[var(--glass-text-primary)]"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Passenger */}
                {(passengerName || passengerEmail) && (
                  <div className="flex items-start gap-3 rounded-[var(--glass-radius-sm)] bg-[var(--glass-subtle)] p-3">
                    <User className="mt-0.5 h-4 w-4 shrink-0 text-[var(--glass-text-tertiary)]" />
                    <div>
                      <p className="text-xs font-medium text-[var(--glass-text-tertiary)]">
                        Passenger
                      </p>
                      {passengerName && (
                        <p className="mt-0.5 text-sm text-[var(--glass-text-primary)]">
                          {passengerName}
                        </p>
                      )}
                      {passengerEmail && (
                        <p className="text-xs text-[var(--glass-text-secondary)]">
                          {passengerEmail}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment */}
                {(booking.payment_methods || booking.payment_status) && (
                  <div className="flex items-center justify-between rounded-[var(--glass-radius-sm)] bg-[var(--glass-subtle)] p-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[var(--glass-text-tertiary)]" />
                      <div>
                        <p className="text-xs font-medium text-[var(--glass-text-tertiary)]">
                          Payment
                        </p>
                        {booking.payment_methods && (
                          <p className="mt-0.5 text-sm text-[var(--glass-text-primary)]">
                            <span className="capitalize">
                              {booking.payment_methods.card_brand}
                            </span>{" "}
                            ····{booking.payment_methods.card_last_four}
                          </p>
                        )}
                      </div>
                    </div>
                    {booking.payment_status && (
                      <GlassPill
                        variant={
                          paymentStatusConfig[booking.payment_status]?.variant ??
                          "default"
                        }
                        size="sm"
                      >
                        {paymentStatusConfig[booking.payment_status]?.label ??
                          booking.payment_status}
                      </GlassPill>
                    )}
                  </div>
                )}

                {/* Timeline */}
                {bookedDate && (
                  <div className="flex items-start gap-3 rounded-[var(--glass-radius-sm)] bg-[var(--glass-subtle)] p-3">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[var(--glass-text-tertiary)]" />
                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--glass-text-secondary)]">
                        Booked on {bookedDate}
                      </p>
                      {booking.cancelled_at && (
                        <p className="text-[var(--glass-accent-red)]">
                          Cancelled on{" "}
                          {new Date(booking.cancelled_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Cancel button */}
              {canCancel && (
                <div className="mt-3">
                  <GlassButton
                    variant="secondary"
                    size="md"
                    className="w-full border-[var(--glass-accent-red-light)] text-[var(--glass-accent-red)] hover:bg-[var(--glass-accent-red-light)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmOpen(true);
                    }}
                    disabled={cancelling}
                  >
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                    {cancelling ? "Cancelling..." : "Cancel Booking"}
                  </GlassButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Cancel confirmation dialog */}
      <GlassDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Cancel this booking?"
        description={`This will cancel your ${fromAirport} → ${toAirport} flight on ${departureDate}.${booking.stripe_payment_intent_id ? " A refund will be issued to your card." : ""} This action cannot be undone.`}
      >
        <div className="flex gap-3 pt-4">
          <GlassButton
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={() => setConfirmOpen(false)}
          >
            Keep Booking
          </GlassButton>
          <GlassButton
            variant="primary"
            size="md"
            className="flex-1 bg-[var(--glass-accent-red)] hover:bg-[var(--glass-accent-red)]/80"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling..." : "Yes, Cancel"}
          </GlassButton>
        </div>
      </GlassDialog>
    </>
  );
}
