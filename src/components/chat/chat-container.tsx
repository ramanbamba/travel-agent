"use client";

import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { WelcomeScreen } from "./welcome-screen";

export function ChatContainer() {
  const {
    messages,
    isLoading,
    sendMessage,
    selectFlight,
    confirmBooking,
    clearChat,
  } = useChatMessages();

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Chat header with New Booking button */}
      {hasMessages && (
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
          <span className="text-sm text-muted-foreground">Booking chat</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            New booking
          </Button>
        </div>
      )}

      {hasMessages ? (
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          onSelectFlight={selectFlight}
          onConfirmBooking={confirmBooking}
        />
      ) : (
        <WelcomeScreen onSuggestedPrompt={sendMessage} />
      )}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
