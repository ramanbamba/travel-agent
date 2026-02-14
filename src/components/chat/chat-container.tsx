"use client";

import { PlusCircle, History } from "lucide-react";
import { useState, useEffect } from "react";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { WelcomeScreen, type QuickAction } from "./welcome-screen";
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
    confirmBookingRazorpay,
    clearChat,
    selectSession,
  } = useChatMessages();

  const [showSessions, setShowSessions] = useState(false);
  const [stats, setStats] = useState<{ totalBookings: number; routesLearned: number } | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [patternGreeting, setPatternGreeting] = useState("");
  const [returningLoading, setReturningLoading] = useState(true);
  const hasMessages = messages.length > 0;

  // Load stats + returning user data in parallel
  useEffect(() => {
    fetch("/api/chat/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.data) setStats(json.data);
      })
      .catch(() => {});

    fetch("/api/chat/returning-user")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.data?.isReturning) {
          setQuickActions(json.data.quickActions ?? []);
          setPatternGreeting(json.data.greeting ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setReturningLoading(false));
  }, []);

  return (
    <div className="flex h-full">
      {/* Sessions sidebar */}
      {sessionsLoaded && sessions.length > 0 && (
        <div
          className={cn(
            "shrink-0 transition-all duration-300 ease-expo-out",
            "border-r border-[var(--glass-border)]",
            "bg-[var(--glass-subtle)]",
            "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
            showSessions ? "w-56" : "w-0 overflow-hidden lg:w-56"
          )}
        >
          <div className="flex h-full w-56 flex-col">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-3 py-2.5">
              <span className="text-xs font-semibold text-[var(--glass-text-tertiary)] uppercase tracking-wider">
                History
              </span>
              <button
                onClick={clearChat}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2 py-1",
                  "text-xs font-medium text-[var(--glass-text-tertiary)]",
                  "transition-colors duration-200",
                  "hover:bg-[var(--glass-subtle)] hover:text-[var(--glass-text-primary)]"
                )}
              >
                <PlusCircle className="h-3 w-3" />
                New
              </button>
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
      <div className="flex flex-1 flex-col min-w-0">
        {/* Chat header */}
        {hasMessages && (
          <div
            className={cn(
              "flex shrink-0 items-center justify-between px-4 py-2.5",
              "border-b border-[var(--glass-border)]",
              "bg-[var(--glass-elevated)]",
              "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]"
            )}
          >
            <div className="flex items-center gap-2">
              {sessions.length > 0 && (
                <button
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg lg:hidden",
                    "text-[var(--glass-text-tertiary)]",
                    "transition-colors duration-200",
                    "hover:bg-[var(--glass-subtle)] hover:text-[var(--glass-text-primary)]"
                  )}
                  onClick={() => setShowSessions(!showSessions)}
                  aria-label={showSessions ? "Hide chat history" : "Show chat history"}
                  aria-expanded={showSessions}
                >
                  <History className="h-3.5 w-3.5" />
                </button>
              )}
              <span className="text-sm font-medium text-[var(--glass-text-secondary)]">
                Booking chat
              </span>
              {stats && (stats.totalBookings > 0 || stats.routesLearned > 0) && (
                <span className="hidden sm:inline text-[11px] text-[var(--glass-text-tertiary)]">
                  {stats.totalBookings > 0 && `${stats.totalBookings} flight${stats.totalBookings !== 1 ? "s" : ""} booked`}
                  {stats.totalBookings > 0 && stats.routesLearned > 0 && " · "}
                  {stats.routesLearned > 0 && `${stats.routesLearned} route${stats.routesLearned !== 1 ? "s" : ""} learned`}
                </span>
              )}
            </div>
            <button
              onClick={clearChat}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1",
                "text-xs font-medium text-[var(--glass-text-tertiary)]",
                "transition-colors duration-200",
                "hover:bg-[var(--glass-subtle)] hover:text-[var(--glass-text-primary)]"
              )}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              New booking
            </button>
          </div>
        )}

        {hasMessages ? (
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            onSelectFlight={selectFlight}
            onConfirmBooking={confirmBooking}
            onRazorpayConfirm={confirmBookingRazorpay}
          />
        ) : (
          <WelcomeScreen
            onSuggestedPrompt={sendMessage}
            quickActions={quickActions}
            patternGreeting={patternGreeting}
            loading={returningLoading}
          />
        )}
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
