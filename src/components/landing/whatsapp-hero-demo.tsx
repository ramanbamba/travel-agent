"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HoverTilt } from "./animations";

interface ChatMessage {
  id: number;
  from: "user" | "bot";
  content: React.ReactNode;
  delay: number;
}

const MESSAGES: ChatMessage[] = [
  {
    id: 1,
    from: "user",
    content: "Book me a flight to Delhi Monday morning",
    delay: 1000,
  },
  {
    id: 2,
    from: "bot",
    content: (
      <div>
        <p className="mb-2 text-[13px] text-slate-200">Found 3 flights within <strong className="text-white">Acme Corp</strong> policy:</p>
        <div className="space-y-1.5">
          <div className="rounded-md border border-green-500/30 bg-green-500/10 p-2 text-[11px] backdrop-blur-sm">
            <span className="font-semibold text-green-400">1. IndiGo 6E-234</span>
            <br /><span className="text-slate-300">06:15 → 09:00 · Direct · ₹4,850</span>
            <br /><span className="mt-1 block font-medium text-green-500 text-[10px] tracking-wider">RECOMMENDED</span>
          </div>
          <div className="rounded-md border border-white/5 bg-white/5 p-2 text-[11px] backdrop-blur-sm">
            <span className="font-medium text-slate-200">2. Air India AI-505</span>
            <br /><span className="text-slate-400">08:30 → 11:15 · Direct · ₹5,200</span>
          </div>
          <div className="rounded-md border border-white/5 bg-white/5 p-2 text-[11px] backdrop-blur-sm">
            <span className="font-medium text-slate-200">3. Vistara UK-812</span>
            <br /><span className="text-slate-400">07:00 → 09:45 · Direct · ₹5,680</span>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">Reply 1-3 to book ✨</p>
      </div>
    ),
    delay: 2000,
  },
  {
    id: 3,
    from: "user",
    content: "1",
    delay: 1200,
  },
  {
    id: 4,
    from: "bot",
    content: (
      <div className="text-[13px] text-slate-200">
        <p className="flex items-center gap-1.5"><span className="text-green-400">✅</span> <strong className="text-white">Booked!</strong></p>
        <div className="mt-2 rounded bg-black/20 p-2">
          <p className="text-[11px] text-slate-300">
            <span className="text-white">IndiGo 6E-234</span> · Mon, Feb 23
            <br />BLR → DEL · 06:15 - 09:00
            <br />PNR: <strong className="text-blue-400">SKY7X2M</strong>
          </p>
        </div>
        <p className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
          <span>📧 E-ticket sent</span>
          <span>🧾 GST captured</span>
        </p>
      </div>
    ),
    delay: 1500,
  },
];

