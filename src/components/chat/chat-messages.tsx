"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/chat";
import { ChatBubble } from "./chat-bubble";
import { TypingIndicator } from "./typing-indicator";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto max-w-3xl py-4">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            onSelectFlight={onSelectFlight}
            onConfirmBooking={onConfirmBooking}
          />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
