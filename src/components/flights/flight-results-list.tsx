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
  // First flight is recommended if it has a preference score
  // (results come pre-sorted by score from the backend)
  const hasScores = flights.length > 0 && flights[0].preferenceScore != null;

  return (
    <div className="flex w-full flex-col gap-2.5">
      {flights.map((flight, i) => (
        <div
          key={flight.id}
          className="animate-chat-message opacity-0 [animation-fill-mode:forwards]"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <FlightCard
            flight={flight}
            onSelect={onSelect}
            recommended={hasScores && i === 0}
            rank={i + 1}
          />
        </div>
      ))}
    </div>
  );
}