function TypingIndicator() {
  return (
    <div className="flex gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-[6px] w-[6px] rounded-full bg-slate-400"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

function TimeStamp({ time }: { time: string }) {
  return (
    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] text-slate-400">
      {time}
      <svg width="13" height="9" viewBox="0 0 16 11" fill="none" className="text-blue-400">
        <path d="M1 5.5L4.5 9L11 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 5.5L8.5 9L15 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function WhatsAppHeroDemo() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [currentTime, setCurrentTime] = useState("9:41");

  const runSequence = useCallback(async () => {
    setVisibleMessages([]);
    setShowTyping(false);

    const times = ["9:41", "9:41", "9:42", "9:42"];

    for (let i = 0; i < MESSAGES.length; i++) {
      const msg = MESSAGES[i];
      setCurrentTime(times[i]);

      if (msg.from === "bot") {
        setShowTyping(true);
        await sleep(1200);
        setShowTyping(false);
      }

      await sleep(msg.delay);
      setVisibleMessages((prev) => [...prev, msg.id]);
    }

    await sleep(4000);
    setVisibleMessages([]);
    await sleep(800);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loop() {
      while (!cancelled) {
        await runSequence();
      }
    }

    loop();
    return () => { cancelled = true; };
  }, [runSequence]);

  return (
    <div className="relative mx-auto w-full max-w-[320px] lg:max-w-[340px] perspective-[1200px]">
      {/* Animated glowing auras behind the phone */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full rounded-full bg-blue-500/20 blur-[80px] animate-pulse-glow" />
      <div className="absolute top-1/4 -right-1/4 h-64 w-64 rounded-full bg-purple-500/20 blur-[60px] animate-aura-spin" />

      {/* Phone shadow */}
      <div className="absolute -bottom-8 left-1/2 h-8 w-[80%] -translate-x-1/2 rounded-[50%] bg-blue-900/30 blur-2xl" />

      <HoverTilt rotationRatio={10}>
        {/* Phone frame */}
        <div className="relative overflow-hidden rounded-[40px] border-[4px] border-[#1f2937] bg-[#0b141a] shadow-2xl ring-1 ring-white/10">

          {/* Glass glare effect */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 via-transparent to-transparent z-50 rounded-[36px]" />

          {/* Status bar */}
          <div className="flex items-center justify-between bg-[#111b21] px-6 pb-1 pt-3">
            <span className="text-[11px] font-medium text-slate-300">{currentTime}</span>
            <div className="flex items-center gap-1.5 opacity-80">
              {/* Cellular */}
              <svg width="12" height="10" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect y="8" width="3" height="4" rx="1" fill="#cbd5e1" />
                <rect x="4" y="6" width="3" height="6" rx="1" fill="#cbd5e1" />
                <rect x="8" y="3" width="3" height="9" rx="1" fill="#cbd5e1" />
                <rect x="12" width="3" height="12" rx="1" fill="#cbd5e1" />
              </svg>
              {/* Wifi */}
              <svg width="12" height="10" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12C9.43144 12 10.7418 11.4886 11.7574 10.6387L8 4.3193L4.24264 10.6387C5.2582 11.4886 6.56856 12 8 12Z" fill="#cbd5e1" />
                <path d="M14.0711 7.2132C12.5188 5.66089 10.3662 4.7 8 4.7C5.6338 4.7 3.48123 5.66089 1.92893 7.2132L0 3.96645C2.08055 1.8859 4.88725 0.5 8 0.5C11.1127 0.5 13.9194 1.8859 16 3.96645L14.0711 7.2132Z" fill="#cbd5e1" />
              </svg>
              {/* Battery */}
              <div className="h-2.5 w-5 rounded-sm border border-slate-300 p-0.5 flex items-center">
                <div className="h-full w-[80%] bg-slate-200 rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* WhatsApp Dark header */}
          <div className="flex items-center gap-3 bg-[#202c33] px-4 pb-3 pt-2">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-inner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#202c33] bg-[#00a884]" />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-[#e9edef]">SkySwift AI</p>
              <p className="text-[12px] text-[#8696a0]">online</p>
            </div>
            <div className="flex gap-4 text-[#aebac1]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            </div>
          </div>

          {/* Chat area */}
          <div
            className="relative flex flex-col justify-end overflow-hidden px-3 py-4 h-[520px]"
            style={{
              backgroundColor: "#0b141a",
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10h1v1h-1zM30 30h1v1h-1zM50 80h1v1h-1zM70 20h1v1h-1zM90 60h1v1h-1z' fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E\")",
            }}
          >
            <div className="absolute top-4 left-0 w-full flex justify-center z-10">
              <div className="bg-[#182229] px-3 py-1 rounded-lg text-[10px] text-[#8696a0] shadow-sm uppercase tracking-wider">Today</div>
            </div>

            <div className="flex flex-col space-y-3 z-20 mt-8">
              <AnimatePresence>
                {MESSAGES.filter((m) => visibleMessages.includes(m.id)).map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`relative max-w-[85%] rounded-xl px-3 py-2 shadow-sm ${msg.from === "user"
                        ? "rounded-tr-none bg-[#005c4b] text-[#e9edef]" // WhatsApp dark user bubble
                        : "rounded-tl-none bg-[#202c33] text-[#e9edef]" // WhatsApp dark bot bubble
                        }`}
                    >
                      <div className="text-[13.5px] leading-relaxed">{msg.content}</div>
                      <div className="mt-1 flex justify-end">
                        <TimeStamp time={currentTime} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              <AnimatePresence>
                {showTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex justify-start pt-1"
                  >
                    <div className="rounded-xl rounded-tl-none bg-[#202c33] px-3 py-2 shadow-sm inline-flex items-center h-8">
                      <TypingIndicator />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Input bar */}
          <div className="flex items-center gap-2 bg-[#202c33] px-3 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center text-[#8696a0]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
            </div>
            <div className="flex-1 rounded-full bg-[#2a3942] px-4 py-2 text-[13px] text-[#8696a0]">
              Message
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] shadow-md shadow-green-900/20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </div>
          </div>
        </div>
      </HoverTilt>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
