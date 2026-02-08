"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage } from "@/types/chat";
import type { FlightOption, BookingSummary } from "@/types/flights";

const STORAGE_KEY = "skyswift-chat-messages";

function createId() {
  return crypto.randomUUID().slice(0, 12);
}

function createMessage(
  role: ChatMessage["role"],
  content: string,
  richContent?: ChatMessage["richContent"]
): ChatMessage {
  return {
    id: createId(),
    role,
    content,
    richContent,
    createdAt: new Date().toISOString(),
  };
}

function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  // Store flight options and booking summary for the current session
  const flightsRef = useRef<FlightOption[]>([]);
  const bookingRef = useRef<BookingSummary | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const saved = loadMessages();
      if (saved.length > 0) {
        setMessages(saved);
      }
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (initialized.current) {
      saveMessages(messages);
    }
  }, [messages]);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    flightsRef.current = [];
    bookingRef.current = null;
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg = createMessage("user", content);
      addMessage(userMsg);
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/flights/parse-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content }),
        });

        if (!res.ok) {
          const errorText =
            res.status === 401
              ? "Your session has expired. Please log in again."
              : "Something went wrong. Please try again.";
          setError(errorText);
          addMessage(createMessage("assistant", errorText));
          return;
        }

        const json = await res.json();

        if (json.error) {
          addMessage(
            createMessage(
              "assistant",
              json.data?.reply ?? "Something went wrong. Please try again."
            )
          );
          return;
        }

        const { reply, flights } = json.data;

        if (flights && flights.length > 0) {
          flightsRef.current = flights;
          addMessage(
            createMessage("assistant", reply, {
              type: "flight_results",
              data: flights,
            })
          );
        } else {
          addMessage(createMessage("assistant", reply));
        }
      } catch {
        const errorMsg = "Network error. Check your connection and try again.";
        setError(errorMsg);
        addMessage(createMessage("assistant", errorMsg));
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage]
  );

  const selectFlight = useCallback(
    async (flightId: string) => {
      const flight = flightsRef.current.find((f) => f.id === flightId);
      if (!flight) return;

      const segment = flight.segments[0];
      addMessage(
        createMessage(
          "user",
          `I'd like to book the ${segment.airline} ${segment.flightNumber} flight for $${flight.price.amount}.`
        )
      );
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/booking/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flight }),
        });

        if (!res.ok) {
          const errorText = "Failed to prepare booking. Please try again.";
          setError(errorText);
          addMessage(createMessage("assistant", errorText));
          return;
        }

        const json = await res.json();

        if (json.error) {
          addMessage(
            createMessage(
              "assistant",
              "Failed to prepare booking. Please try again."
            )
          );
          return;
        }

        const summary = json.data as BookingSummary;
        bookingRef.current = summary;

        addMessage(
          createMessage(
            "assistant",
            "Great choice! Here's your booking summary. Please review and confirm:",
            { type: "booking_summary", data: summary }
          )
        );
      } catch {
        const errorMsg = "Network error. Check your connection and try again.";
        setError(errorMsg);
        addMessage(createMessage("assistant", errorMsg));
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage]
  );

  const confirmBooking = useCallback(
    async (bookingId: string) => {
      const booking = bookingRef.current;
      if (!booking || booking.id !== bookingId) return;

      addMessage(createMessage("user", "Confirm and pay for this booking."));
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/booking/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking }),
        });

        if (!res.ok) {
          const errorText = "Booking failed. Please try again.";
          setError(errorText);
          addMessage(createMessage("assistant", errorText));
          return;
        }

        const json = await res.json();

        if (json.error) {
          addMessage(
            createMessage("assistant", "Booking failed. Please try again.")
          );
          return;
        }

        addMessage(
          createMessage(
            "assistant",
            "Your booking is confirmed! Here are the details:",
            {
              type: "booking_confirmation",
              data: json.data,
            }
          )
        );
        bookingRef.current = null;
      } catch {
        const errorMsg = "Network error. Check your connection and try again.";
        setError(errorMsg);
        addMessage(createMessage("assistant", errorMsg));
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    selectFlight,
    confirmBooking,
    clearChat,
  };
}
