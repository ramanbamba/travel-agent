"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass";
import { GlassButton } from "@/components/ui/glass";
import { cn } from "@/lib/utils";
import type { OnboardingQuestionKey } from "@/types/preferences";

// ── Question definitions (PRD §5.3) ────────────────────────────────────────

interface QuestionOption {
  label: string;
  value: string;
  emoji?: string;
}

interface ChatQuestion {
  key: OnboardingQuestionKey;
  question: string;
  subtitle?: string;
  options: QuestionOption[];
}

const QUESTIONS: ChatQuestion[] = [
  {
    key: "time_vs_price",
    question: "When you fly, what matters more?",
    subtitle: "This helps me prioritize the right flights for you",
    options: [
      { label: "Earliest flight", value: "earliest", emoji: "⏰" },
      { label: "Cheapest fare", value: "cheapest", emoji: "💰" },
      { label: "Best balance", value: "balanced", emoji: "⚖️" },
    ],
  },
  {
    key: "airline_loyalty",
    question: "Do you have a go-to airline?",
    subtitle: "I'll learn which carriers you prefer over time",
    options: [
      { label: "IndiGo", value: "6E", emoji: "🟦" },
      { label: "Air India", value: "AI", emoji: "🇮🇳" },
      { label: "Vistara / Tata", value: "UK", emoji: "⭐" },
      { label: "Open to all", value: "any", emoji: "🌍" },
    ],
  },
  {
    key: "frequency",
    question: "How often do you fly?",
    subtitle: "Frequent flyers get smarter recommendations faster",
    options: [
      { label: "Weekly", value: "weekly", emoji: "🚀" },
      { label: "2–4x/month", value: "monthly", emoji: "✈️" },
      { label: "Occasionally", value: "occasional", emoji: "🌟" },
    ],
  },
  {
    key: "seat_pref",
    question: "Window, aisle, or don't care?",
    subtitle: "I'll remember this for every booking",
    options: [
      { label: "Window", value: "window", emoji: "🌅" },
      { label: "Aisle", value: "aisle", emoji: "🚶" },
      { label: "Don't care", value: "no_preference", emoji: "🤷" },
    ],
  },
  {
    key: "baggage",
    question: "Do you usually check a bag?",
    subtitle: "Helps me factor in baggage when comparing fares",
    options: [
      { label: "Yes, always", value: "always", emoji: "🧳" },
      { label: "Sometimes", value: "sometimes", emoji: "🏒" },
      { label: "Cabin only", value: "cabin_only", emoji: "🎒" },
    ],
  },
];

// ── Message types ───────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  type: "bot" | "user";
  text: string;
  options?: QuestionOption[];
  questionKey?: OnboardingQuestionKey;
}

// ── Props ───────────────────────────────────────────────────────────────────

interface StepChatPreferencesProps {
  onComplete: (responses: Record<OnboardingQuestionKey, string>) => void;
  onBack: () => void;
  isSaving: boolean;
  direction?: "forward" | "back";
}

