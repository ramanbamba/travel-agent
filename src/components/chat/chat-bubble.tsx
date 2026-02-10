import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { RichContentRenderer } from "./rich-content-renderer";

interface ChatBubbleProps {
  message: ChatMessage;
  onSelectFlight?: (flightId: string) => void;
  onConfirmBooking?: (bookingId: string, paymentMethodId?: string) => void;
  /** Stagger index for entrance animation */
  index?: number;
}

export function ChatBubble({
  message,
  onSelectFlight,
  onConfirmBooking,
  index = 0,
}: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-2.5 px-4 py-1.5",
        "animate-chat-message opacity-0 [animation-fill-mode:forwards]",
        isUser ? "justify-end" : "justify-start"
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Agent avatar */}
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--glass-accent-blue-light)] mt-0.5">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--glass-accent-blue)]"
          >
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
          </svg>
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-2 sm:max-w-[70%]",
          isUser && "items-end"
        )}
      >
        {/* Text bubble */}
        {message.content && (
          <div
            className={cn(
              "text-[15px] leading-relaxed",
              isUser
                ? [
                    // User: Apple blue pill, right-aligned
                    "rounded-2xl rounded-br-md",
                    "bg-[var(--glass-accent-blue)] text-white",
                    "px-4 py-2.5",
                    "shadow-[0_1px_3px_rgba(0,113,227,0.2)]",
                  ]
                : [
                    // Agent: glass card, left-aligned
                    "rounded-2xl rounded-tl-md",
                    "bg-[var(--glass-subtle)]",
                    "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
                    "border border-[var(--glass-border)]",
                    "text-[var(--glass-text-primary)]",
                    "px-4 py-2.5",
                  ]
            )}
          >
            {message.content}
          </div>
        )}

        {/* Rich content (flights, booking summary, confirmation) */}
        {message.richContent && (
          <div className="w-full">
            <RichContentRenderer
              content={message.richContent}
              onSelectFlight={onSelectFlight}
              onConfirmBooking={onConfirmBooking}
            />
          </div>
        )}

        {/* Timestamp */}
        {message.createdAt && (
          <span className="px-1 text-[11px] text-[var(--glass-text-tertiary)]">
            {new Date(message.createdAt).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        )}
      </div>
    </div>
  );
}
