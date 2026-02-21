"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  CheckCheck,
  Plane,
  ShieldCheck,
  AlertTriangle,
  Play,
  Pause,
  Phone,
  Video,
  MoreVertical,
  Hash,
  Smile,
  Plus,
  Paperclip,
  AtSign,
  MoreHorizontal,
  Bookmark,
  MessageSquare,
} from "lucide-react";
import type { DemoFlight } from "@/lib/demo/mock-flights";

// ── Types ──

interface ChatMessage {
  id: string;
  from: "user" | "bot";
  text: string;
  time: string;
  flights?: DemoFlight[];
  booking?: {
    booking_id: string;
    status: string;
    pnr: string | null;
    message: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SessionCtx = any;

type Platform = "whatsapp" | "slack" | "teams";

// ── Helpers ──

function timeNow(): string {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function timeNow12(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function createId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function findTopPick(flights: DemoFlight[]): number {
  let bestIdx = 0;
  let bestScore = -1;
  for (let i = 0; i < flights.length; i++) {
    const effective = flights[i].compliant ? flights[i].price * -1 + 100000 : flights[i].price * -1;
    if (effective > bestScore) {
      bestScore = effective;
      bestIdx = i;
    }
  }
  return bestIdx;
}

// ── Auto-play script ──

const AUTOPLAY_SCRIPT = [
  { delay: 1000, from: "user" as const, text: "Book me a flight to Delhi next Monday morning" },
  { delay: 3000, from: "bot" as const, text: "__search__" }, // triggers real API call
  { delay: 2000, from: "user" as const, text: "1" },
  { delay: 2000, from: "bot" as const, text: "__select__" },
  { delay: 1500, from: "user" as const, text: "confirm" },
  { delay: 2500, from: "bot" as const, text: "__confirm__" },
];

// ── Main Page ──

export default function ChannelsDemoPage() {
  const [platform, setPlatform] = useState<Platform>("whatsapp");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionCtx, setSessionCtx] = useState<SessionCtx>({});
  const [selectedOffer, setSelectedOffer] = useState<DemoFlight | null>(null);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const autoPlayRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Welcome message on platform switch
  useEffect(() => {
    setMessages([]);
    setSessionCtx({});
    setSelectedOffer(null);
    const timer = setTimeout(() => {
      setMessages([
        {
          id: createId(),
          from: "bot",
          text: "Hi! I'm SkySwift AI, your company's travel assistant.\n\nI can search and book flights that comply with your corporate travel policy.\n\nTry: \"Book BLR to DEL next Monday\"",
          time: platform === "whatsapp" ? timeNow() : timeNow12(),
        },
      ]);
    }, 300);
    return () => clearTimeout(timer);
  }, [platform]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = text || input.trim();
      if (!msg || loading) return;
      setInput("");

      const userMsg: ChatMessage = {
        id: createId(),
        from: "user",
        text: msg,
        time: platform === "whatsapp" ? timeNow() : timeNow12(),
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
          text: data?.message ?? "Sorry, I didn't understand that.",
          time: platform === "whatsapp" ? timeNow() : timeNow12(),
          flights: data?.flights,
          booking: data?.booking,
        };

        setMessages((prev) => [...prev, botMsg]);
        if (data?.session_context) setSessionCtx(data.session_context);
        if (data?.booking) setSelectedOffer(null);
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: createId(), from: "bot", text: "Something went wrong.", time: timeNow() },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, loading, selectedOffer, sessionCtx, platform]
  );

  function handleSelectFlight(flight: DemoFlight) {
    setSelectedOffer(flight);
    const policyNote = !flight.compliant
      ? `\n\n⚠️ Policy violations:\n${flight.violations.map((v) => `• ${v}`).join("\n")}\nThis will require manager approval.`
      : "";
    setMessages((prev) => [
      ...prev,
      {
        id: createId(),
        from: "bot",
        text: `Selected: ${flight.airline} ${flight.origin}→${flight.destination}\nDeparts: ${flight.departure} · ${flight.stops === 0 ? "Direct" : `${flight.stops} stop`}\nPrice: ₹${flight.price.toLocaleString("en-IN")}${policyNote}\n\nReply "confirm" to book.`,
        time: platform === "whatsapp" ? timeNow() : timeNow12(),
      },
    ]);
  }

  // Auto-play
  async function startAutoPlay() {
    setAutoPlaying(true);
    autoPlayRef.current = true;
    setMessages([]);
    setSessionCtx({});
    setSelectedOffer(null);

    await new Promise((r) => setTimeout(r, 500));

    // Send first user message
    if (!autoPlayRef.current) return;
    await new Promise((r) => setTimeout(r, AUTOPLAY_SCRIPT[0].delay));
    if (!autoPlayRef.current) return;

    // Step through: user types, bot responds via real API
    const steps = ["Book me a flight to Delhi next Monday morning", "1", "confirm"];
    for (const step of steps) {
      if (!autoPlayRef.current) break;

      // Add user message
      const userMsg: ChatMessage = {
        id: createId(),
        from: "user",
        text: step,
        time: platform === "whatsapp" ? timeNow() : timeNow12(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Wait before "typing"
      await new Promise((r) => setTimeout(r, 800));
      if (!autoPlayRef.current) break;
      setLoading(true);

      // Real API call
      try {
        const currentCtxRef = await new Promise<SessionCtx>((resolve) => {
          setSessionCtx((prev: SessionCtx) => {
            resolve(prev);
            return prev;
          });
        });

        const res = await fetch("/api/demo/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: step,
            session_context: currentCtxRef,
          }),
        });
        const json = await res.json();
        const data = json.data;

        if (!autoPlayRef.current) break;

        const botMsg: ChatMessage = {
          id: createId(),
          from: "bot",
          text: data?.message ?? "",
          time: platform === "whatsapp" ? timeNow() : timeNow12(),
          flights: data?.flights,
          booking: data?.booking,
        };
        setMessages((prev) => [...prev, botMsg]);
        if (data?.session_context) setSessionCtx(data.session_context);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }

      // Wait between steps
      await new Promise((r) => setTimeout(r, 2000));
    }

    setAutoPlaying(false);
    autoPlayRef.current = false;
  }

