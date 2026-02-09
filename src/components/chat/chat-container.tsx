"use client";

import { PlusCircle, History } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { WelcomeScreen } from "./welcome-screen";
import { ChatSessionsList } from "./chat-sessions-list";
import { cn } from "@/lib/utils";

export function ChatContainer() {
  const {
    messages,
    isLoading,
    sessions,
    currentSessionId,
    sessionsLoaded,
    sendMessage,
    selectFlight,
    confirmBooking,
    clearChat,
    selectSession,
  } = useChatMessages();

  const [showSessions, setShowSessions] = useState(false);
  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full">
      {/* Sessions sidebar — toggled on mobile, always visible on lg+ if sessions exist */}
      {sessionsLoaded && sessions.length > 0 && (
        <div
          className={cn(
            "shrink-0 border-r border-white/5 transition-all",
            showSessions ? "w-56" : "w-0 overflow-hidden lg:w-56"
          )}
        >
          <div className="flex h-full w-56 flex-col">
            <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">
                History
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <PlusCircle className="h-3 w-3" />
                New
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <ChatSessionsList
                sessions={sessions}
                currentSessionId={currentSessionId}
                onSelect={(id) => {
                  selectSession(id);
                  setShowSessions(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Chat header */}
        {hasMessages && (
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
            <div className="flex items-center gap-2">
              {sessions.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 lg:hidden"
                  onClick={() => setShowSessions(!showSessions)}
                  aria-label={showSessions ? "Hide chat history" : "Show chat history"}
                  aria-expanded={showSessions}
                >
                  <History className="h-3.5 w-3.5" />
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Booking chat
              </span>
            </div>
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
    </div>
  );
}