export function StepChatPreferences({
  onComplete,
  onBack,
  isSaving,
  direction = "forward",
}: StepChatPreferencesProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Show first question on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      showQuestion(0);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  function showQuestion(index: number) {
    if (index >= QUESTIONS.length) return;

    const q = QUESTIONS[index];
    setIsTyping(true);

    // Simulate typing delay (feels conversational)
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `q-${q.key}`,
          type: "bot",
          text: q.question,
          options: q.options,
          questionKey: q.key,
        },
      ]);
      setCurrentQ(index);
    }, 600);
  }

  function handleSelect(questionKey: OnboardingQuestionKey, option: QuestionOption) {
    // Add user's response as a message
    setMessages((prev) => {
      // Remove options from the question message (already answered)
      const updated = prev.map((m) =>
        m.questionKey === questionKey ? { ...m, options: undefined } : m
      );
      return [
        ...updated,
        {
          id: `a-${questionKey}`,
          type: "user" as const,
          text: `${option.emoji ?? ""} ${option.label}`.trim(),
        },
      ];
    });

    // Save response
    const newResponses = { ...responses, [questionKey]: option.value };
    setResponses(newResponses);

    // Next question or complete
    const nextIdx = QUESTIONS.findIndex((q) => q.key === questionKey) + 1;
    if (nextIdx < QUESTIONS.length) {
      setTimeout(() => showQuestion(nextIdx), 300);
    } else {
      // All questions answered — show completion
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: "complete",
            type: "bot",
            text: "Perfect! I've got a great picture of how you travel. Let me set up your personalized experience.",
          },
        ]);
        setIsComplete(true);
      }, 800);
    }
  }

  function handleFinish() {
    onComplete(responses as Record<OnboardingQuestionKey, string>);
  }

  const answeredCount = Object.keys(responses).length;
  const progress = ((answeredCount) / QUESTIONS.length) * 100;

  return (
    <div
      className={cn(
        "flex min-h-[100dvh] flex-col items-center justify-start px-4 pt-16 pb-8",
        direction === "forward" ? "animate-step-slide-left" : "animate-step-slide-right"
      )}
    >
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--glass-text-primary)] sm:text-3xl">
            Quick travel profile
          </h2>
          <p className="mt-1 text-sm text-[var(--glass-text-secondary)]">
            5 questions · 30 seconds · better recommendations from day one
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-[var(--glass-border)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--glass-accent-blue)] to-[var(--glass-accent-blue-hover)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Chat area */}
        <GlassCard tier="standard" padding="none" hover={false} className="min-h-[400px]">
          <div
            ref={containerRef}
            className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto p-4 sm:p-5"
          >
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.type === "bot" ? (
                  <BotMessage text={msg.text} subtitle={
                    msg.questionKey
                      ? QUESTIONS.find((q) => q.key === msg.questionKey)?.subtitle
                      : undefined
                  } />
                ) : (
                  <UserMessage text={msg.text} />
                )}

                {/* Option chips (only shown for unanswered questions) */}
                {msg.options && msg.options.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 pl-10">
                    {msg.options.map((opt) => (
                      <OptionChip
                        key={opt.value}
                        option={opt}
                        onClick={() =>
                          handleSelect(msg.questionKey!, opt)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && <TypingIndicator />}

            {/* Completion actions */}
            {isComplete && (
              <div className="mt-4 flex justify-center gap-3">
                <GlassButton
                  variant="primary"
                  size="lg"
                  onClick={handleFinish}
                  disabled={isSaving}
                  className="min-w-[180px]"
                >
                  {isSaving ? "Setting up..." : "Let's go!"}
                </GlassButton>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </GlassCard>

        {/* Back button */}
        <div className="mt-4 flex justify-start">
          <GlassButton variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </GlassButton>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function BotMessage({ text, subtitle }: { text: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Avatar */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--glass-accent-blue)] to-[var(--glass-accent-blue-hover)] text-xs font-bold text-white shadow-sm">
        S
      </div>
      {/* Bubble */}
      <div className="max-w-[85%]">
        <div className="rounded-2xl rounded-tl-md bg-[var(--glass-subtle)] px-4 py-2.5 text-[15px] leading-relaxed text-[var(--glass-text-primary)] shadow-sm">
          {text}
        </div>
        {subtitle && (
          <p className="mt-1 pl-1 text-[11px] text-[var(--glass-text-tertiary)]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="max-w-[75%] rounded-2xl rounded-tr-md bg-[var(--glass-accent-blue)] px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-sm">
        {text}
      </div>
    </div>
  );
}

function OptionChip({
  option,
  onClick,
}: {
  option: QuestionOption;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium",
        "border-[var(--glass-accent-blue)]/30 bg-[var(--glass-accent-blue-light)]",
        "text-[var(--glass-accent-blue)]",
        "transition-all duration-200",
        "hover:border-[var(--glass-accent-blue)] hover:bg-[var(--glass-accent-blue)]/15",
        "hover:shadow-sm",
        "active:scale-95",
        "animate-in fade-in slide-in-from-bottom-1 duration-300"
      )}
    >
      {option.emoji && <span className="text-base">{option.emoji}</span>}
      {option.label}
    </button>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 animate-in fade-in duration-200">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--glass-accent-blue)] to-[var(--glass-accent-blue-hover)] text-xs font-bold text-white shadow-sm">
        S
      </div>
      <div className="flex gap-1 rounded-2xl rounded-tl-md bg-[var(--glass-subtle)] px-4 py-3 shadow-sm">
        <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--glass-text-tertiary)] [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--glass-text-tertiary)] [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--glass-text-tertiary)] [animation-delay:300ms]" />
      </div>
    </div>
  );
}
