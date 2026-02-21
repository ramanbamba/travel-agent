"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
        <p className="mb-2 text-[13px]">Found 3 flights within <strong>Acme Corp</strong> policy:</p>
        <div className="space-y-1.5">
          <div className="rounded-md border border-green-300/40 bg-green-50/80 p-1.5 text-[11px]">
            <span className="font-semibold text-green-700">1. IndiGo 6E-234</span>
            <br />06:15 → 09:00 · Direct · ₹4,850
            <br /><span className="font-medium text-green-600">RECOMMENDED</span>
          </div>
          <div className="rounded-md border border-gray-200 bg-gray-50/50 p-1.5 text-[11px]">
            <span className="font-medium">2. Air India AI-505</span>
            <br />08:30 → 11:15 · Direct · ₹5,200
          </div>
          <div className="rounded-md border border-gray-200 bg-gray-50/50 p-1.5 text-[11px]">
            <span className="font-medium">3. Vistara UK-812</span>
            <br />07:00 → 09:45 · Direct · ₹5,680
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-gray-500">Reply 1-3 to book ✨</p>
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
      <div className="text-[13px]">
        <p>✅ <strong>Booked!</strong></p>
        <p className="mt-1 text-[11px]">
          IndiGo 6E-234 · Mon, Feb 23
          <br />BLR → DEL · 06:15 - 09:00
          <br />PNR: <strong>SKY7X2M</strong>
        </p>
        <p className="mt-1.5 text-[11px] text-gray-500">
          📧 E-ticket sent · 🧾 GST captured
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
          className="h-[6px] w-[6px] rounded-full bg-gray-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
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
    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-gray-400">
      {time}
      <svg width="13" height="9" viewBox="0 0 16 11" fill="none" className="text-blue-500">
        <path d="M1 5.5L4.5 9L11 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 5.5L8.5 9L15 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

      // Show typing before bot messages
      if (msg.from === "bot") {
        setShowTyping(true);
        await sleep(1200);
        setShowTyping(false);
      }

      await sleep(msg.delay);
      setVisibleMessages((prev) => [...prev, msg.id]);
    }

    // Pause on final state
    await sleep(3000);

    // Fade out and restart
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
    <div className="relative mx-auto w-full max-w-[320px] lg:max-w-[340px]">
      {/* Phone shadow */}
      <div className="absolute -bottom-6 left-1/2 h-8 w-[85%] -translate-x-1/2 rounded-[50%] bg-black/20 blur-2xl" />

      {/* Phone frame */}
      <div
        className="relative overflow-hidden rounded-[36px] border-[3px] border-gray-800 bg-black shadow-2xl lg:[transform:perspective(1200px)_rotateY(-3deg)]"
      >
        {/* Status bar */}
        <div className="flex items-center justify-between bg-[#075e54] px-5 pb-0.5 pt-3">
          <span className="text-[11px] font-medium text-white/90">{currentTime}</span>
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-sm border border-white/60">
              <div className="mt-0.5 mx-auto h-1 w-1.5 bg-white/60" />
            </div>
          </div>
        </div>

        {/* WhatsApp header */}
        <div className="flex items-center gap-3 bg-[#075e54] px-4 pb-3 pt-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-medium text-white">SkySwift AI</p>
            <p className="text-[11px] text-green-200">online</p>
          </div>
        </div>

        {/* Chat area */}
        <div
          className="relative space-y-2 bg-[#e5ddd5] px-3 py-3"
          style={{
            minHeight: 360,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8c3bb' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        >
          <AnimatePresence>
            {MESSAGES.filter((m) => visibleMessages.includes(m.id)).map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[82%] rounded-lg px-2.5 py-1.5 shadow-sm ${
                    msg.from === "user"
                      ? "rounded-tr-none bg-[#dcf8c6] text-gray-900"
                      : "rounded-tl-none bg-white text-gray-800"
                  }`}
                >
                  <div className="text-[13px] leading-relaxed">{msg.content}</div>
                  <div className="mt-0.5 flex justify-end">
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="rounded-lg rounded-tl-none bg-white px-3 py-2 shadow-sm">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 bg-[#f0f0f0] px-3 py-2">
          <div className="flex-1 rounded-full bg-white px-4 py-2 text-[12px] text-gray-400">
            Type a message
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#075e54]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
