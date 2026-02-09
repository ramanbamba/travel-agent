"use client";

import { useState } from "react";
import { ChevronDown, Copy, Plane, CreditCard, Calendar, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { BookingWithSegments } from "@/types";

const statusColors: Record<string, string> = {
  confirmed: "bg-green-500/10 text-green-400 border-green-500/20",
  ticketed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

const paymentStatusColors: Record<string, string> = {
  captured: "bg-green-500/10 text-green-400 border-green-500/20",
  refunded: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

interface BookingCardProps {
  booking: BookingWithSegments;
  passengerName?: string;
  passengerEmail?: string;
  onCancel?: (bookingId: string) => Promise<void>;
}

export function BookingCard({ booking, passengerName, passengerEmail, onCancel }: BookingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const firstSegment = booking.flight_segments[0];
  const lastSegment =
    booking.flight_segments[booking.flight_segments.length - 1];

  const route = firstSegment && lastSegment
    ? `${firstSegment.departure_airport} → ${lastSegment.arrival_airport}`
    : "Unknown route";

  const departureDate = firstSegment
    ? new Date(firstSegment.departure_time).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
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
    : "—";

  const bookedDate = booking.booked_at
    ? new Date(booking.booked_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
    }
  }

  const canCancel = booking.status === "confirmed" && onCancel;

  return (
    <Card className="border-white/10 bg-white/[0.02] transition-colors hover:bg-white/[0.04]">
      <CardContent className="p-4">
        {/* Main row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
              <Plane className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{route}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {departureDate}
                {departureTime && arrivalTime && (
                  <span> &middot; {departureTime} → {arrivalTime}</span>
                )}
                {firstSegment && (
                  <span>
                    {" "}&middot; {firstSegment.airline_code}{" "}
                    {firstSegment.flight_number}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs capitalize", statusColors[booking.status])}
            >
              {booking.status}
            </Badge>
            <span className="text-sm font-medium">{price}</span>
          </div>
        </div>

        {/* PNR + expand toggle */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {booking.pnr && (
              <button
                onClick={copyPnr}
                aria-label={`Copy confirmation code ${booking.pnr}`}
                className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {booking.pnr}
                <Copy className="ml-1 h-3 w-3" />
              </button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={expanded ? "Hide booking details" : "Show booking details"}
            className="h-7 gap-1 text-xs text-muted-foreground"
          >
            Details
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                expanded && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 space-y-4 border-t border-white/5 pt-3">
            {/* Flight segments */}
            <div className="space-y-3">
              {booking.flight_segments.map((seg) => (
                <div key={seg.id} className="flex items-center gap-3 text-sm">
                  <div className="w-16 shrink-0 text-muted-foreground">
                    Leg {seg.segment_order}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {seg.departure_airport} → {seg.arrival_airport}
                    </p>
                    <p className="text-muted-foreground">
                      {seg.airline_code} {seg.flight_number}
                      {" "}&middot;{" "}
                      {new Date(seg.departure_time).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" → "}
                      {new Date(seg.arrival_time).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {seg.cabin_class?.replace("_", " ")}
                      {seg.seat_number && ` · Seat ${seg.seat_number}`}
                      {seg.aircraft_type && ` · ${seg.aircraft_type}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Passenger info */}
            {(passengerName || passengerEmail) && (
              <div className="rounded-lg border border-white/5 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Passenger</p>
                <div className="mt-1.5 space-y-0.5 text-sm">
                  {passengerName && <p>{passengerName}</p>}
                  {passengerEmail && <p className="text-muted-foreground">{passengerEmail}</p>}
                </div>
              </div>
            )}

            {/* Payment info */}
            {(booking.payment_methods || booking.payment_status) && (
              <div className="rounded-lg border border-white/5 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Payment</p>
                <div className="mt-1.5 flex items-center gap-3 text-sm">
                  {booking.payment_methods && (
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="capitalize">{booking.payment_methods.card_brand}</span>{" "}
                      ····{booking.payment_methods.card_last_four}
                    </span>
                  )}
                  {booking.payment_status && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize",
                        paymentStatusColors[booking.payment_status] ?? ""
                      )}
                    >
                      {booking.payment_status}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            {bookedDate && (
              <div className="rounded-lg border border-white/5 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Timeline</p>
                <div className="mt-1.5 space-y-1 text-sm">
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Booked on {bookedDate}
                  </p>
                  {booking.cancelled_at && (
                    <p className="flex items-center gap-1.5 text-red-400">
                      <XCircle className="h-3.5 w-3.5" />
                      Cancelled on{" "}
                      {new Date(booking.cancelled_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Cancel button */}
            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    disabled={cancelling}
                  >
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                    {cancelling ? "Cancelling..." : "Cancel Booking"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel your {route} flight on {departureDate}.
                      {booking.stripe_payment_intent_id && " A refund will be issued to your card."}
                      {" "}This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Yes, Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
