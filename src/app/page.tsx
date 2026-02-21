import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { WhatsAppHeroDemo } from "@/components/landing/whatsapp-hero-demo";
import { FadeIn, Stagger, StaggerChild, CountUp, WordReveal } from "@/components/landing/animations";

// ── SEO ──

export const metadata: Metadata = {
  title: "SkySwift — AI Corporate Travel Management for India",
  description:
    "Book corporate flights in 30 seconds on WhatsApp. Policy enforcement, GST compliance, spend analytics. Free pilot for Indian companies.",
  openGraph: {
    title: "SkySwift — AI Corporate Travel Management for India",
    description: "Book corporate flights in 30 seconds on WhatsApp. Policy enforcement, GST compliance, spend analytics.",
    type: "website",
  },
};

// ── Icons ──

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

// ── Hero Section ──

function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0A0F1E] via-[#0F172A] to-[#0A0F1E]">
      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }}
      />
      {/* Gradient mesh blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-purple-600/5 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pt-28 pb-20 md:pt-36 lg:pt-40">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Copy */}
          <div>
            <FadeIn delay={0.1}>
              <div className="mb-6 inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-cyan-400">
                AI-Native Corporate Travel for India
              </div>
            </FadeIn>

            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[56px]">
              <WordReveal
                text="Your AI travel desk."
                highlightWords={[]}
              />
              <br />
              <WordReveal
                text="30 seconds. WhatsApp."
                highlightWords={["30", "seconds.", "WhatsApp."]}
                highlightClass="text-blue-400"
              />
            </h1>

            <FadeIn delay={0.6}>
              <p className="mt-6 max-w-[540px] text-lg leading-relaxed text-slate-400">
                SkySwift replaces your travel desk with an AI agent that books flights in 30 seconds, enforces policy automatically, and recovers your GST credits. Used by teams across India.
              </p>
            </FadeIn>

            <FadeIn delay={0.8}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#0071e3] px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-[#0077ED] hover:shadow-xl hover:shadow-blue-600/25 active:scale-[0.98]"
                >
                  Start Free Pilot <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-8 py-3.5 text-sm font-medium text-slate-300 transition-all hover:border-slate-500 hover:text-white"
                >
                  See How It Works
                </a>
              </div>
            </FadeIn>

            <FadeIn delay={1}>
              <div className="mt-6 flex items-center gap-4 text-xs text-slate-500">
                <span>Built by ex-Booking.com &amp; Amadeus</span>
                <span className="text-slate-700">|</span>
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  India data residency
                </span>
              </div>
            </FadeIn>
          </div>

          {/* Right: Animated WhatsApp mockup */}
          <FadeIn delay={0.4} direction="left">
            <WhatsAppHeroDemo />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ── Problem Section ──

