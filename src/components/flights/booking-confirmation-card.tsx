import { CheckCircle, Plane, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BookingConfirmation } from "@/types/flights";

interface BookingConfirmationCardProps {
  confirmation: BookingConfirmation;
}

export function BookingConfirmationCard({
  confirmation,
}: BookingConfirmationCardProps) {
  const segment = confirmation.flight.segments[0];

  const copyCode = () => {
    navigator.clipboard.writeText(confirmation.confirmationCode);
  };

  return (
    <Card className="w-full border-green-500/20 bg-green-500/5">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <CheckCircle className="h-10 w-10 text-green-500" />
          <h3 className="mt-3 text-lg font-semibold">Booking Confirmed!</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your flight has been booked successfully.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {/* Confirmation code */}
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Confirmation Code</p>
              <p className="mt-0.5 font-mono text-lg font-bold tracking-wider">
                {confirmation.confirmationCode}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={copyCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Flight details */}
          <div className="flex items-center gap-3 text-sm">
            <Plane className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {segment.departure.airportCode} →{" "}
                {segment.arrival.airportCode}
              </p>
              <p className="text-muted-foreground">
                {segment.airline} {segment.flightNumber} &middot;{" "}
                {new Date(segment.departure.time).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Passenger */}
          <div className="text-sm text-muted-foreground">
            Passenger: {confirmation.passenger.firstName}{" "}
            {confirmation.passenger.lastName}
          </div>

          {/* Price */}
          <div className="text-sm">
            Total paid:{" "}
            <span className="font-semibold">
              ${confirmation.totalPrice.amount.toLocaleString()}{" "}
              {confirmation.totalPrice.currency}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
