import { Plane, Globe, Clock } from "lucide-react";

interface WelcomeScreenProps {
  onSuggestedPrompt: (prompt: string) => void;
}

const suggestions = [
  {
    icon: Plane,
    label: "Book a flight",
    prompt: "Book a flight from JFK to London next Friday",
  },
  {
    icon: Globe,
    label: "Round trip",
    prompt: "Round trip from SFO to Tokyo, departing March 15, returning March 22",
  },
  {
    icon: Clock,
    label: "Last minute",
    prompt: "Find me the cheapest flight to Miami this weekend",
  },
];

export function WelcomeScreen({ onSuggestedPrompt }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
      </div>

      <h2 className="mt-6 text-xl font-semibold">Where are you headed?</h2>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        Tell me where you want to fly and I&apos;ll find the best options for
        you. Just type naturally.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => onSuggestedPrompt(s.prompt)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-white/20 hover:bg-white/5 hover:text-foreground"
          >
            <s.icon className="h-4 w-4 shrink-0" />
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
