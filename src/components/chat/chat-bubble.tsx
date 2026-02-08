import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { RichContentRenderer } from "./rich-content-renderer";

interface ChatBubbleProps {
  message: ChatMessage;
  onSelectFlight?: (flightId: string) => void;
  onConfirmBooking?: (bookingId: string, paymentMethodId?: string) => void;
}

export function ChatBubble({
  message,
  onSelectFlight,
  onConfirmBooking,
}: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full animate-chat-message gap-3 px-4 py-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
          </svg>
        </div>
      )}

      <div
        className={cn("flex max-w-[85%] flex-col gap-2 md:max-w-[70%]", isUser && "items-end")}
      >
        {/* Text bubble */}
        {message.content && (
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-white/5 text-foreground"
            )}
          >
            {message.content}
          </div>
        )}

        {/* Rich content */}
        {message.richContent && (
          <RichContentRenderer
            content={message.richContent}
            onSelectFlight={onSelectFlight}
            onConfirmBooking={onConfirmBooking}
          />
        )}
      </div>
    </div>
  );
}
