"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  from: "user" | "bot";
  text: string;
  timestamp: Date;
}

interface SessionState {
  state: string;
  verified: boolean;
  org_id: string | null;
  member_id: string | null;
  context: Record<string, unknown>;
}

const DEMO_PHONE = "+919999999999";

const QUICK_MESSAGES = [
  "Hi",
  "raman@acmetech.com",
  "Book BLR to DEL Monday morning",
  "1",
  "Yes",
  "My bookings",
  "Help",
  "Can I book business class?",
];

export default function WhatsAppSimulatorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<SessionState | null>(null);
  const [phone, setPhone] = useState(DEMO_PHONE);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText) return;

    setInput("");
    setLoading(true);

    // Add user message
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      from: "user",
      text: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/whatsapp/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, text: messageText }),
      });

      const result = await res.json();

      if (result.data?.responses) {
        const botMessages: Message[] = result.data.responses.map(
          (text: string, i: number) => ({
            id: `bot_${Date.now()}_${i}`,
            from: "bot" as const,
            text,
            timestamp: new Date(),
          })
        );
        setMessages((prev) => [...prev, ...botMessages]);
      }

      if (result.data?.session) {
        setSession(result.data.session);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          from: "bot" as const,
          text: "[Error: Failed to reach simulator API]",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setSession(null);
  }

  // Only accessible in development
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Simulator is only available in development mode.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Chat Panel */}
      <div className="mx-auto flex w-full max-w-md flex-col" style={{ height: "100dvh" }}>
        {/* Header */}
        <div className="bg-[#075e54] px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">SkySwift AI</p>
                <p className="text-xs text-green-200">WhatsApp Simulator</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="rounded px-2 py-1 text-xs text-green-200 hover:bg-white/10"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto bg-[#ece5dd] px-3 py-4 dark:bg-gray-800"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        >
          {messages.length === 0 && (
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              <p className="mb-4">Send a message to start the conversation.</p>
              <p>Try these:</p>
            </div>
          )}

          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                    msg.from === "user"
                      ? "rounded-tr-none bg-[#dcf8c6] text-gray-900 dark:bg-green-900 dark:text-green-100"
                      : "rounded-tl-none bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {msg.text}
                  <span className="ml-2 text-[10px] text-gray-400">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg rounded-tl-none bg-white px-4 py-2 text-sm shadow-sm dark:bg-gray-700">
                  <span className="animate-pulse text-gray-400">typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Messages */}
        <div className="flex gap-1.5 overflow-x-auto bg-gray-50 px-3 py-2 dark:bg-gray-850">
          {QUICK_MESSAGES.map((msg) => (
            <button
              key={msg}
              onClick={() => sendMessage(msg)}
              disabled={loading}
              className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
            >
              {msg}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 dark:bg-gray-850">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#075e54] text-white disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Session Debug Panel */}
      <div className="hidden w-80 border-l border-gray-200 bg-white p-4 lg:block dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Session State</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Phone:</span>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-36 rounded border border-gray-200 px-2 py-0.5 text-right text-xs dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
          {session && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">State:</span>
                <span className={`font-mono font-medium ${
                  session.state === "idle" ? "text-green-600" :
                  session.state === "selecting" ? "text-blue-600" :
                  session.state === "confirming" ? "text-orange-600" :
                  "text-gray-600"
                }`}>{session.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Verified:</span>
                <span className={session.verified ? "text-green-600" : "text-red-500"}>
                  {session.verified ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Org ID:</span>
                <span className="font-mono text-gray-600 dark:text-gray-400">
                  {session.org_id ? session.org_id.slice(0, 8) + "..." : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Member ID:</span>
                <span className="font-mono text-gray-600 dark:text-gray-400">
                  {session.member_id ? session.member_id.slice(0, 8) + "..." : "—"}
                </span>
              </div>
              {Object.keys(session.context).length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-gray-500">Context:</p>
                  <pre className="max-h-60 overflow-auto rounded bg-gray-50 p-2 text-[10px] dark:bg-gray-900">
                    {JSON.stringify(session.context, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
          {!session && <p className="text-gray-400">Send a message to start a session.</p>}
        </div>
      </div>
    </div>
  );
}