function ProblemSection() {
  const problems = [
    { metric: 60, suffix: "%", label: "Managed via WhatsApp Screenshots", description: "Indian corporate travel flows through screenshots to an admin — no policy, no visibility, no GST compliance." },
    { metric: 15, prefix: "₹", suffix: "L+", label: "Lost in Unclaimed GST Credits", description: "Mid-size companies lose lakhs annually in unclaimed input tax credits. Invoices buried in email, never filed." },
    { metric: 10, suffix: "+ min", label: "Per Booking on Legacy Tools", description: "Employees default to personal OTAs — 44% book outside authorized channels. No oversight, no savings." },
  ];

  return (
    <section className="relative overflow-hidden px-6 py-24 lg:py-32">
      {/* Gradient accent blob */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-blue-500/[0.04] blur-[120px]" />

      <div className="relative mx-auto max-w-6xl">
        <FadeIn>
          <h2 className="mx-auto max-w-3xl text-center text-3xl font-bold text-gray-900 sm:text-4xl">
            Corporate travel in India is stuck in 2005.
          </h2>
        </FadeIn>

        <Stagger className="mt-16 grid gap-6 md:grid-cols-3" stagger={0.15}>
          {problems.map((p) => (
            <StaggerChild key={p.label}>
              <div className="rounded-2xl border border-black/[0.06] bg-white/60 p-8 backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.05)]">
                <div className="font-mono text-4xl font-bold text-blue-600 lg:text-5xl">
                  <CountUp end={p.metric} prefix={p.prefix ?? ""} suffix={p.suffix} />
                </div>
                <p className="mt-2 text-sm font-medium text-gray-900">{p.label}</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{p.description}</p>
              </div>
            </StaggerChild>
          ))}
        </Stagger>
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
      description: "Just tell it where you need to go, like you'd message a colleague. No app to install.",
      visual: (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="rounded-lg bg-[#dcf8c6] px-3 py-2 text-sm text-gray-900">
            Book BLR to DEL Monday morning
          </div>
        </div>
      ),
    },
    {
      num: "02",
      title: "AI finds the best flights within policy",
      description: "Company policy applied automatically. Preferences learned from your booking history.",
      visual: (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-2">
              <span className="text-green-600">✅</span>
              <span>IndiGo 6E-234 · ₹4,850</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-gray-100 p-2">
              <span className="text-green-600">✅</span>
              <span>Air India AI-505 · ₹5,200</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      num: "03",
      title: "Confirm and you're booked",
      description: "E-ticket sent. GST invoice captured. Manager notified. All automatic.",
      visual: (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="text-xs">
            <p className="font-medium text-green-700">✅ Booked!</p>
            <p className="mt-1 text-gray-500">PNR: SKY7X2M · GST captured</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              3 messages. 30 seconds. Done.
            </h2>
            <p className="mt-3 text-lg text-gray-500">
              No apps to install. No forms to fill. Your team books on WhatsApp.
            </p>
          </div>
        </FadeIn>

        <Stagger className="mt-16 grid gap-8 md:grid-cols-3" stagger={0.2}>
          {steps.map((step) => (
            <StaggerChild key={step.num}>
              <div className="text-center">
                <div className="mx-auto mb-6 w-fit">{step.visual}</div>
                <span className="font-mono text-xs font-medium text-blue-600">{step.num}</span>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.description}</p>
              </div>
            </StaggerChild>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

// ── Dual Value Tabs ──

function DualValueSection() {
  const managerFeatures = [
    { icon: "🛡️", title: "Policy on Autopilot", desc: "Set rules once. Cabin class, spend limits, preferred airlines — the AI enforces everything before the booking happens." },
    { icon: "📊", title: "Real-Time Spend Visibility", desc: "See every rupee your team spends on travel. By department, by employee, by route. No more quarterly surprises." },
    { icon: "🧾", title: "GST Compliance, Automated", desc: "Every booking captures GST invoices with your GSTIN. One-click export to Tally. Recover 12-18% in input tax credits." },
    { icon: "✅", title: "Approval Workflows on WhatsApp", desc: "Out-of-policy bookings route to managers for approval — on WhatsApp, not buried in email. Approve with one tap." },
  ];

  const employeeFeatures = [
    { icon: "💬", title: "Book on WhatsApp", desc: "No app to install. No portal to remember. Message SkySwift on WhatsApp and get booked in 30 seconds." },
    { icon: "🧠", title: "Learns Your Preferences", desc: "Prefers IndiGo? Always want an aisle seat? Morning flights? SkySwift remembers, so you never repeat yourself." },
    { icon: "⚡", title: "One-Tap Changes", desc: "'Change my Delhi flight to Thursday' — that's it. No hold music, no rebooking forms." },
    { icon: "📱", title: "Works Everywhere", desc: "WhatsApp, Slack, Microsoft Teams, or web. Book from wherever you work." },
  ];

  return (
    <section id="platform" className="px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Built for two audiences</h2>
            <p className="mt-3 text-lg text-gray-500">Travel managers get control. Employees get speed.</p>
          </div>
        </FadeIn>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* For Managers */}
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-black/[0.06] bg-white/80 p-8 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.06),0_8px_32px_rgba(0,0,0,0.04)] lg:p-10">
              <div className="mb-6 inline-flex rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700">
                For Travel Managers &amp; Finance
              </div>
              <h3 className="mb-6 text-2xl font-bold text-gray-900">Complete control. Zero manual work.</h3>
              <div className="space-y-5">
                {managerFeatures.map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <span className="mt-0.5 text-lg">{f.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{f.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* For Employees */}
          <FadeIn delay={0.2}>
            <div className="rounded-2xl border border-black/[0.06] bg-white/80 p-8 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.06),0_8px_32px_rgba(0,0,0,0.04)] lg:p-10">
              <div className="mb-6 inline-flex rounded-full bg-green-50 px-4 py-1.5 text-xs font-medium text-green-700">
                For Employees
              </div>
              <h3 className="mb-6 text-2xl font-bold text-gray-900">The fastest way to book a work trip.</h3>
              <div className="space-y-5">
                {employeeFeatures.map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <span className="mt-0.5 text-lg">{f.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{f.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ── Features Grid ──

function FeaturesSection() {
  const features = [
    { title: "AI Booking Agent", desc: "Natural language booking via WhatsApp, Slack, or web. Handles 80%+ of corporate trips end-to-end without human intervention.", icon: "🤖" },
    { title: "Policy Engine", desc: "Rules-based enforcement with AI interpretation. Hard blocks, soft warnings, exception requests — all configurable.", icon: "🛡️" },
    { title: "GST Compliance", desc: "Automatic invoice capture, GSTIN validation, ITC tracking, and Tally-ready exports. The feature Indian CFOs need.", icon: "🧾" },
    { title: "Spend Analytics", desc: "Real-time dashboards, department breakdowns, route analysis, advance booking insights. Complete visibility.", icon: "📊" },
    { title: "Preference Learning", desc: "Gets smarter with every booking. Airline preferences, time-of-day patterns, seat choices — applied automatically.", icon: "🧠" },
    { title: "Works Where You Work", desc: "WhatsApp for the field. Slack for the office. Teams for the enterprise. Web for everything else.", icon: "🔗" },
  ];

  return (
    <section className="relative overflow-hidden px-6 py-24 lg:py-32">
      {/* Gradient wash blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-[500px] w-[500px] rounded-full bg-blue-600/[0.04] blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-[400px] w-[400px] rounded-full bg-purple-500/[0.03] blur-[120px]" />

      <div className="relative mx-auto max-w-6xl">
        <FadeIn>
          <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">
            One platform. Everything your travel program needs.
          </h2>
        </FadeIn>

        <Stagger className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
          {features.map((f) => (
            <StaggerChild key={f.title}>
              <div className="group rounded-2xl border border-black/[0.06] bg-white/60 p-7 backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.05)]">
                <span className="text-2xl">{f.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            </StaggerChild>
          ))}
        </Stagger>
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
      subtitle: "For startups getting started",
      features: ["Up to 20 bookings/mo", "WhatsApp AI agent", "Basic policy rules", "GST invoice capture", "Email support"],
      cta: "Start Free",
      highlighted: false,
    },
    {
      name: "Growth",
      price: "₹25,000",
      period: "/mo",
      subtitle: "For growing teams",
      badge: "MOST POPULAR",
      features: ["Unlimited bookings", "Advanced policy engine", "Spend analytics dashboard", "Tally/Zoho export", "Approval workflows", "Slack & Teams", "Priority support"],
      cta: "Start Free Pilot",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      subtitle: "For large organizations",
      features: ["Everything in Growth", "Multi-entity support", "SSO/SAML", "API access", "Dedicated account manager", "Custom integrations", "SLA guarantee"],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="relative overflow-hidden px-6 py-24 lg:py-32">
      {/* Gradient accent blob */}
      <div className="pointer-events-none absolute top-1/4 -right-32 h-[400px] w-[400px] rounded-full bg-cyan-500/[0.03] blur-[120px]" />

      <div className="relative mx-auto max-w-6xl">
        <FadeIn>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Start free. Scale when ready.</h2>
            <p className="mt-3 text-lg text-gray-500">No credit card required. No contracts. Cancel anytime.</p>
          </div>
        </FadeIn>

        <Stagger className="mt-16 grid gap-8 lg:grid-cols-3" stagger={0.15}>
          {plans.map((plan) => (
            <StaggerChild key={plan.name}>
              <div className={`relative rounded-2xl border p-8 backdrop-blur-xl transition-all duration-300 ${
                plan.highlighted
                  ? "border-[#0071e3] bg-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_8px_32px_rgba(0,0,0,0.04)] ring-1 ring-[#0071e3]"
                  : "border-black/[0.06] bg-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.05)]"
              }`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-8 inline-flex rounded-full bg-[#0071e3] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-sm text-gray-500">{plan.period}</span>}
                </div>
                <p className="mt-2 text-sm text-gray-500">{plan.subtitle}</p>

                <Link
                  href="/signup"
                  className={`mt-6 block rounded-xl px-6 py-3 text-center text-sm font-medium transition-all active:scale-[0.98] ${
                    plan.highlighted
                      ? "bg-[#0071e3] text-white hover:bg-[#0077ED] hover:shadow-lg hover:shadow-blue-600/25"
                      : "border border-black/[0.1] text-gray-700 hover:border-black/[0.2] hover:bg-gray-50"
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckIcon className="mt-0.5 shrink-0 text-blue-600" />
                      <span className="text-sm text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerChild>
          ))}
        </Stagger>

        <FadeIn delay={0.3}>
          <p className="mt-12 text-center text-sm text-gray-500">
            SkySwift pays for itself — companies recover ₹6-15 lakhs/year in GST credits alone.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Trust / Founder Section ──

function TrustSection() {
  return (
    <section className="relative overflow-hidden px-6 py-24 lg:py-32">
      {/* Gradient accent blob */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-blue-500/[0.03] blur-[120px]" />

      <div className="relative mx-auto max-w-3xl">
        <FadeIn>
          <div className="rounded-2xl border border-black/[0.06] bg-white/80 p-10 text-center backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.06),0_8px_32px_rgba(0,0,0,0.04)] lg:p-14">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Built by people who know travel from the inside.
            </h2>
            <div className="mt-8 space-y-3 text-gray-500">
              <p>10+ years at Booking.com and Amadeus</p>
              <p>Deep expertise in airline distribution, NDC, and travel technology</p>
              <p>Building the travel infrastructure India deserves</p>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600">
              {[
                { icon: "🔒", label: "Encrypted at rest & in transit" },
                { icon: "🇮🇳", label: "India data residency" },
                { icon: "🛡️", label: "SOC 2 ready" },
                { icon: "📋", label: "DPDP Act compliant" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2 rounded-full border border-black/[0.06] px-4 py-2">
                  <span>{b.icon}</span>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ── FAQ ──

function FAQSection() {
  const faqs = [
    { q: "How does WhatsApp booking work?", a: "Employees message the SkySwift WhatsApp bot in plain language (e.g., 'Book BLR to DEL Monday morning'). The AI searches flights, applies your company policy, and shows options. Employee taps to confirm. Done in 30 seconds." },
    { q: "What airlines do you support?", a: "We support 300+ airlines globally via our partnership with Duffel, including all major Indian carriers — IndiGo, Air India, Vistara, SpiceJet, AirAsia India, and more." },
    { q: "How does the policy engine work?", a: "You define rules — cabin class by seniority, spend limits, preferred airlines, advance booking minimums. The AI enforces these automatically. In soft mode, employees see warnings. In hard mode, violations are blocked. Exceptions route to manager approval." },
    { q: "How is GST compliance handled?", a: "Your company GSTIN is captured at setup. For every booking, we auto-generate GST-compliant invoice entries with correct SAC codes, CGST/SGST/IGST split, and ITC eligibility. Export to Tally-compatible CSV anytime." },
    { q: "What happens if someone books out of policy?", a: "Depends on your policy mode. In 'soft' mode, employees see a warning but can proceed (with an audit trail). In 'hard' mode, out-of-policy options are blocked. Either way, exceptions can be routed to manager approval on WhatsApp." },
    { q: "Can I use Slack or Microsoft Teams instead of WhatsApp?", a: "Yes. SkySwift works across WhatsApp, Slack, Microsoft Teams, and our web interface. The same AI agent, same policy engine — just different messaging platforms." },
    { q: "Is my data secure?", a: "All data is encrypted at rest and in transit. We use infrastructure with Row Level Security ensuring strict tenant isolation. India data residency. No employee can see another company's data." },
    { q: "What does the free plan include?", a: "20 bookings per month, WhatsApp bot access, basic travel policy, GST invoice capture. No credit card required. Upgrade anytime." },
  ];

  return (
    <section className="px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </FadeIn>

        <Stagger className="mt-12 space-y-3" stagger={0.05}>
          {faqs.map((faq) => (
            <StaggerChild key={faq.q}>
              <details className="group rounded-2xl border border-black/[0.06] bg-white/60 backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.05)]">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-gray-900">
                  {faq.q}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <div className="border-t border-black/[0.04] px-6 py-4 text-sm leading-relaxed text-gray-500">
                  {faq.a}
                </div>
              </details>
            </StaggerChild>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

// ── Footer CTA ──

function FooterCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0A0F1E] to-[#0F172A] px-6 py-24 lg:py-32">
      {/* Gradient mesh */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/3 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute -bottom-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-cyan-500/8 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-2xl text-center">
        <FadeIn>
          <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Ready to fix corporate travel?
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Start your free pilot today. 20 bookings on us.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-[#0071e3] px-10 py-4 text-base font-medium text-white transition-all hover:bg-[#0077ED] hover:shadow-xl hover:shadow-blue-600/25 active:scale-[0.98]"
            >
              Start Free Pilot <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Footer ──

function Footer() {
  return (
    <footer className="bg-[#0A0F1E] px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
              </div>
              <span className="font-semibold text-white">SkySwift</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              AI corporate travel for India. Book flights in 30 seconds via WhatsApp.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-medium text-white">Product</h4>
            <ul className="space-y-2.5">
              <li><a href="#how-it-works" className="text-sm text-slate-500 transition-colors hover:text-slate-300">How it works</a></li>
              <li><a href="#platform" className="text-sm text-slate-500 transition-colors hover:text-slate-300">Platform</a></li>
              <li><a href="#pricing" className="text-sm text-slate-500 transition-colors hover:text-slate-300">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-medium text-white">Company</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-300">About</a></li>
              <li><a href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-300">Blog</a></li>
              <li><a href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-300">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-medium text-white">Legal</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-300">Privacy</a></li>
              <li><a href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-300">Terms</a></li>
              <li><a href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-300">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-slate-800 pt-8">
          <p className="text-xs text-slate-600">
            &copy; 2026 SkySwift Technologies Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f5f7]">
      <Navbar />
      <HeroSection />
      {/* Dark → Warm transition bridge */}
      <div className="h-24 bg-gradient-to-b from-[#0A0F1E] to-[#f5f5f7]" />
      <ProblemSection />
      <HowItWorksSection />
      <DualValueSection />
      <FeaturesSection />
      <PricingSection />
      <TrustSection />
      <FAQSection />
      {/* Warm → Dark transition bridge */}
      <div className="h-24 bg-gradient-to-b from-[#f5f5f7] to-[#0A0F1E]" />
      <FooterCTA />
      <Footer />
    </main>
  );
}
