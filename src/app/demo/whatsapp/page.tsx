"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Phone, Video, MoreVertical, Send, CheckCheck, Plane, ShieldCheck, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ChatMessage {
  id: string;
  from: "user" | "bot";
  text: string;
  time: string;
  flights?: DemoFlightCard[];
  booking?: {
    booking_id: string;
    status: string;
    pnr: string | null;
    message: string;
  };
}

interface DemoFlightCard {
  offer_id: string;
  airline: string;
  airlineCode: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: string;
  stops: number;
  cabin: string;
  price: number;
  currency: string;
  compliant: boolean;
  violations: string[];
  seatsLeft?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SessionCtx = any;

const STARTER_SUGGESTIONS = [
  "Book BLR to DEL next Monday",
  "Find flights to Mumbai tomorrow",
  "Need a business class ticket to Chennai",
];

function timeNow(): string {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function createId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function WhatsAppDemoPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<DemoFlightCard | null>(null);
  const [sessionCtx, setSessionCtx] = useState<SessionCtx>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([
        {
          id: createId(),
          from: "bot",
          text: "Hi! I'm SkySwift AI, your company's travel assistant.\n\nI can search and book flights that comply with your corporate travel policy.\n\nTry saying: \"Book BLR to DEL next Monday\"",
          time: timeNow(),
        },
      ]);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = text || input.trim();
      if (!msg || loading) return;

      setInput("");

      const userMsg: ChatMessage = {
        id: createId(),
        from: "user",
        text: msg,
        time: timeNow(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const res = await fetch("/api/demo/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: msg,
            selected_offer: selectedOffer ?? undefined,
            session_context: sessionCtx,
          }),
        });

        const json = await res.json();
        const data = json.data;

        const botMsg: ChatMessage = {
          id: createId(),
          from: "bot",
          text: data?.message ?? "Sorry, I didn't understand that. Could you rephrase?",
          time: timeNow(),
          flights: data?.flights,
          booking: data?.booking,
        };

