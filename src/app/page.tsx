import Link from "next/link";
import { Button } from "@/components/ui/button";

// ── Icons (inline SVG for tree-shaking) ──

function PlaneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Navbar ──

function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <PlaneIcon className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
            SkySwift
          </span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">How It Works</a>
          <a href="#for-companies" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">For Companies</a>
          <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Start Free Pilot</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ──

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Copy */}
          <div>
            <div className="mb-4 inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400">
              AI-Powered Corporate Travel
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl dark:text-white">
              Your AI Travel Desk.{" "}
              <span className="text-blue-600">30 Seconds.</span>{" "}
              <span className="text-blue-600">WhatsApp.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              SkySwift replaces your travel desk with an AI agent that books flights in 30 seconds, enforces policy automatically, and recovers 12-18% in GST credits. Starting free.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Pilot
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                  </svg>
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Watch Demo
                </Button>
              </a>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              No credit card required. 20 free bookings/month.
            </p>
          </div>

          {/* Right: WhatsApp mockup */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-3xl border border-gray-200 bg-white p-1 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
              {/* Phone frame header */}
              <div className="rounded-t-[20px] bg-[#075e54] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                    <PlaneIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">SkySwift AI</p>
                    <p className="text-xs text-green-200">online</p>
                  </div>
                </div>
              </div>
              {/* Chat area */}
              <div className="space-y-3 bg-[#ece5dd] px-3 py-4 dark:bg-gray-800" style={{ minHeight: 340 }}>
                {/* User message */}
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-lg rounded-tr-none bg-[#dcf8c6] px-3 py-2 text-sm text-gray-900 dark:bg-green-900 dark:text-green-100">
                    Book BLR to DEL Monday morning
                  </div>
                </div>
                {/* Bot response */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg rounded-tl-none bg-white px-3 py-2 text-sm text-gray-800 shadow-sm dark:bg-gray-700 dark:text-gray-200">
                    <p className="mb-2">Here are the best options within <strong>Acme Corp</strong> policy:</p>
                    <div className="space-y-2 text-xs">
                      <div className="rounded-md border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-950/30">
                        <span className="font-medium text-green-700 dark:text-green-400">1. IndiGo 6E-234</span>
                        <br />06:15 - 09:00 | Direct | ₹4,850
                        <br /><span className="text-green-600 dark:text-green-500">RECOMMENDED</span>
                      </div>
                      <div className="rounded-md border border-gray-200 p-2 dark:border-gray-600">
                        <span className="font-medium">2. Air India AI-505</span>
                        <br />08:30 - 11:15 | Direct | ₹5,200
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Reply 1 or 2 to book.</p>
                  </div>
                </div>
                {/* User reply */}
                <div className="flex justify-end">
                  <div className="rounded-lg rounded-tr-none bg-[#dcf8c6] px-3 py-2 text-sm text-gray-900 dark:bg-green-900 dark:text-green-100">
                    1
                  </div>
                </div>
                {/* Confirmation */}
                <div className="flex justify-start">
                  <div className="rounded-lg rounded-tl-none bg-white px-3 py-2 text-sm text-gray-800 shadow-sm dark:bg-gray-700 dark:text-gray-200">
                    Booked! PNR: <strong>ABC123</strong>
                    <br /><span className="text-xs text-gray-500 dark:text-gray-400">GST Invoice captured. E-ticket sent.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="mt-16 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Built by ex-Booking.com &amp; Amadeus team
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Problem Statement ──

function ProblemSection() {
  const painPoints = [
    {
      stat: "₹0",
      label: "GST Recovered",
      description: "Most companies lose 12-18% in unclaimed ITC on travel spend",
    },
    {
      stat: "10+ min",
      label: "Per Booking",
      description: "Employees waste time on clunky online booking tools or calling agents",
    },
    {
      stat: "Zero",
      label: "Spend Visibility",
      description: "CFOs can't see where travel money goes until the quarter ends",
    },
  ];

  return (
    <section className="border-t border-gray-100 bg-gray-50 px-6 py-20 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="mx-auto max-w-3xl text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          60% of Indian corporate travel flows through offline agents with no technology, no policy, and no visibility.
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {painPoints.map((p) => (
            <div key={p.label} className="rounded-xl border border-gray-200 bg-white p-6 text-left dark:border-gray-700 dark:bg-gray-800">
              <p className="text-3xl font-bold text-red-500">{p.stat}</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{p.label}</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Message your AI travel agent",
      description: "Employees text the SkySwift WhatsApp bot in plain language. No app to install.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      num: "02",
      title: "AI finds the best flights within policy",
      description: "Our engine searches across airlines, applies your company policy, and ranks by employee preferences.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        </svg>
      ),
    },
    {
      num: "03",
      title: "Confirm with one tap",
      description: "Employee taps to confirm. Booking is made, GST invoice captured, e-ticket sent instantly.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">How It Works</h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">Three steps. 30 seconds. Done.</p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                {step.icon}
              </div>
              <p className="mb-1 text-xs font-medium text-gray-400">{step.num}</p>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Dual Value Section ──

function DualValueSection() {
  const managerFeatures = [
    "Policy enforcement on autopilot",
    "Real-time spend dashboard",
    "GST compliance & ITC tracking",
    "Employee management & approvals",
    "Tally-compatible CSV export",
  ];

  const employeeFeatures = [
    "Book on WhatsApp — no app to install",
    "30-second booking with AI",
    "Preferences remembered from day one",
    "Instant confirmations & e-tickets",
    "One-tap approval requests",
  ];

  return (
    <section id="for-companies" className="border-t border-gray-100 bg-gray-50 px-6 py-20 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">Built for Two Audiences</h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">Travel managers get control. Employees get speed.</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* For Managers */}
          <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
              For Travel Managers &amp; Finance
            </div>
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Complete visibility and control
            </h3>
            <ul className="space-y-3">
              {managerFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 text-blue-600"><CheckIcon /></span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{f}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* For Employees */}
          <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
              For Employees
            </div>
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Zero friction, instant booking
            </h3>
            <ul className="space-y-3">
              {employeeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-600"><CheckIcon /></span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Features Grid ──

function FeaturesSection() {
  const features = [
    {
      title: "AI Booking Agent",
      description: "Natural language booking via WhatsApp. Employees just say where they need to go.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      title: "Policy Engine",
      description: "Automatic compliance checking. Cabin class rules, spend limits, and approval workflows.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        </svg>
      ),
    },
    {
      title: "GST Compliance",
      description: "Auto-capture invoices with GSTIN. ITC tracking. Tally-compatible export.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      title: "Spend Analytics",
      description: "Real-time dashboards. Spend by department, route, airline. Monthly trends.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      title: "Preference Learning",
      description: "Gets smarter with every booking. Learns airlines, times, and seat preferences.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
    {
      title: "Approval Workflows",
      description: "Manager approvals via WhatsApp. Auto-approve within policy. Escalate on timeout.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      ),
    },
  ];

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">Everything You Need</h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">Purpose-built for Indian corporate travel.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                {f.icon}
              </div>
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ──

function PricingSection() {
  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      description: "Perfect for trying SkySwift with your team.",
      features: [
        "20 bookings/month",
        "WhatsApp booking bot",
        "Basic travel policy",
        "GST invoice capture",
        "Up to 10 employees",
      ],
      cta: "Start Free",
      highlighted: false,
    },
    {
      name: "Growth",
      price: "₹15,000",
      period: "/month",
      description: "For growing companies with active travel.",
      features: [
        "Unlimited bookings",
        "Advanced policy engine",
        "Spend analytics dashboard",
        "Tally CSV export",
        "Approval workflows",
        "Unlimited employees",
        "Priority support",
      ],
      cta: "Start Free Pilot",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations with complex needs.",
      features: [
        "Everything in Growth",
        "Multi-entity support",
        "SSO integration",
        "API access",
        "Dedicated account manager",
        "Custom integrations",
        "SLA guarantee",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="border-t border-gray-100 bg-gray-50 px-6 py-20 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">Simple, Transparent Pricing</h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">Start free. Upgrade when you&apos;re ready.</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-8 ${
                plan.highlighted
                  ? "border-blue-600 bg-white ring-1 ring-blue-600 dark:border-blue-500 dark:bg-gray-800 dark:ring-blue-500"
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              }`}
            >
              {plan.highlighted && (
                <div className="mb-4 inline-flex rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                {plan.period && <span className="text-sm text-gray-500 dark:text-gray-400">{plan.period}</span>}
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
              <Link href="/signup" className="mt-6 block">
                <Button
                  variant={plan.highlighted ? "default" : "outline"}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 text-blue-600"><CheckIcon /></span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Trust / Social Proof ──

function TrustSection() {
  const badges = [
    { label: "Data encrypted at rest & in transit", icon: "🔒" },
    { label: "India data residency", icon: "🇮🇳" },
    { label: "300+ airlines via Duffel", icon: "✈️" },
    { label: "SOC 2 compliant infrastructure", icon: "🛡️" },
  ];

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">Trusted &amp; Secure</h2>
        <p className="mt-3 text-gray-500 dark:text-gray-400">Enterprise-grade security. Built for Indian compliance.</p>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {badges.map((b) => (
            <div key={b.label} className="rounded-lg border border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-2xl">{b.icon}</p>
              <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-300">{b.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ──

function FAQSection() {
  const faqs = [
    {
      q: "How does WhatsApp booking work?",
      a: "Employees message the SkySwift WhatsApp bot in plain language (e.g., 'Book BLR to DEL Monday morning'). The AI searches flights, applies your company policy, and shows options. Employee taps to confirm. Done in 30 seconds.",
    },
    {
      q: "What airlines do you support?",
      a: "We support 300+ airlines globally via our partnership with Duffel, including all major Indian carriers — IndiGo, Air India, Vistara, SpiceJet, AirAsia India, and more.",
    },
    {
      q: "How is GST compliance handled?",
      a: "Your company GSTIN is captured at setup. For every booking, we auto-generate GST-compliant invoice entries with correct SAC codes, CGST/SGST/IGST split, and ITC eligibility. Export to Tally-compatible CSV anytime.",
    },
    {
      q: "What happens if a booking is out of policy?",
      a: "Depends on your policy mode. In 'soft' mode, employees see a warning but can proceed (with an audit trail). In 'hard' mode, out-of-policy options are blocked. Either way, you can route exceptions to manager approval.",
    },
    {
      q: "How do I add employees?",
      a: "Admins can invite employees from the dashboard with name and email. Employees receive a signup link. Once signed up, they can start booking via WhatsApp by verifying their phone number.",
    },
    {
      q: "Is my data secure?",
      a: "Yes. All data is encrypted at rest and in transit. We use Supabase (hosted on AWS) with Row Level Security ensuring strict tenant isolation. No employee can see another company's data.",
    },
    {
      q: "What does the free plan include?",
      a: "20 bookings per month, WhatsApp bot access, basic travel policy, GST invoice capture, and up to 10 employees. No credit card required. Upgrade anytime.",
    },
  ];

  return (
    <section className="border-t border-gray-100 bg-gray-50 px-6 py-20 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">Frequently Asked Questions</h2>
        </div>
        <div className="mt-12 space-y-4">
          {faqs.map((faq) => (
            <details key={faq.q} className="group rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                {faq.q}
              </summary>
              <div className="border-t border-gray-100 px-6 py-4 text-sm leading-relaxed text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer CTA ──

function FooterCTA() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
          Start your free pilot today
        </h2>
        <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
          20 bookings on us. No credit card required.
        </p>
        <div className="mt-8">
          <Link href="/signup">
            <Button size="lg">
              Get Started Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Footer ──

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white px-6 py-12 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
                <PlaneIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">SkySwift</span>
            </div>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              AI travel management for Indian corporates. Book flights in 30 seconds via WhatsApp.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Product</h4>
            <ul className="space-y-2">
              <li><a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">How it works</a></li>
              <li><a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Pricing</a></li>
              <li><a href="#for-companies" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">For Companies</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">About</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Blog</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Privacy</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Terms</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-100 pt-8 dark:border-gray-800">
          <p className="text-xs text-gray-400">
            &copy; 2026 SkySwift. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <DualValueSection />
      <FeaturesSection />
      <PricingSection />
      <TrustSection />
      <FAQSection />
      <FooterCTA />
      <Footer />
    </main>
  );
}
