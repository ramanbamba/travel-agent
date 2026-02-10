"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/chat";
import { ChatBubble } from "./chat-bubble";
import { TypingIndicator } from "./typing-indicator";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSelectFlight?: (flightId: string) => void;
  onConfirmBooking?: (bookingId: string, paymentMethodId?: string) => void;
}

export function ChatMessages({
  messages,
  isLoading,
  onSelectFlight,
  onConfirmBooking,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      <div className="mx-auto max-w-3xl py-4">
        {messages.map((msg, i) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            index={i}
            onSelectFlight={onSelectFlight}
            onConfirmBooking={onConfirmBooking}
          />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
