"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Phase =
  | "typing"
  | "thinking"
  | "response"
  | "flight-card"
  | "confirm-typing"
  | "confirmed"
  | "pause";

const USER_MESSAGE = "Book BA to London Monday";
const AGENT_RESPONSE = "Found 3 flights. Best option:";
const CONFIRM_MESSAGE = "Book it";
const TYPING_SPEED = 50;
const THINKING_DURATION = 1200;
const RESPONSE_DELAY = 600;
const FLIGHT_CARD_DELAY = 800;
const CONFIRM_TYPING_SPEED = 60;
const CONFIRMED_DELAY = 1500;
const LOOP_PAUSE = 3000;

export function ChatDemoAnimation() {
  const [phase, setPhase] = useState<Phase>("typing");
  const [typedChars, setTypedChars] = useState(0);
  const [confirmChars, setConfirmChars] = useState(0);
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Phase machine
  useEffect(() => {
    cleanup();

    switch (phase) {
      case "typing": {
        let charIndex = 0;
        intervalRef.current = setInterval(() => {
          charIndex++;
          setTypedChars(charIndex);
          if (charIndex >= USER_MESSAGE.length) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            timeoutRef.current = setTimeout(
              () => setPhase("thinking"),
              400
            );
          }
        }, TYPING_SPEED);
        break;
      }
      case "thinking": {
        timeoutRef.current = setTimeout(
          () => setPhase("response"),
          THINKING_DURATION
        );
        break;
      }
      case "response": {
        timeoutRef.current = setTimeout(
          () => setPhase("flight-card"),
          RESPONSE_DELAY
        );
        break;
      }
      case "flight-card": {
        timeoutRef.current = setTimeout(
          () => setPhase("confirm-typing"),
          FLIGHT_CARD_DELAY
        );
        break;
      }
      case "confirm-typing": {
        let charIndex = 0;
        intervalRef.current = setInterval(() => {
          charIndex++;
          setConfirmChars(charIndex);
          if (charIndex >= CONFIRM_MESSAGE.length) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            timeoutRef.current = setTimeout(
              () => setPhase("confirmed"),
              400
            );
          }
        }, CONFIRM_TYPING_SPEED);
        break;
      }
      case "confirmed": {
        timeoutRef.current = setTimeout(
          () => setPhase("pause"),
          CONFIRMED_DELAY
        );
        break;
      }
      case "pause": {
        setVisible(false);
        timeoutRef.current = setTimeout(() => {
          setTypedChars(0);
          setConfirmChars(0);
          setVisible(true);
          setPhase("typing");
        }, LOOP_PAUSE);
        break;
      }
    }
  }, [phase, cleanup]);

  const showThinking =
    phase === "thinking" ||
    phase === "response" ||
    phase === "flight-card" ||
    phase === "confirm-typing" ||
    phase === "confirmed" ||
    phase === "pause";

  const showResponse =
    phase === "response" ||
    phase === "flight-card" ||
    phase === "confirm-typing" ||
    phase === "confirmed" ||
    phase === "pause";

  const showFlightCard =
    phase === "flight-card" ||
    phase === "confirm-typing" ||
    phase === "confirmed" ||
    phase === "pause";

  const showConfirm =
    phase === "confirm-typing" ||
    phase === "confirmed" ||
    phase === "pause";

  const showCheckmark = phase === "confirmed" || phase === "pause";

  return (
    <div
      className={`transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className="overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-elevated)] shadow-[var(--glass-shadow-lg)]"
        style={{
          backdropFilter: "blur(24px) saturate(1.8)",
          WebkitBackdropFilter: "blur(24px) saturate(1.8)",
        }}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-[var(--glass-border-subtle)] px-4 py-3">
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--glass-accent-red)] opacity-70" />
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--glass-accent-amber)] opacity-70" />
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--glass-accent-green)] opacity-70" />
          <span className="ml-2 text-xs text-[var(--glass-text-tertiary)]">
            Skyswift
          </span>
        </div>

        {/* Chat content */}
        <div className="space-y-3 p-5">
          {/* User message */}
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--glass-accent-blue)] text-[10px] font-semibold text-white">
              Y
            </div>
            <div className="rounded-2xl rounded-tl-md bg-[var(--glass-accent-blue)] px-3.5 py-2 text-sm text-white">
              {USER_MESSAGE.slice(0, typedChars)}
              {phase === "typing" && typedChars < USER_MESSAGE.length && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-white/80" />
              )}
            </div>
          </div>

          {/* Thinking indicator */}
          {showThinking && !showResponse && (
            <div className="flex items-start gap-2.5 animate-chat-message">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--glass-standard)] border border-[var(--glass-border)]">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--glass-text-secondary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
              </div>
              <div className="rounded-2xl rounded-tl-md bg-[var(--glass-subtle)] border border-[var(--glass-border-subtle)] px-3.5 py-2.5">
                <div className="flex gap-1">
                  <span className="animate-chat-dot h-1.5 w-1.5 rounded-full bg-[var(--glass-text-tertiary)]" />
                  <span className="animate-chat-dot h-1.5 w-1.5 rounded-full bg-[var(--glass-text-tertiary)] [animation-delay:0.2s]" />
                  <span className="animate-chat-dot h-1.5 w-1.5 rounded-full bg-[var(--glass-text-tertiary)] [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          {/* Agent response */}
          {showResponse && (
            <div className="flex items-start gap-2.5 animate-chat-message">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--glass-standard)] border border-[var(--glass-border)]">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--glass-text-secondary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
              </div>
              <div className="flex-1 space-y-2">
                <div className="rounded-2xl rounded-tl-md bg-[var(--glass-subtle)] border border-[var(--glass-border-subtle)] px-3.5 py-2 text-sm text-[var(--glass-text-primary)]">
                  {AGENT_RESPONSE}
                </div>

                {/* Mini flight card */}
                {showFlightCard && (
                  <div className="animate-chat-message rounded-xl border border-[var(--glass-border)] bg-[var(--glass-standard)] p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--glass-accent-blue-light)]">
                          <span className="text-[10px] font-bold text-[var(--glass-accent-blue)]">
                            BA
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--glass-text-primary)]">
                            BA 305
                          </p>
                          <p className="text-[10px] text-[var(--glass-text-tertiary)]">
                            LHR → LHR · Direct
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-[var(--glass-text-primary)]">
                          09:15 — 12:30
                        </p>
                        <p className="text-[10px] font-medium text-[var(--glass-accent-blue)]">
                          £284
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User "Book it" */}
          {showConfirm && (
            <div className="flex items-start gap-2.5 animate-chat-message">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--glass-accent-blue)] text-[10px] font-semibold text-white">
                Y
              </div>
              <div className="rounded-2xl rounded-tl-md bg-[var(--glass-accent-blue)] px-3.5 py-2 text-sm text-white">
                {CONFIRM_MESSAGE.slice(0, confirmChars)}
                {phase === "confirm-typing" &&
                  confirmChars < CONFIRM_MESSAGE.length && (
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-white/80" />
                  )}
              </div>
            </div>
          )}

          {/* Confirmation checkmark */}
          {showCheckmark && (
            <div className="flex items-center gap-2 animate-chat-message pl-8">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--glass-accent-green)]">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-draw-check"
                  pathLength="1"
                >
                  <polyline points="20 6 9 17 4 12" pathLength="1" />
                </svg>
              </div>
              <span className="text-xs font-medium text-[var(--glass-accent-green)]">
                Booked! Confirmation sent.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
