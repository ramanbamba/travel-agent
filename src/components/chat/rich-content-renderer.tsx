import type { RichContent } from "@/types/chat";
import type {
  FlightOption,
  BookingSummary,
  BookingConfirmation,
} from "@/types/flights";
import { FlightResultsList } from "@/components/flights/flight-results-list";
import { BookingSummaryCard } from "@/components/flights/booking-summary-card";
import { BookingConfirmationCard } from "@/components/flights/booking-confirmation-card";

interface RichContentRendererProps {
  content: RichContent;
  onSelectFlight?: (flightId: string) => void;
  onConfirmBooking?: (bookingId: string, paymentMethodId?: string) => void;
  onRazorpayConfirm?: (bookingId: string, razorpayResponse: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
}

export function RichContentRenderer({
  content,
  onSelectFlight,
  onConfirmBooking,
  onRazorpayConfirm,
}: RichContentRendererProps) {
  switch (content.type) {
    case "flight_results":
      return (
        <FlightResultsList
          flights={content.data as FlightOption[]}
          onSelect={onSelectFlight}
        />
      );
    case "booking_summary":
      return (
        <BookingSummaryCard
          summary={content.data as BookingSummary}
          onConfirm={onConfirmBooking}
          onRazorpayConfirm={onRazorpayConfirm}
        />
      );
    case "booking_confirmation":
      return (
        <BookingConfirmationCard
          confirmation={content.data as BookingConfirmation}
        />
      );
    default:
      return null;
  }
}
