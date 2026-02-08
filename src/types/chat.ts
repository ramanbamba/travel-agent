import type { FlightOption, BookingSummary, BookingConfirmation } from "./flights";

export type MessageRole = "user" | "assistant";

export type RichContentType =
  | "flight_results"
  | "booking_summary"
  | "booking_confirmation";

export interface RichContent {
  type: RichContentType;
  data: FlightOption[] | BookingSummary | BookingConfirmation;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  richContent?: RichContent;
  createdAt: string; // ISO string for localStorage compatibility
}

export interface ParsedIntent {
  type: "flight_search" | "booking" | "general";
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  cabin?: string;
  passengers?: number;
  rawQuery: string;
}