  function stopAutoPlay() {
    autoPlayRef.current = false;
    setAutoPlaying(false);
    setLoading(false);
  }

  // ── Platform Tabs ──

  const TABS: { id: Platform; label: string; color: string; icon: string }[] = [
    { id: "whatsapp", label: "WhatsApp", color: "bg-green-500", icon: "📱" },
    { id: "slack", label: "Slack", color: "bg-[#4A154B]", icon: "💬" },
    { id: "teams", label: "Microsoft Teams", color: "bg-[#464EB8]", icon: "🟣" },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      {/* Back + Title */}
      <div className="mb-6 flex w-full max-w-[480px] items-center justify-between pt-4">
        <button
          onClick={() => router.push("/demo")}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 backdrop-blur-xl hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <h1 className="text-sm font-semibold text-white">Cross-Platform Demo</h1>
        <button
          onClick={autoPlaying ? stopAutoPlay : startAutoPlay}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 backdrop-blur-xl hover:bg-white/10 transition-colors"
        >
          {autoPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {autoPlaying ? "Stop" : "Watch Demo"}
        </button>
      </div>

      {/* Platform Tabs */}
      <div className="mb-4 flex gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { if (!autoPlaying) setPlatform(tab.id); }}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
              platform === tab.id
                ? `${tab.color} text-white shadow-lg`
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chat Simulator */}
      <div className="w-full max-w-[480px]">
        {platform === "whatsapp" && (
          <WhatsAppTheme
            messages={messages}
            loading={loading}
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            onSelectFlight={handleSelectFlight}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
            disabled={autoPlaying}
          />
        )}
        {platform === "slack" && (
          <SlackTheme
            messages={messages}
            loading={loading}
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            onSelectFlight={handleSelectFlight}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
            disabled={autoPlaying}
          />
        )}
        {platform === "teams" && (
          <TeamsTheme
            messages={messages}
            loading={loading}
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            onSelectFlight={handleSelectFlight}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
            disabled={autoPlaying}
          />
        )}
      </div>
    </div>
  );
}

