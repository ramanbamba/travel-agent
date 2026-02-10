import { cn } from "@/lib/utils";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 px-4 py-2 animate-chat-message">
      {/* Agent avatar */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--glass-accent-blue-light)]">
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

      {/* Pulsing dots pill */}
      <div
        className={cn(
          "flex items-center gap-1.5",
          "rounded-2xl rounded-tl-md",
          "bg-[var(--glass-subtle)]",
          "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
          "border border-[var(--glass-border)]",
          "px-4 py-3"
        )}
      >
        <span className="animate-chat-dot h-[7px] w-[7px] rounded-full bg-[var(--glass-text-tertiary)]" />
        <span className="animate-chat-dot h-[7px] w-[7px] rounded-full bg-[var(--glass-text-tertiary)] [animation-delay:150ms]" />
        <span className="animate-chat-dot h-[7px] w-[7px] rounded-full bg-[var(--glass-text-tertiary)] [animation-delay:300ms]" />
      </div>
    </div>
  );
}
