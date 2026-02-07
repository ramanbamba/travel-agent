import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WaitlistForm } from "@/components/waitlist-form";

function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">Skyswift</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </Link>
          <Link
            href="#compare"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Compare
          </Link>
          <Link
            href="#waitlist"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Waitlist
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="#waitlist">
            <Button size="sm">Get Early Access</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-16">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-glow-pulse absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-white/[0.07] to-transparent blur-3xl" />
        <div className="animate-glow-pulse absolute -bottom-20 left-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-t from-blue-500/[0.05] to-transparent blur-3xl delay-500" />
        <div className="animate-glow-pulse absolute -bottom-20 right-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-t from-purple-500/[0.05] to-transparent blur-3xl delay-300" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="animate-fade-in opacity-0">
          <Badge
            variant="secondary"
            className="mb-8 border-white/10 bg-white/5 px-4 py-1.5 text-sm font-normal text-muted-foreground"
          >
            Currently in private beta
          </Badge>
        </div>

        <h1 className="animate-fade-in-up text-balance text-5xl font-bold leading-[1.08] tracking-tight opacity-0 delay-100 sm:text-6xl md:text-7xl lg:text-8xl">
          Book flights in{" "}
          <span className="animate-shimmer bg-gradient-to-r from-white via-white/60 to-white bg-clip-text text-transparent">
            30 seconds
          </span>
        </h1>

        <p className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground opacity-0 delay-200 md:text-xl">
          The average flight booking takes{" "}
          <span className="text-foreground">47 clicks</span> and{" "}
          <span className="text-foreground">18 minutes</span>. Skyswift replaces all of that
          with a single conversation. Just tell us where you&apos;re going.
        </p>

        <div className="animate-fade-in-up mt-10 flex flex-col items-center justify-center gap-4 opacity-0 delay-300 sm:flex-row">
          <Link href="#waitlist">
            <Button size="lg" className="h-12 px-8 text-base">
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
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="ghost" size="lg" className="h-12 px-8 text-base text-muted-foreground">
              See how it works
            </Button>
          </Link>
        </div>

        {/* Mockup terminal */}
        <div className="animate-fade-in-up mx-auto mt-20 max-w-2xl opacity-0 delay-500">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-2xl shadow-black/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-white/10" />
              <div className="h-3 w-3 rounded-full bg-white/10" />
              <div className="h-3 w-3 rounded-full bg-white/10" />
              <span className="ml-2 font-[family-name:var(--font-geist-mono)] text-xs text-muted-foreground">
                skyswift
              </span>
            </div>
            <div className="p-6 text-left font-[family-name:var(--font-geist-mono)] text-sm leading-relaxed">
              <p className="text-muted-foreground">
                <span className="text-emerald-400">you</span>{" "}
                Book me a window seat to Tokyo next Friday, returning Sunday the 23rd. Use my BA
                gold status.
              </p>
              <div className="mt-4 border-l-2 border-white/10 pl-4">
                <p className="text-muted-foreground">
                  <span className="text-blue-400">skyswift</span>{" "}
                  Found 3 flights. Best option: BA005 LHR&rarr;NRT, departing 21:30, window seat 14A.
                  Return BA008, 17:15. Total: &pound;2,847 with Gold priority boarding.
                </p>
                <p className="mt-2 text-muted-foreground">
                  Shall I book this?
                </p>
              </div>
              <p className="mt-4 text-muted-foreground">
                <span className="text-emerald-400">you</span> Yes, book it.
              </p>
              <p className="mt-4 text-emerald-400/80">
                &check; Booked. Confirmation sent to your email.
              </p>
            </div>
          </div>
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
        "Review your itinerary, say \"book it\", and you're done. Confirmation, e-ticket, and calendar invite — delivered instantly.",
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
          <Badge
            variant="secondary"
            className="mb-4 border-white/10 bg-white/5 px-3 py-1 text-xs font-normal text-muted-foreground"
          >
            How it works
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Three steps. That&apos;s it.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            No more hunting through 12 tabs. Tell us where you want to go,
            and we handle everything else.
          </p>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground transition-colors group-hover:border-white/20 group-hover:text-foreground">
                {step.icon}
              </div>
              <div className="mb-2 font-[family-name:var(--font-geist-mono)] text-xs text-muted-foreground">
                {step.number}
              </div>
              <h3 className="mb-3 text-xl font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  const oldWay = [
    "Open airline website",
    "Navigate to booking page",
    "Enter origin city",
    "Enter destination city",
    "Pick dates on calendar widget",
    "Select number of passengers",
    "Choose cabin class",
    "Hit search and wait",
    "Scroll through 40+ results",
    "Compare prices across tabs",
    "Select flight",
    "Enter passenger details (again)",
    "Enter passport information",
    "Choose seat (another page load)",
    "Add bags, meals, extras",
    "Enter payment information",
    "Review booking details",
    "Confirm and pay",
  ];

  const newWay = [
    "\"Book me a window seat to Tokyo next Friday\"",
    "Review the AI-selected best option",
    "Say \"book it\"",
  ];

  return (
    <section id="compare" className="relative px-6 py-32">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-red-500/[0.03] via-transparent to-emerald-500/[0.03] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          <Badge
            variant="secondary"
            className="mb-4 border-white/10 bg-white/5 px-3 py-1 text-xs font-normal text-muted-foreground"
          >
            Compare
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            18 minutes vs 30 seconds
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            See the difference for yourself.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {/* Old Way */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgb(239 68 68)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">The old way</h3>
                <p className="font-[family-name:var(--font-geist-mono)] text-sm text-muted-foreground">
                  18 minutes &middot; 47 clicks
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {oldWay.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground"
                >
                  <span className="mt-0.5 font-[family-name:var(--font-geist-mono)] text-xs text-muted-foreground/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* New Way */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgb(52 211 153)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">With Skyswift</h3>
                <p className="font-[family-name:var(--font-geist-mono)] text-sm text-emerald-400/80">
                  30 seconds &middot; 3 steps
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {newWay.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-sm"
                >
                  <span className="mt-0.5 font-[family-name:var(--font-geist-mono)] text-xs text-emerald-400/80">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-lg border border-dashed border-white/10 p-6 text-center">
              <p className="font-[family-name:var(--font-geist-mono)] text-sm text-muted-foreground">
                That&apos;s it. You&apos;re booked.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WaitlistSection() {
  return (
    <section id="waitlist" className="relative px-6 py-32">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-glow-pulse absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-white/[0.04] to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-xl text-center">
        <Badge
          variant="secondary"
          className="mb-4 border-white/10 bg-white/5 px-3 py-1 text-xs font-normal text-muted-foreground"
        >
          Early access
        </Badge>
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Join the waitlist
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          We&apos;re onboarding high-frequency travelers first. Drop your email and
          we&apos;ll let you know when it&apos;s your turn.
        </p>

        <WaitlistForm />

        <p className="mt-4 text-xs text-muted-foreground/60">
          No spam. We&apos;ll only email you when your spot opens up.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="black"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
              </div>
              <span className="font-semibold">Skyswift</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The autonomous travel agent for people who&apos;d rather be doing anything else.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-white/5" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground/60">
            &copy; 2025 Skyswift. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-muted-foreground/60 transition-colors hover:text-muted-foreground">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </Link>
            <Link href="#" className="text-muted-foreground/60 transition-colors hover:text-muted-foreground">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <ComparisonSection />
      <WaitlistSection />
      <Footer />
    </main>
  );
}
