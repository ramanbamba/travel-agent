"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const hasValue = value.trim().length > 0;

  return (
    <div
      className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
    >
      <div
        className={cn(
          "mx-auto flex max-w-3xl items-end gap-2",
          "rounded-[var(--glass-radius-pill)]",
          "border border-[var(--glass-border)]",
          "bg-[var(--glass-elevated)]",
          "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
          "shadow-[var(--glass-shadow-sm)] [box-shadow:var(--glass-shadow-sm),var(--glass-inner-glow)]",
          "px-3 py-2",
          "transition-all duration-200 ease-expo-out",
          "focus-within:border-[var(--glass-accent-blue)] focus-within:shadow-[0_0_0_3px_var(--glass-accent-blue-light),var(--glass-shadow-sm)]"
        )}
      >
        {/* Attach button (future) */}
        <button
          type="button"
          disabled
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--glass-text-tertiary)] opacity-40 transition-colors"
          aria-label="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Where do you want to fly?"
          aria-label="Flight booking message"
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent",
            "py-1.5 text-[15px] leading-relaxed",
            "text-[var(--glass-text-primary)]",
            "placeholder:text-[var(--glass-text-tertiary)]",
            "focus:outline-none",
            "disabled:opacity-50"
          )}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasValue || disabled}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            "transition-all duration-200 ease-spring",
            hasValue && !disabled
              ? "bg-[var(--glass-accent-blue)] text-white shadow-[0_2px_8px_rgba(0,113,227,0.3)] active:scale-90"
              : "bg-transparent text-[var(--glass-text-tertiary)] opacity-40"
          )}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