        setMessages((prev) => [...prev, botMsg]);

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
            from: "bot",
            text: "Something went wrong. Please try again.",
            time: timeNow(),
          },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, loading, selectedOffer, sessionCtx]
  );

  function handleSelectFlight(flight: DemoFlightCard) {
    setSelectedOffer(flight);
    const policyNote = !flight.compliant
      ? `\n\n⚠️ Policy violations:\n${flight.violations.map((v) => `• ${v}`).join("\n")}\n\nThis will require manager approval.`
      : "";
    const confirmMsg: ChatMessage = {
      id: createId(),
      from: "bot",
      text: `Selected: ${flight.airline} ${flight.origin}→${flight.destination}\nDeparts: ${flight.departure} · ${flight.stops === 0 ? "Direct" : `${flight.stops} stop`}\nPrice: ₹${flight.price.toLocaleString("en-IN")}${policyNote}\n\nReply "confirm" to book or "change" to see other options.`,
      time: timeNow(),
    };
    setMessages((prev) => [...prev, confirmMsg]);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111b21] p-4">
      {/* Phone Frame */}
      <div className="relative flex w-full max-w-[420px] flex-col overflow-hidden rounded-[2rem] border-[3px] border-gray-700/50 bg-[#111b21] shadow-2xl shadow-black/40" style={{ height: "min(90vh, 820px)" }}>
        {/* Status Bar (phone-like) */}
        <div className="flex items-center justify-between bg-[#1f2c34] px-5 py-1.5 text-[11px] text-gray-400">
          <span>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
          <div className="flex gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21l-1.33-1.2C5.6 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.6 6.86-8.67 11.3L12 21z" opacity="0.3" /></svg>
            <span>92%</span>
          </div>
        </div>

        {/* WhatsApp Header */}
        <div className="flex items-center gap-3 bg-[#1f2c34] px-3 py-2">
          <button
            onClick={() => router.push("/demo")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-100">SkySwift AI</p>
            <p className="text-[11px] text-green-400">online</p>
          </div>
          <div className="flex gap-4 text-gray-400">
            <Video className="h-5 w-5" />
            <Phone className="h-5 w-5" />
            <MoreVertical className="h-5 w-5" />
          </div>
        </div>

        {/* Chat Area */}
        <div
          className="flex-1 overflow-y-auto px-3 py-3"
          style={{
            backgroundColor: "#0b141a",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          <div className="space-y-1.5">
            {/* Date chip */}
            <div className="flex justify-center py-2">
              <span className="rounded-lg bg-[#1d2b36] px-3 py-1 text-[11px] text-gray-400">Today</span>
            </div>

            {messages.map((msg) => (
              <div key={msg.id}>
                {/* Chat bubble */}
                <div className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`relative max-w-[85%] rounded-lg px-2.5 pb-1 pt-1.5 text-[13.5px] leading-[1.35] shadow-sm ${
                      msg.from === "user"
                        ? "rounded-tr-none bg-[#005c4b] text-gray-100"
                        : "rounded-tl-none bg-[#1f2c34] text-gray-200"
                    }`}
                  >
                    {/* Tail */}
                    <div
                      className={`absolute top-0 h-3 w-3 ${
                        msg.from === "user"
                          ? "-right-1.5 bg-[#005c4b]"
                          : "-left-1.5 bg-[#1f2c34]"
                      }`}
                      style={{
                        clipPath: msg.from === "user"
                          ? "polygon(0 0, 100% 0, 0 100%)"
                          : "polygon(100% 0, 0 0, 100% 100%)",
                      }}
                    />
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <div className="mt-0.5 flex items-center justify-end gap-1">
                      <span className="text-[10px] text-gray-400">{msg.time}</span>
                      {msg.from === "user" && <CheckCheck className="h-3.5 w-3.5 text-blue-400" />}
                    </div>
                  </div>
                </div>

                {/* Flight cards */}
                {msg.flights && msg.flights.length > 0 && (
                  <div className="mt-1.5 space-y-1.5 pl-1">
                    {msg.flights.map((flight, idx) => (
                      <button
                        key={flight.offer_id}
                        onClick={() => handleSelectFlight(flight)}
                        className={`w-full rounded-xl border p-3 text-left transition-all hover:scale-[1.01] ${
                          flight.compliant
                            ? "border-[#2a3942] bg-[#1a2730] hover:bg-[#1f2e38]"
                            : "border-yellow-700/40 bg-yellow-900/20 hover:bg-yellow-900/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/20 text-[10px] font-bold text-blue-400">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-gray-200">
                                {flight.airline} · {flight.origin}→{flight.destination}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                {flight.departure}→{flight.arrival} · {flight.stops === 0 ? "Direct" : `${flight.stops} stop`} · {flight.duration}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-gray-200">
                              ₹{flight.price.toLocaleString("en-IN")}
                            </p>
                            {flight.compliant ? (
                              <span className="flex items-center justify-end gap-0.5 text-[9px] text-green-400">
                                <ShieldCheck className="h-2.5 w-2.5" /> In Policy
                              </span>
                            ) : (
                              <span className="flex items-center justify-end gap-0.5 text-[9px] text-yellow-400">
                                <AlertTriangle className="h-2.5 w-2.5" /> Out of Policy
                              </span>
                            )}
                          </div>
                        </div>
                        {!flight.compliant && flight.violations.length > 0 && (
                          <div className="mt-1.5 border-t border-yellow-700/30 pt-1.5">
                            {flight.violations.map((v, i) => (
                              <p key={i} className="text-[10px] text-yellow-400/80">• {v}</p>
                            ))}
                          </div>
                        )}
                        {flight.seatsLeft && (
                          <p className="mt-1 text-[10px] text-orange-400">{flight.seatsLeft} seats left</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Booking confirmation */}
                {msg.booking && (
                  <div className="ml-1 mt-1.5">
                    <div className="rounded-xl border border-green-700/40 bg-green-900/20 p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <ShieldCheck className="h-4 w-4 text-green-400" />
                        <span className="text-xs font-semibold text-green-300">
                          {msg.booking.status === "pending_approval"
                            ? "Sent for Approval"
                            : "Booking Confirmed"}
                        </span>
                      </div>
                      {msg.booking.pnr && (
                        <p className="text-[11px] text-green-300/80">
                          PNR: <span className="font-mono font-bold text-green-200">{msg.booking.pnr}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-green-300/80">{msg.booking.message}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg rounded-tl-none bg-[#1f2c34] px-4 py-2.5 shadow-sm">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Starter suggestions */}
        {messages.length <= 1 && !loading && (
          <div className="flex gap-1.5 overflow-x-auto bg-[#111b21] px-3 py-2">
            {STARTER_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="shrink-0 rounded-full border border-[#2a3942] bg-[#1a2730] px-3 py-1.5 text-xs text-blue-300 hover:bg-[#1f2e38] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-center gap-2 bg-[#1f2c34] px-3 py-2">
          <div className="flex flex-1 items-center rounded-full bg-[#2a3942] px-4">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message"
              disabled={loading}
              className="h-10 flex-1 bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-500"
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] text-white disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Floating back button (desktop) */}
      <button
        onClick={() => router.push("/demo")}
        className="fixed left-6 top-6 hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 backdrop-blur-xl hover:bg-white/10 transition-colors lg:flex"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Demo
      </button>

      {/* Floating info (desktop) */}
      <div className="fixed right-6 top-6 hidden max-w-xs rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-gray-400 backdrop-blur-xl lg:block">
        <h3 className="mb-2 font-semibold text-gray-200">WhatsApp Demo</h3>
        <p className="mb-3 text-xs leading-relaxed">
          This is exactly how employees interact with SkySwift via WhatsApp.
          The AI parses natural language, searches real airline inventory,
          checks company policy, and books — all in chat.
        </p>
        <div className="space-y-1.5 text-xs">
          <p className="text-gray-500">Try these flows:</p>
          <p>1. <span className="text-green-400">Book BLR to DEL Monday</span> — happy path</p>
          <p>2. <span className="text-yellow-400">Business class to Mumbai</span> — policy violation</p>
          <p>3. <span className="text-blue-400">Find cheapest flight to Chennai</span> — price comparison</p>
        </div>
      </div>
    </div>
  );
}
