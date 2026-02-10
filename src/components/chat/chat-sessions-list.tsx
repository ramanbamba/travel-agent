"use client";

import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/hooks/use-chat-messages";

interface ChatSessionsListProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelect: (id: string) => void;
}

export function ChatSessionsList({
  sessions,
  currentSessionId,
  onSelect,
}: ChatSessionsListProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MessageSquare className="h-5 w-5 text-[var(--glass-text-tertiary)]" />
        <p className="mt-2 text-xs text-[var(--glass-text-tertiary)]">
          No chat history
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {sessions.map((session) => {
        const isActive = session.id === currentSessionId;
        const date = new Date(session.updated_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        return (
          <button
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={cn(
              "flex flex-col items-start rounded-xl px-3 py-2 text-left text-sm",
              "transition-all duration-200 ease-expo-out",
              isActive
                ? [
                    "bg-[var(--glass-accent-blue-light)]",
                    "text-[var(--glass-accent-blue)]",
                  ]
                : [
                    "text-[var(--glass-text-secondary)]",
                    "hover:bg-[var(--glass-subtle)]",
                    "hover:text-[var(--glass-text-primary)]",
                  ]
            )}
          >
            <span className="line-clamp-1 font-medium">{session.title}</span>
            <span className="text-[11px] opacity-60">{date}</span>
          </button>
        );
      })}
    </div>
  );
}
