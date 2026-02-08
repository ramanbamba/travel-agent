import type { FlightOption } from "@/types/flights";
import { FlightCard } from "./flight-card";

interface FlightResultsListProps {
  flights: FlightOption[];
  onSelect?: (flightId: string) => void;
}

export function FlightResultsList({
  flights,
  onSelect,
}: FlightResultsListProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      {flights.map((flight, i) => (
        <div
          key={flight.id}
          className="animate-chat-message"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <FlightCard flight={flight} onSelect={onSelect} />
        </div>
      ))}
    </div>
  );
}