// ── Shared props ──

interface ThemeProps {
  messages: ChatMessage[];
  loading: boolean;
  input: string;
  setInput: (v: string) => void;
  sendMessage: (text?: string) => void;
  onSelectFlight: (flight: DemoFlight) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messagesEndRef: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputRef: any;
  disabled?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// WHATSAPP THEME
// ═══════════════════════════════════════════════════════════════════════════

function WhatsAppTheme({ messages, loading, input, setInput, sendMessage, onSelectFlight, messagesEndRef, inputRef, disabled }: ThemeProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[2rem] border-[3px] border-gray-700/50 bg-[#111b21] shadow-2xl" style={{ height: "min(75vh, 700px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 bg-[#1f2c34] px-3 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600">
          <Plane className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-100">SkySwift AI</p>
          <p className="text-[11px] text-green-400">online</p>
        </div>
        <div className="flex gap-3 text-gray-400">
          <Video className="h-4 w-4" />
          <Phone className="h-4 w-4" />
          <MoreVertical className="h-4 w-4" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3" style={{ backgroundColor: "#0b141a" }}>
        <div className="space-y-1.5">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`relative max-w-[85%] rounded-lg px-2.5 pb-1 pt-1.5 text-[13px] leading-[1.35] shadow-sm ${
                  msg.from === "user"
                    ? "rounded-tr-none bg-[#005c4b] text-gray-100"
                    : "rounded-tl-none bg-[#1f2c34] text-gray-200"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div className="mt-0.5 flex items-center justify-end gap-1">
                    <span className="text-[10px] text-gray-400">{msg.time}</span>
                    {msg.from === "user" && <CheckCheck className="h-3 w-3 text-blue-400" />}
                  </div>
                </div>
              </div>
              {/* Flight cards */}
              {msg.flights && msg.flights.length > 0 && (
                <div className="mt-1.5 space-y-1.5 pl-1">
                  {msg.flights.map((flight, idx) => {
                    const isTop = findTopPick(msg.flights!) === idx;
                    return (
                      <button key={flight.offer_id} onClick={() => onSelectFlight(flight)}
                        className={`w-full rounded-xl border p-2.5 text-left transition-all hover:scale-[1.01] ${
                          flight.compliant ? "border-[#2a3942] bg-[#1a2730]" : "border-yellow-700/40 bg-yellow-900/20"
                        }`}>
                        {isTop && <p className="mb-1 text-[10px] font-semibold text-blue-300">🏷️ RECOMMENDED</p>}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-gray-200">{flight.airline} · {flight.origin}→{flight.destination}</p>
                            <p className="text-[11px] text-gray-400">{flight.departure}→{flight.arrival} · {flight.stops === 0 ? "Direct" : `${flight.stops} stop`}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-gray-200">₹{flight.price.toLocaleString("en-IN")}</p>
                            {flight.compliant ? (
                              <span className="flex items-center justify-end gap-0.5 text-[9px] text-green-400"><ShieldCheck className="h-2.5 w-2.5" /> In Policy</span>
                            ) : (
                              <span className="flex items-center justify-end gap-0.5 text-[9px] text-yellow-400"><AlertTriangle className="h-2.5 w-2.5" /> Out of Policy</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {/* Booking */}
              {msg.booking && (
                <div className="ml-1 mt-1.5 rounded-xl border border-green-700/40 bg-green-900/20 p-3">
                  <div className="flex items-center gap-2 mb-1"><ShieldCheck className="h-4 w-4 text-green-400" />
                    <span className="text-xs font-semibold text-green-300">{msg.booking.status === "pending_approval" ? "Sent for Approval" : "Booking Confirmed"}</span>
                  </div>
                  {msg.booking.pnr && <p className="text-[11px] text-green-300/80">PNR: <span className="font-mono font-bold text-green-200">{msg.booking.pnr}</span></p>}
                  <p className="text-[11px] text-green-300/80">{msg.booking.message}</p>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg rounded-tl-none bg-[#1f2c34] px-4 py-2.5">
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

      {/* Input */}
      <div className="flex items-center gap-2 bg-[#1f2c34] px-3 py-2">
        <div className="flex flex-1 items-center rounded-full bg-[#2a3942] px-4">
          <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a message" disabled={loading || disabled}
            className="h-9 flex-1 bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-500" />
        </div>
        <button onClick={() => sendMessage()} disabled={loading || !input.trim() || disabled}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00a884] text-white disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SLACK THEME
// ═══════════════════════════════════════════════════════════════════════════

function SlackTheme({ messages, loading, input, setInput, sendMessage, onSelectFlight, messagesEndRef, inputRef, disabled }: ThemeProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-300 bg-white shadow-2xl" style={{ height: "min(75vh, 700px)", fontFamily: "Lato, -apple-system, sans-serif" }}>
      {/* Sidebar hint + channel header */}
      <div className="flex">
        {/* Purple sidebar sliver */}
        <div className="w-[52px] shrink-0 bg-[#4A154B] flex flex-col items-center pt-3 gap-3">
          <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-xs font-bold">A</div>
          <div className="h-0.5 w-6 bg-white/20 rounded" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-5 rounded bg-white/10" />
            <div className="h-5 w-5 rounded bg-white/10" />
            <div className="h-5 w-5 rounded bg-white/20" />
          </div>
        </div>
        {/* Channel header */}
        <div className="flex-1 flex items-center justify-between border-b border-gray-200 px-4 py-2.5 bg-white">
          <div className="flex items-center gap-1.5">
            <Hash className="h-4 w-4 text-gray-500" />
            <span className="text-[15px] font-bold text-gray-900">travel-bookings</span>
            <span className="text-xs text-gray-400 ml-2 hidden sm:inline">Book flights with AI</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Bookmark className="h-4 w-4" />
            <MoreVertical className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[52px] shrink-0 bg-[#4A154B]" />
        <div className="flex-1 overflow-y-auto px-5 py-4 bg-white">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id}>
                {/* Slack message */}
                <div className="flex gap-2.5 group relative">
                  {/* Avatar */}
                  <div className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${
                    msg.from === "bot" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-700"
                  }`}>
                    {msg.from === "bot" ? <Plane className="h-4 w-4" /> : "Y"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[15px] font-bold text-gray-900">
                        {msg.from === "bot" ? "SkySwift AI" : "You"}
                      </span>
                      {msg.from === "bot" && (
                        <span className="rounded bg-gray-200 px-1 py-0.5 text-[10px] font-medium text-gray-500 uppercase">APP</span>
                      )}
                      <span className="text-xs text-gray-400">{msg.time}</span>
                    </div>
                    <p className="text-[15px] leading-relaxed text-gray-800 whitespace-pre-wrap mt-0.5">{msg.text}</p>

                    {/* Hover actions */}
                    <div className="absolute -top-3 right-0 hidden group-hover:flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-1 py-0.5 shadow-sm">
                      <button className="p-1 rounded hover:bg-gray-100"><Smile className="h-3.5 w-3.5 text-gray-400" /></button>
                      <button className="p-1 rounded hover:bg-gray-100"><MessageSquare className="h-3.5 w-3.5 text-gray-400" /></button>
                      <button className="p-1 rounded hover:bg-gray-100"><Bookmark className="h-3.5 w-3.5 text-gray-400" /></button>
                      <button className="p-1 rounded hover:bg-gray-100"><MoreHorizontal className="h-3.5 w-3.5 text-gray-400" /></button>
                    </div>
                  </div>
                </div>

                {/* Flight cards — Slack attachment style */}
                {msg.flights && msg.flights.length > 0 && (
                  <div className="ml-[46px] mt-2 space-y-2">
                    {msg.flights.map((flight, idx) => {
                      const isTop = findTopPick(msg.flights!) === idx;
                      return (
                        <div key={flight.offer_id} className={`rounded-lg border-l-4 ${flight.compliant ? "border-l-blue-500" : "border-l-yellow-500"} border border-gray-200 bg-gray-50 p-3`}>
                          {isTop && <p className="mb-1.5 text-[11px] font-semibold text-blue-600">🏷️ Recommended</p>}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{flight.airline} · {flight.origin} → {flight.destination}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{flight.departure} – {flight.arrival} · {flight.duration} · {flight.stops === 0 ? "Direct" : `${flight.stops} stop`}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">₹{flight.price.toLocaleString("en-IN")}</p>
                              {flight.compliant ? (
                                <span className="text-[10px] text-green-600">✅ In policy</span>
                              ) : (
                                <span className="text-[10px] text-yellow-600">⚠️ Out of policy</span>
                              )}
                            </div>
                          </div>
                          {!flight.compliant && flight.violations.length > 0 && (
                            <div className="mt-1.5 text-[11px] text-yellow-700">{flight.violations.join(" · ")}</div>
                          )}
                          <button onClick={() => onSelectFlight(flight)}
                            className="mt-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            Book This
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Booking */}
                {msg.booking && (
                  <div className="ml-[46px] mt-2 rounded-lg border-l-4 border-l-green-500 border border-gray-200 bg-green-50 p-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">
                        {msg.booking.status === "pending_approval" ? "Sent for Approval" : "Booking Confirmed"}
                      </span>
                    </div>
                    {msg.booking.pnr && <p className="text-xs text-green-700 mt-1">PNR: <span className="font-mono font-bold">{msg.booking.pnr}</span></p>}
                    <p className="text-xs text-green-700 mt-0.5">{msg.booking.message}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Typing */}
            {loading && (
              <div className="flex gap-2.5">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-blue-600 flex items-center justify-center"><Plane className="h-4 w-4 text-white" /></div>
                <div className="flex items-center gap-1 pt-2">
                  <span className="text-xs text-gray-400 italic">SkySwift AI is typing</span>
                  <span className="flex gap-0.5 ml-1">
                    <span className="h-1 w-1 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1 w-1 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1 w-1 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="flex">
        <div className="w-[52px] shrink-0 bg-[#4A154B]" />
        <div className="flex-1 border-t border-gray-200 px-4 py-3 bg-white">
          <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5">
            <Plus className="h-4 w-4 text-gray-400 shrink-0" />
            <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Message #travel-bookings" disabled={loading || disabled}
              className="flex-1 text-[15px] text-gray-800 outline-none placeholder:text-gray-400 bg-transparent" />
            <div className="flex items-center gap-1.5 text-gray-400 shrink-0">
              <AtSign className="h-4 w-4" />
              <Smile className="h-4 w-4" />
              <button onClick={() => sendMessage()} disabled={loading || !input.trim() || disabled}
                className="flex h-7 w-7 items-center justify-center rounded bg-[#007a5a] text-white disabled:opacity-40">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEAMS THEME
// ═══════════════════════════════════════════════════════════════════════════

function TeamsTheme({ messages, loading, input, setInput, sendMessage, onSelectFlight, messagesEndRef, inputRef, disabled }: ThemeProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-300 bg-[#f5f5f5] shadow-2xl" style={{ height: "min(75vh, 700px)", fontFamily: "'Segoe UI', -apple-system, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between bg-[#464EB8] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
            <Plane className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">SkySwift AI</p>
            <p className="text-[11px] text-white/60">Bot</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-white/70">
          <Video className="h-4 w-4" />
          <Phone className="h-4 w-4" />
          <MoreHorizontal className="h-4 w-4" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#f5f5f5]">
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div className={`flex gap-2.5 ${msg.from === "user" ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${
                  msg.from === "bot" ? "bg-[#464EB8] text-white" : "bg-[#6264A7] text-white"
                }`}>
                  {msg.from === "bot" ? <Plane className="h-3.5 w-3.5" /> : "Y"}
                </div>
                <div className={`max-w-[80%] ${msg.from === "user" ? "text-right" : ""}`}>
                  <div className={`flex items-baseline gap-2 ${msg.from === "user" ? "justify-end" : ""}`}>
                    <span className="text-[13px] font-semibold text-gray-800">
                      {msg.from === "bot" ? "SkySwift AI" : "You"}
                    </span>
                    <span className="text-[11px] text-gray-400">{msg.time}</span>
                  </div>
                  <div className={`mt-1 rounded-lg px-3.5 py-2.5 text-[14px] leading-relaxed ${
                    msg.from === "user"
                      ? "bg-[#E8EBFA] text-gray-800 rounded-tr-sm"
                      : "bg-white text-gray-800 shadow-[0_1px_2px_rgba(0,0,0,0.1)] rounded-tl-sm"
                  }`}>
                    <p className="whitespace-pre-wrap text-left">{msg.text}</p>
                  </div>
                </div>
              </div>

              {/* Flight cards — Teams Adaptive Card style */}
              {msg.flights && msg.flights.length > 0 && (
                <div className="mt-2 space-y-2 ml-[42px]">
                  {msg.flights.map((flight, idx) => {
                    const isTop = findTopPick(msg.flights!) === idx;
                    return (
                      <div key={flight.offer_id} className="rounded-lg bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] overflow-hidden">
                        {/* Card accent bar */}
                        <div className={`h-1 ${flight.compliant ? "bg-[#464EB8]" : "bg-yellow-500"}`} />
                        <div className="p-3">
                          {isTop && <p className="mb-1.5 text-[11px] font-semibold text-[#464EB8]">🏷️ Recommended</p>}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[13px] font-semibold text-gray-900">{flight.airline} · {flight.origin} → {flight.destination}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{flight.departure} – {flight.arrival} · {flight.duration} · {flight.stops === 0 ? "Direct" : `${flight.stops} stop`}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[13px] font-bold text-gray-900">₹{flight.price.toLocaleString("en-IN")}</p>
                              {flight.compliant ? (
                                <span className="text-[10px] text-green-600">✅ In policy</span>
                              ) : (
                                <span className="text-[10px] text-yellow-600">⚠️ Out of policy</span>
                              )}
                            </div>
                          </div>
                          {!flight.compliant && flight.violations.length > 0 && (
                            <p className="mt-1.5 text-[11px] text-yellow-700">{flight.violations.join(" · ")}</p>
                          )}
                          <div className="mt-2.5 flex gap-2">
                            <button onClick={() => onSelectFlight(flight)}
                              className="rounded bg-[#464EB8] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#3b42a0] transition-colors">
                              Book This
                            </button>
                            <button className="rounded border border-gray-300 px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Booking */}
              {msg.booking && (
                <div className="ml-[42px] mt-2 rounded-lg bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] overflow-hidden">
                  <div className="h-1 bg-green-500" />
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      <span className="text-[13px] font-semibold text-green-800">
                        {msg.booking.status === "pending_approval" ? "Sent for Approval" : "Booking Confirmed"}
                      </span>
                    </div>
                    {msg.booking.pnr && <p className="text-xs text-green-700 mt-1">PNR: <span className="font-mono font-bold">{msg.booking.pnr}</span></p>}
                    <p className="text-xs text-green-700 mt-0.5">{msg.booking.message}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing */}
          {loading && (
            <div className="flex gap-2.5">
              <div className="h-8 w-8 shrink-0 rounded-full bg-[#464EB8] flex items-center justify-center"><Plane className="h-3.5 w-3.5 text-white" /></div>
              <div className="mt-1 rounded-lg bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 focus-within:border-[#464EB8]">
          <Paperclip className="h-4 w-4 text-gray-400 shrink-0" />
          <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a new message" disabled={loading || disabled}
            className="flex-1 text-[14px] text-gray-800 outline-none placeholder:text-gray-400 bg-transparent" />
          <div className="flex items-center gap-1.5 text-gray-400 shrink-0">
            <Smile className="h-4 w-4" />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim() || disabled}
              className="flex h-7 w-7 items-center justify-center rounded bg-[#464EB8] text-white disabled:opacity-40">
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
