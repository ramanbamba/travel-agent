import Link from "next/link";
import { GlassButton, GlassPill, GlassCard } from "@/components/ui/glass";
import { ChatDemoAnimation } from "@/components/landing";

function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-[var(--glass-border-subtle)] bg-[var(--glass-elevated)] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--glass-accent-blue)] shadow-[0_1px_3px_rgba(0,113,227,0.3)]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-[var(--glass-text-primary)]">
            Skyswift
          </span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="#how-it-works"
            className="text-sm text-[var(--glass-text-secondary)] transition-colors hover:text-[var(--glass-text-primary)]"
          >
            How it works
          </Link>
          <Link
            href="#social-proof"
            className="text-sm text-[var(--glass-text-secondary)] transition-colors hover:text-[var(--glass-text-primary)]"
          >
            Trusted by
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <GlassButton variant="ghost" size="sm">
              Log in
            </GlassButton>
          </Link>
          <Link href="/signup">
            <GlassButton variant="primary" size="sm">
              Start Booking
            </GlassButton>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-16">
      {/* Gradient mesh background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-glow-pulse absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[var(--glass-accent-blue)]/[0.08] to-transparent blur-3xl" />
        <div className="animate-glow-pulse absolute -bottom-20 left-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-t from-[var(--glass-accent-blue)]/[0.05] to-transparent blur-3xl [animation-delay:500ms]" />
        <div className="animate-glow-pulse absolute -bottom-20 right-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-t from-purple-500/[0.05] to-transparent blur-3xl [animation-delay:300ms]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <div className="animate-fade-in opacity-0">
          <GlassPill variant="blue" size="md" className="mb-8">
            AI-powered flight booking
          </GlassPill>
        </div>

        <h1 className="animate-fade-in-up text-balance text-5xl font-bold leading-[1.08] tracking-tight text-[var(--glass-text-primary)] opacity-0 delay-100 sm:text-6xl md:text-7xl lg:text-8xl">
          Book flights in{" "}
          <span className="animate-shimmer bg-gradient-to-r from-[var(--glass-accent-blue)] via-[var(--glass-accent-blue)]/60 to-[var(--glass-accent-blue)] bg-clip-text text-transparent">
            30 seconds
          </span>
        </h1>

        <p className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-[var(--glass-text-secondary)] opacity-0 delay-200 md:text-xl">
          The average flight booking takes{" "}
          <span className="font-medium text-[var(--glass-text-primary)]">47 clicks</span> and{" "}
          <span className="font-medium text-[var(--glass-text-primary)]">18 minutes</span>. Skyswift replaces all of that
          with a single conversation.
        </p>

        <div className="animate-fade-in-up mt-10 flex flex-col items-center justify-center gap-4 opacity-0 delay-300 sm:flex-row">
          <Link href="/signup">
            <GlassButton variant="primary" size="lg">
              Get Started Free
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </GlassButton>
          </Link>
          <Link href="#how-it-works">
            <GlassButton variant="ghost" size="lg">
              See how it works
            </GlassButton>
          </Link>
        </div>

        {/* Chat demo */}
        <div className="animate-fade-in-up mx-auto mt-16 max-w-lg opacity-0 delay-500">
          <ChatDemoAnimation />
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Tell us where",
      description:
        "Type your destination, dates, and preferences in plain English. No forms, no dropdowns, no calendar pickers.",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      number: "02",
      title: "We find the best flight",
      description:
        "Our AI searches across airlines, applies your loyalty status, and finds the best seat — all in seconds.",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      ),
    },
    {
      number: "03",
      title: "Confirm and go",
      description:
        "Review your itinerary, say \"book it\", and you're done. Confirmation and e-ticket — delivered instantly.",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="relative px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <GlassPill variant="blue" size="md" className="mb-4">
            How it works
          </GlassPill>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-[var(--glass-text-primary)] sm:text-4xl md:text-5xl">
            Three steps. That&apos;s it.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--glass-text-secondary)]">
            No more hunting through 12 tabs. Tell us where you want to go,
            and we handle everything else.
          </p>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <GlassCard
              key={step.number}
              tier="subtle"
              padding="lg"
              className="group"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-subtle)] text-[var(--glass-text-secondary)] transition-colors group-hover:border-[var(--glass-accent-blue-light)] group-hover:bg-[var(--glass-accent-blue-light)] group-hover:text-[var(--glass-accent-blue)]">
                {step.icon}
              </div>
              <div className="mb-2 font-mono text-xs text-[var(--glass-text-tertiary)]">
                {step.number}
              </div>
              <h3 className="mb-3 text-xl font-semibold tracking-tight text-[var(--glass-text-primary)]">
                {step.title}
              </h3>
              <p className="leading-relaxed text-[var(--glass-text-secondary)]">
                {step.description}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialProofSection() {
  const stats = [
    { value: "500+", label: "Flights booked" },
    { value: "30s", label: "Avg booking time" },
    { value: "4.9/5", label: "User rating" },
    { value: "12+", label: "Airlines" },
  ];

  const testimonials = [
    {
      quote:
        "I used to spend 20 minutes comparing flights across tabs. Now I just tell Skyswift where I'm going and it's done.",
      name: "Sarah K.",
      role: "Management Consultant",
    },
    {
      quote:
        "The loyalty program integration is seamless. My BA Gold status is applied automatically to every booking.",
      name: "James M.",
      role: "VP Sales, 15+ flights/year",
    },
  ];

  return (
    <section id="social-proof" className="relative px-6 py-32">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[var(--glass-accent-blue)]/[0.04] via-transparent to-[var(--glass-accent-green)]/[0.03] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          <GlassPill variant="green" size="md" className="mb-4">
            Trusted by travelers
          </GlassPill>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-[var(--glass-text-primary)] sm:text-4xl md:text-5xl">
            Loved by frequent flyers
          </h2>
        </div>

        {/* Stats bar */}
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <GlassCard
              key={stat.label}
              tier="subtle"
              hover={false}
              padding="md"
              className="text-center"
            >
              <p className="text-2xl font-bold text-[var(--glass-accent-blue)] sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-[var(--glass-text-secondary)]">
                {stat.label}
              </p>
            </GlassCard>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <GlassCard key={t.name} tier="standard" padding="lg">
              <p className="text-base leading-relaxed text-[var(--glass-text-primary)]">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--glass-accent-blue-light)]">
                  <span className="text-sm font-semibold text-[var(--glass-accent-blue)]">
                    {t.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--glass-text-primary)]">
                    {t.name}
                  </p>
                  <p className="text-xs text-[var(--glass-text-tertiary)]">
                    {t.role}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative px-6 py-32">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-glow-pulse absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[var(--glass-accent-blue)]/[0.06] to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-[var(--glass-text-primary)] sm:text-4xl">
          Your next flight is 30 seconds away
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-[var(--glass-text-secondary)]">
          Stop wasting time on booking forms. Just tell us where you&apos;re going.
        </p>
        <div className="mt-8">
          <Link href="/signup">
            <GlassButton variant="primary" size="lg">
              Get Started Free
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </GlassButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--glass-border)] px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--glass-accent-blue)] shadow-[0_1px_3px_rgba(0,113,227,0.3)]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
              </div>
              <span className="font-semibold text-[var(--glass-text-primary)]">Skyswift</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--glass-text-secondary)]">
              The autonomous travel agent for people who&apos;d rather be doing anything else.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium text-[var(--glass-text-primary)]">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#how-it-works" className="text-sm text-[var(--glass-text-secondary)] transition-colors hover:text-[var(--glass-text-primary)]">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-[var(--glass-text-secondary)] transition-colors hover:text-[var(--glass-text-primary)]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-[var(--glass-text-secondary)] transition-colors hover:text-[var(--glass-text-primary)]">
                  Integrations
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium text-[var(--glass-text-primary)]">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-[var(--glass-text-secondary)] transition-colors hover:text-[var(--glass-text-primary)]">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-[var(--glass-text-secondary)] transition-colors hover:text-[var(--glass-text-primary)]">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-[var(--glass-text-secondary)] transition-colors hover:text-[var(--glass-text-primary)]">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium text-[var(--glass-text-primary)]">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-[var(--glass-text-secondary)] transition-colors hover:text-[var(--glass-text-primary)]">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-[var(--glass-text-secondary)] transition-colors hover:text-[var(--glass-text-primary)]">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-[var(--glass-text-secondary)] transition-colors hover:text-[var(--glass-text-primary)]">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--glass-border-subtle)] pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-[var(--glass-text-tertiary)]">
              &copy; 2025 Skyswift. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-[var(--glass-text-tertiary)] transition-colors hover:text-[var(--glass-text-secondary)]" aria-label="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
              <Link href="#" className="text-[var(--glass-text-tertiary)] transition-colors hover:text-[var(--glass-text-secondary)]" aria-label="GitHub">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="dark min-h-screen bg-[var(--glass-bg-page)]">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <SocialProofSection />
      <CTASection />
      <Footer />
    </main>
  );
}
