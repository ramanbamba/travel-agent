import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FlightOption } from "@/types/flights";

interface FlightCardProps {
  flight: FlightOption;
  onSelect?: (flightId: string) => void;
}

export function FlightCard({ flight, onSelect }: FlightCardProps) {
  const segment = flight.segments[0];
  const cabinLabel = segment.cabin.replace("_", " ");

  return (
    <Card className="border-white/10 bg-white/[0.03] transition-colors hover:border-white/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Route info */}
          <div className="flex-1 space-y-3">
            {/* Airline + flight number */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{segment.airline}</span>
              <span className="text-xs text-muted-foreground">
                {segment.flightNumber}
              </span>
              <Badge variant="outline" className="text-[10px] capitalize">
                {cabinLabel}
              </Badge>
            </div>

            {/* Times + airports */}
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {new Date(segment.departure.time).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {segment.departure.airportCode}
                </p>
              </div>

              <div className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">
                  {flight.totalDuration}
                </span>
                <div className="flex w-full items-center gap-1">
                  <div className="h-px flex-1 bg-white/20" />
                  <Plane className="h-3 w-3 text-muted-foreground" />
                  <div className="h-px flex-1 bg-white/20" />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {flight.stops === 0
                    ? "Nonstop"
                    : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                </span>
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold">
                  {new Date(segment.arrival.time).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {segment.arrival.airportCode}
                </p>
              </div>
            </div>
          </div>

          {/* Price + select */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-xl font-bold">
                ${flight.price.amount.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {flight.price.currency}
              </p>
            </div>
            {flight.seatsRemaining && flight.seatsRemaining <= 5 && (
              <span className="text-[10px] text-orange-400">
                {flight.seatsRemaining} seats left
              </span>
            )}
            {onSelect && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onSelect(flight.id)}
                className="text-xs"
              >
                Select
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
