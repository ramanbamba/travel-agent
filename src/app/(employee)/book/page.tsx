"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Plane, ShieldCheck, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/corporate-dashboard";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  flights?: FlightResult[];
  booking?: BookingResult;
  timestamp: string;
}

interface FlightResult {
  offer_id: string;
  airline: string;
  airlineCode: string;
  departure: string;
  arrival: string;
  origin: string;
  destination: string;
  price: number;
  currency: string;
  stops: number;
  cabin: string;
  compliant: boolean;
  violations: string[];
}

interface BookingResult {
  booking_id: string;
  status: string;
  pnr: string | null;
  message: string;
}

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SessionCtx = any;

export default function EmployeeBookPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<FlightResult | null>(null);
  const [sessionCtx, setSessionCtx] = useState<SessionCtx>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add welcome message on mount
  useEffect(() => {
    setMessages([
      {
        id: createId(),
        role: "assistant",
        content:
          "Hi! I'm your travel assistant. Tell me where you need to go and I'll find the best flights within your company's policy.\n\nTry: \"Book a flight from BLR to DEL next Monday\"",
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = {
      id: createId(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/corp/employee/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          selected_offer: selectedOffer ?? undefined,
          session_context: sessionCtx,
        }),
      });

      const json = await res.json();
      const data = json.data;

      const assistantMsg: Message = {
        id: createId(),
        role: "assistant",
        content: data?.message ?? "Sorry, something went wrong. Please try again.",
        flights: data?.flights,
        booking: data?.booking,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data?.session_context) {
        setSessionCtx(data.session_context);
      }
      if (data?.booking) {
        setSelectedOffer(null);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: "Something went wrong. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, sending, selectedOffer, sessionCtx]);

  function handleSelectFlight(flight: FlightResult) {
    setSelectedOffer(flight);
    const confirmMsg: Message = {
      id: createId(),
      role: "assistant",
      content: `Selected: ${flight.airline} ${flight.origin}→${flight.destination} at ₹${Math.round(flight.price).toLocaleString("en-IN")}${
        !flight.compliant
          ? `\n\n⚠️ Policy violations:\n${flight.violations.map((v) => `• ${v}`).join("\n")}`
          : ""
      }\n\nType "confirm" to book or "change" to see other options.`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, confirmMsg]);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Plane className="h-4 w-4 text-blue-600" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl px-4 py-3 text-sm",
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-[#0F1B2D]"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>

              {/* Flight results */}
              {msg.flights && msg.flights.length > 0 && (
                <div className="ml-11 mt-3 space-y-2">
                  {msg.flights.map((flight, idx) => (
                    <FlightCard
                      key={flight.offer_id ?? idx}
                      flight={flight}
                      index={idx + 1}
                      onSelect={() => handleSelectFlight(flight)}
                    />
                  ))}
                </div>
              )}

              {/* Booking confirmation */}
              {msg.booking && (
                <div className="ml-11 mt-3">
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">
                        {msg.booking.status === "pending_approval"
                          ? "Sent for Approval"
                          : "Booking Confirmed"}
                      </span>
                    </div>
                    {msg.booking.pnr && (
                      <p className="text-sm text-green-700">
                        PNR: <span className="font-mono font-bold">{msg.booking.pnr}</span>
                      </p>
                    )}
                    <p className="text-sm text-green-700">{msg.booking.message}</p>
                    <StatusBadge status={msg.booking.status} className="mt-2" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <Plane className="h-4 w-4 text-blue-600" />
              </div>
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Where do you need to fly?"
            disabled={sending}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#0F1B2D] placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FlightCard({
  flight,
  index,
  onSelect,
}: {
  flight: FlightResult;
  index: number;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-3 transition-all hover:shadow-sm cursor-pointer",
        flight.compliant ? "border-gray-200" : "border-yellow-300 bg-yellow-50/50"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
            {index}
          </span>
          <div>
            <p className="text-sm font-semibold text-[#0F1B2D]">
              {flight.airline} · {flight.origin} → {flight.destination}
            </p>
            <p className="text-xs text-gray-500">
              {flight.departure} → {flight.arrival} · {flight.stops === 0 ? "Direct" : `${flight.stops} stop`} · {flight.cabin}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-[#0F1B2D]">
            ₹{Math.round(flight.price).toLocaleString("en-IN")}
          </p>
          {flight.compliant ? (
            <span className="flex items-center gap-0.5 text-[10px] text-green-600">
              <ShieldCheck className="h-3 w-3" /> In Policy
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-[10px] text-yellow-600">
              <AlertTriangle className="h-3 w-3" /> Out of Policy
            </span>
          )}
        </div>
      </div>

      {!flight.compliant && flight.violations.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {flight.violations.map((v, i) => (
            <p key={i} className="text-[11px] text-yellow-700">
              • {v}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
