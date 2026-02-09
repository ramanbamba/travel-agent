"use client";

import { useState } from "react";
import { Plane, User, CreditCard, Armchair, Award, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import dynamic from "next/dynamic";

const PaymentSelector = dynamic(() =>
  import("./payment-selector").then((mod) => mod.PaymentSelector),
  { ssr: false, loading: () => <div className="flex justify-center py-6"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" /></div> }
);
import type { BookingSummary } from "@/types/flights";

interface BookingSummaryCardProps {
  summary: BookingSummary;
  onConfirm?: (bookingId: string, paymentMethodId: string) => void;
}

function formatSeatPref(pref: string) {
  return pref.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
    <Card className="w-full border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <h3 className="text-sm font-semibold">Booking Summary</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Flight details */}
        <div className="flex items-start gap-3">
          <Plane className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="space-y-1 text-sm">
            <p className="font-medium">
              {segment.departure.airportCode} → {segment.arrival.airportCode}
            </p>
            <p className="text-muted-foreground">
              {segment.airline} {segment.flightNumber} &middot;{" "}
              {summary.flight.totalDuration}
            </p>
            <p className="text-muted-foreground">
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
          <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            <p className="font-medium">
              {passenger.firstName} {passenger.lastName}
            </p>
            <p className="text-muted-foreground">{passenger.email}</p>
          </div>
        </div>

        {/* Seat preference */}
        {passenger.seatPreference &&
          passenger.seatPreference !== "no_preference" && (
            <div className="flex items-start gap-3">
              <Armchair className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <span className="text-muted-foreground">Seat: </span>
                <span className="font-medium">
                  {formatSeatPref(passenger.seatPreference)}
                </span>
              </div>
            </div>
          )}

        {/* Loyalty program */}
        {passenger.loyaltyProgram && (
          <div className="flex items-start gap-3">
            <Award className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <span className="text-muted-foreground">Loyalty: </span>
              <span className="font-medium">{passenger.loyaltyProgram}</span>
              {passenger.loyaltyNumber && (
                <span className="ml-1 text-muted-foreground">
                  ({passenger.loyaltyNumber})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Passport status */}
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Passport:</span>
            {passenger.passportOnFile ? (
              <Badge variant="outline" className="border-green-500/30 text-green-400 text-[10px]">
                On file
              </Badge>
            ) : (
              <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-[10px]">
                Not added
              </Badge>
            )}
          </div>
        </div>

        <Separator className="bg-white/5" />

        {/* Price */}
        <div className="flex items-start gap-3">
          <CreditCard className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="flex w-full items-center justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="text-lg font-bold">
              ${summary.totalPrice.amount.toLocaleString()}{" "}
              {summary.totalPrice.currency}
            </span>
          </div>
        </div>

        {/* Payment selector (shown after clicking Confirm & Pay) */}
        {showPayment && onConfirm && (
          <>
            <Separator className="bg-white/5" />
            <PaymentSelector
              amount={summary.totalPrice.amount}
              currency={summary.totalPrice.currency}
              onPay={handlePay}
              onCancel={() => setShowPayment(false)}
              disabled={paying}
            />
          </>
        )}
      </CardContent>
      {onConfirm && !showPayment && (
        <CardFooter>
          <Button className="w-full" onClick={() => setShowPayment(true)}>
            Confirm & Pay
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
