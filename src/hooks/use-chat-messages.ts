"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage } from "@/types/chat";
import type { FlightOption, BookingSummary } from "@/types/flights";

const STORAGE_KEY = "skyswift-chat-messages";

export interface ChatSession {
  id: string;
  title: string;
  booking_id?: string | null;
  created_at: string;
  updated_at: string;
}

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

function loadLocalMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

function saveLocalMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // localStorage full or unavailable
  }
}

export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const initialized = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  // Keep messagesRef in sync
  messagesRef.current = messages;

  const flightsRef = useRef<FlightOption[]>([]);
  const bookingRef = useRef<BookingSummary | null>(null);

  // Debounced save to DB
  const debouncedSave = useCallback(
    (sessionId: string, msgs: ChatMessage[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await fetch(`/api/chat-sessions/${sessionId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: msgs }),
          });
        } catch {
          // Fallback: save to localStorage
          saveLocalMessages(msgs);
        }
      }, 1000);
    },
    []
  );

  // Load sessions on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      try {
        const res = await fetch("/api/chat-sessions");
        if (!res.ok) throw new Error("Failed to fetch sessions");
        const json = await res.json();
        const serverSessions = (json.data ?? []) as ChatSession[];
        setSessions(serverSessions);

        if (serverSessions.length > 0) {
          // Load most recent session
          const latest = serverSessions[0];
          setCurrentSessionId(latest.id);
          const sessionRes = await fetch(`/api/chat-sessions/${latest.id}`);
          if (sessionRes.ok) {
            const sessionJson = await sessionRes.json();
            const msgs = (sessionJson.data?.messages ?? []) as ChatMessage[];
            setMessages(msgs);
          }
        } else {
          // Fallback: load from localStorage (migration path)
          const saved = loadLocalMessages();
          if (saved.length > 0) {
            setMessages(saved);
          }
        }
      } catch {
        // API unavailable — fall back to localStorage
        const saved = loadLocalMessages();
        if (saved.length > 0) {
          setMessages(saved);
        }
      } finally {
        setSessionsLoaded(true);
      }
    }

    init();
  }, []);

  // Persist to DB (debounced) + localStorage fallback on change
  useEffect(() => {
    if (!initialized.current) return;
    saveLocalMessages(messages);
    if (currentSessionId && messages.length > 0) {
      debouncedSave(currentSessionId, messages);
    }
  }, [messages, currentSessionId, debouncedSave]);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // Auto-title: set session title from first user message
  const autoTitle = useCallback(
    async (sessionId: string, firstUserMessage: string) => {
      const title =
        firstUserMessage.length > 40
          ? firstUserMessage.slice(0, 40) + "..."
          : firstUserMessage;
      try {
        await fetch(`/api/chat-sessions/${sessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
        );
      } catch {
        // ignore
      }
    },
    []
  );

  const createNewSession = useCallback(async () => {
    setMessages([]);
    flightsRef.current = [];
    bookingRef.current = null;
    setError(null);

    try {
      const res = await fetch("/api/chat-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New booking" }),
      });
      if (res.ok) {
        const json = await res.json();
        const newSession = json.data as ChatSession;
        setCurrentSessionId(newSession.id);
        setSessions((prev) => [newSession, ...prev]);
      }
    } catch {
      // Fall back to local-only mode
      setCurrentSessionId(null);
    }
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const selectSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setError(null);
    flightsRef.current = [];
    bookingRef.current = null;

    try {
      const res = await fetch(`/api/chat-sessions/${sessionId}`);
      if (res.ok) {
        const json = await res.json();
        const msgs = (json.data?.messages ?? []) as ChatMessage[];
        setMessages(msgs);
        return;
      }
    } catch {
      // ignore
    }
    setMessages([]);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      // If no current session, create one
      let sessionId = currentSessionId;
      if (!sessionId) {
        try {
          const res = await fetch("/api/chat-sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "New booking" }),
          });
          if (res.ok) {
            const json = await res.json();
            const newSession = json.data as ChatSession;
            sessionId = newSession.id;
            setCurrentSessionId(newSession.id);
            setSessions((prev) => [newSession, ...prev]);
          }
        } catch {
          // continue without session
        }
      }

      const userMsg = createMessage("user", content);
      addMessage(userMsg);
      setIsLoading(true);
      setError(null);

      // Auto-title from first user message if this is the first message
      if (sessionId && messagesRef.current.length === 0) {
        autoTitle(sessionId, content);
      }

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
    [addMessage, currentSessionId, autoTitle]
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

        // Link booking to session
        if (currentSessionId && json.data?.bookingId) {
          fetch(`/api/chat-sessions/${currentSessionId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ booking_id: json.data.bookingId }),
          }).catch(() => {});
        }

        bookingRef.current = null;
      } catch {
        const errorMsg = "Network error. Check your connection and try again.";
        setError(errorMsg);
        addMessage(createMessage("assistant", errorMsg));
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage, currentSessionId]
  );

  return {
    messages,
    isLoading,
    error,
    sessions,
    currentSessionId,
    sessionsLoaded,
    sendMessage,
    selectFlight,
    confirmBooking,
    clearChat: createNewSession,
    selectSession,
  };
}
