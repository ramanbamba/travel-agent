import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { WhatsAppHeroDemo } from "@/components/landing/whatsapp-hero-demo";
import { FadeIn, Stagger, StaggerChild, CountUp, WordReveal, HoverTilt } from "@/components/landing/animations";

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

function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background pt-32 pb-20 md:pt-40 lg:pt-48 selection:bg-blue-500/30">
      {/* Premium glowing background mesh */}
      <div className="absolute inset-0 z-0 bg-mesh-dark opacity-80" />

      {/* Animated glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px] animate-float-slow" />
      <div className="absolute top-[20%] right-[-5%] h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-[-20%] left-[20%] h-[600px] w-[600px] rounded-full bg-blue-400/5 blur-[150px] animate-pulse-glow" />

      {/* Grain overlay for texture */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.02]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-8">
          {/* Left / Top: Copy */}
          <div className="max-w-2xl">
            <FadeIn delay={0.1} direction="up">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.15)] ring-1 ring-white/10 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                </span>
                The Future of Corporate Travel
              </div>
            </FadeIn>

            <h1 className="text-[2.75rem] font-bold leading-[1.05] tracking-tight text-white sm:text-6xl xl:text-[72px]">
              <WordReveal
                text="Your AI travel desk."
                highlightWords={[]}
              />
              <br />
              <WordReveal
                text="30 seconds. WhatsApp."
                highlightWords={["30", "seconds.", "WhatsApp."]}
                highlightClass="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.3)]"
              />
            </h1>

            <FadeIn delay={0.6} direction="up">
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-slate-400 sm:text-xl">
                Replace your sluggish travel desk with an AI agent that books flights, enforces policy, and recovers GST instantly. Built for teams that move fast.
              </p>
            </FadeIn>

            <FadeIn delay={0.8} direction="up">
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/signup"
                  className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-blue-600 px-8 text-base font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] active:scale-[0.98]"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  Start Free Pilot <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex h-14 items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 text-base font-medium text-slate-300 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white active:scale-[0.98]"
                >
                  See How It Works
                </a>
              </div>
            </FadeIn>

            <FadeIn delay={1.0} direction="up">
              <div className="mt-12 flex items-center gap-6 text-sm font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-8 w-8 rounded-full border-2 border-[#050A15] bg-gradient-to-br ${i % 2 === 0 ? 'from-indigo-400 to-indigo-600' : 'from-blue-400 to-blue-600'} flex items-center justify-center text-[10px] text-white font-bold`}>
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="ml-2">100+ Companies</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                  <span>India Data Residency</span>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Right: Premium glowing animated WhatsApp mockup */}
          <div className="relative mx-auto w-full max-w-[340px] lg:mr-0 lg:max-w-[380px]">
            <FadeIn delay={0.4} direction="scale">
              <WhatsAppHeroDemo />
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Problem Section ──

function ProblemSection() {
  const problems = [
    { metric: 60, suffix: "%", label: "Managed via WhatsApp Screenshots", description: "Indian corporate travel flows through unstructured screenshots and emails. No policy adherence, zero visibility, and broken GST compliance." },
    { metric: 15, prefix: "₹", suffix: "L+", label: "Lost in Unclaimed GST Credits", description: "Mid-size companies lose massive chunks of revenue annually in unclaimed input tax credits because invoices are buried or formatted incorrectly." },
    { metric: 30, suffix: "+ mins", label: "Per Booking on Legacy Tools", description: "Employees default to consumer OTAs because legacy corporate tools are unusable. The result: rogue spend and total loss of corporate negotiated rates." },
  ];

  return (
    <section className="relative overflow-hidden bg-background px-6 py-24 lg:py-32">
      {/* Background radial gradient specifically for this section */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-blue-900/10 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl">
        <FadeIn direction="up">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-400 backdrop-blur-md">
              The Standard is Broken
            </div>
            <h2 className="max-w-4xl text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              The corporate travel platform built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">speed and control.</span>
            </h2>
          </div>
        </FadeIn>

        <Stagger className="mt-20 grid gap-6 md:grid-cols-3" stagger={0.15}>
          {problems.map((p, index) => (
            <StaggerChild key={p.label} className={index === 0 ? "md:col-span-2 lg:col-span-1" : ""}>
              <HoverTilt rotationRatio={5} className="h-full">
                <div className="relative h-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]">

                  {/* Subtle inner top highlight */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

                  {/* Decorative corner glow */}
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl" />

                  <div className="relative z-10">
                    <div className="font-mono text-5xl font-bold tracking-tighter text-blue-400 lg:text-[4rem]">
                      <CountUp end={p.metric} prefix={p.prefix ?? ""} suffix={p.suffix} duration={2} />
                    </div>
                    <div className="mt-8 flex items-center gap-3">
                      <div className="h-1 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                      <h3 className="text-lg font-semibold text-white">{p.label}</h3>
                    </div>
                    <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
                      {p.description}
                    </p>
                  </div>
                </div>
              </HoverTilt>
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
      title: "Message your AI agent",
      description: "Just tell it where you need to go in natural language. No legacy apps or clunky forms. WhatsApp is your UI.",
      visual: (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F1E] p-4 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-50" />
          <div className="relative rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-[13px] text-green-50 shadow-[0_0_15px_rgba(34,197,94,0.1)] backdrop-blur-md">
            &ldquo;Book BLR to DEL Monday morning&rdquo;
          </div>
        </div>
      ),
    },
    {
      num: "02",
      title: "AI enforces policy",
      description: "Your corporate policy is applied instantly. The AI filters out non-compliant options and recommends the best value flights.",
      visual: (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F1E] p-4 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 opacity-50" />
          <div className="relative space-y-2 text-xs">
            <div className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 shadow-[0_0_15px_rgba(59,130,246,0.1)] backdrop-blur-md">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">✓</span>
              <span className="text-white">IndiGo 6E-234 · ₹4,850</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-md">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-slate-400">−</span>
              <span className="text-slate-400 opacity-60">Out of policy · Too expensive</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      num: "03",
      title: "Confirm & booked",
      description: "Confirm with a tap. Auto-capture GST invoices, notify managers, and track spend live on your dashboard.",
      visual: (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F1E] p-4 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-50" />
          <div className="relative rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 backdrop-blur-md text-xs">
            <p className="flex items-center gap-2 font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Booked & Confirmed
            </p>
            <p className="mt-2 text-slate-300">PNR: <strong className="text-white">SKY7X2M</strong> <br /><span className="text-slate-500">GST Invoice Captured</span></p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="relative overflow-hidden bg-[#020617] px-6 py-24 lg:py-32 border-t border-white/5">
      {/* Subtle Background Elements */}
      <div className="pointer-events-none absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 -translate-x-1/2 rounded-[100%] bg-indigo-900/10 blur-[100px]" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-[400px] w-[400px] rounded-[100%] bg-blue-900/10 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl">
        <FadeIn direction="up">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              <WordReveal text="3 messages. 30 seconds." highlightWords={["3", "messages.", "30", "seconds."]} highlightClass="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400" />
              <br />
              Done.
            </h2>
            <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
              No apps to install. No forms to fill. Your entire organization books compliant travel instantly through WhatsApp.
            </p>
          </div>
        </FadeIn>

        <div className="relative mt-20">
          {/* Glowing connecting line (Desktop Horizontal) */}
          <div className="hidden md:block absolute top-[140px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-blue-900/0 via-blue-500/50 to-blue-900/0">
            <div className="h-full w-1/3 bg-blue-400 blur-[2px] opacity-75 animate-[shimmer_3s_ease-in-out_infinite]" />
          </div>

          <Stagger className="grid gap-12 md:grid-cols-3 md:gap-8 lg:gap-12" stagger={0.2}>
            {steps.map((step) => (
              <StaggerChild key={step.num}>
                <div className="group relative flex flex-col items-center text-center">

                  {/* Visual Container */}
                  <HoverTilt rotationRatio={8} className="w-full">
                    <div className="mb-8 w-full transition-transform duration-500 group-hover:-translate-y-2">
                      {step.visual}
                    </div>
                  </HoverTilt>

                  {/* Step Number Badge */}
                  <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#0A0F1E] shadow-[0_0_30px_rgba(59,130,246,0.15)] backdrop-blur-xl transition-all duration-300 group-hover:border-blue-500/50 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] group-hover:bg-blue-950/30">
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="font-mono text-xl font-bold text-slate-300 transition-colors duration-300 group-hover:text-blue-400">{step.num}</span>
                  </div>

                  {/* Text Content */}
                  <h3 className="text-xl font-semibold text-white transition-colors duration-300 group-hover:text-blue-50">{step.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-400 max-w-[280px]">
                    {step.description}
                  </p>
                </div>
              </StaggerChild>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

// ── Dual Value Tabs ──

function DualValueSection() {
  const managerFeatures = [
    { icon: "🛡️", title: "Policy on Autopilot", desc: "Set rules once. Cabin class, spend limits, preferred airlines — the AI enforces everything." },
    { icon: "📊", title: "Live Spend Visibility", desc: "See every rupee spent. By department, by employee, by route. No quarterly surprises." },
    { icon: "🧾", title: "Automated GST", desc: "Every booking captures GST invoices. One-click export to Tally. Recover up to 18%." },
    { icon: "✅", title: "WhatsApp Approvals", desc: "Out-of-policy bookings route to managers on WhatsApp. Fast 1-tap approvals." },
  ];

  const employeeFeatures = [
    { icon: "💬", title: "Book on WhatsApp", desc: "No portal to remember. Message SkySwift on WhatsApp and get booked in 30 seconds." },
    { icon: "🧠", title: "Learns Preferences", desc: "Always want an aisle seat? Morning flights? SkySwift remembers your choices." },
    { icon: "⚡", title: "One-Tap Changes", desc: "'Change my Delhi flight to Thursday' — that's it. No hold music, no forms." },
    { icon: "📱", title: "Works Everywhere", desc: "WhatsApp, Slack, or Microsoft Teams. Book from wherever you already work." },
  ];

  return (
    <section id="platform" className="relative overflow-hidden bg-background px-6 py-24 lg:py-32">
      {/* Subtle background glow */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-900/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        <FadeIn direction="up">
          <div className="text-center">
            <h2 className="mx-auto max-w-4xl text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
              Complete control for finance.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Unmatched speed for employees.</span>
            </h2>
            <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
              We eliminated the trade-off. Give your finance team real-time visibility and policy enforcement, while giving employees a booking experience they actually love.
            </p>
          </div>
        </FadeIn>

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* For Managers Card */}
          <FadeIn delay={0.1} direction="right">
            <HoverTilt rotationRatio={2} className="h-full">
              <div className="group relative h-full overflow-hidden rounded-[2.5rem] bg-[#0A0F1E] p-8 lg:p-12 border border-white/5 transition-colors hover:bg-[#0A0F1E]/80">
                {/* Animated Gradient Border Glow */}
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute -inset-px -z-10 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent opacity-50" />

                <div className="relative z-10">
                  <div className="mb-8 inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-400 backdrop-blur-md">
                    For Finance & Admins
                  </div>
                  <h3 className="mb-10 text-3xl font-bold text-white leading-tight">Complete control.<br /><span className="text-blue-400">Zero manual work.</span></h3>

                  <div className="space-y-8">
                    {managerFeatures.map((f) => (
                      <div key={f.title} className="flex gap-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-xl shadow-inner backdrop-blur-sm">
                          {f.icon}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-white">{f.title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-400">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </HoverTilt>
          </FadeIn>

          {/* For Employees Card */}
          <FadeIn delay={0.3} direction="left">
            <HoverTilt rotationRatio={2} className="h-full">
              <div className="group relative h-full overflow-hidden rounded-[2.5rem] bg-[#0A0F1E] p-8 lg:p-12 border border-white/5 transition-colors hover:bg-[#0A0F1E]/80">
                {/* Animated Gradient Border Glow */}
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-teal-600/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute -inset-px -z-10 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent opacity-50" />

                <div className="relative z-10">
                  <div className="mb-8 inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-400 backdrop-blur-md">
                    For Employees
                  </div>
                  <h3 className="mb-10 text-3xl font-bold text-white leading-tight">The fastest way to<br /><span className="text-emerald-400">book a work trip.</span></h3>

                  <div className="space-y-8">
                    {employeeFeatures.map((f) => (
                      <div key={f.title} className="flex gap-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-xl shadow-inner backdrop-blur-sm">
                          {f.icon}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-white">{f.title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-400">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </HoverTilt>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ── Features Grid ──

function FeaturesSection() {
  const features = [
    { title: "AI Booking Agent", desc: "Natural language booking via WhatsApp, Slack, or web. Handles 80%+ of corporate trips end-to-end without human intervention.", icon: "🤖", color: "from-blue-500 to-indigo-500" },
    { title: "Policy Engine", desc: "Rules-based enforcement with AI interpretation. Hard blocks, soft warnings, exception requests — all configurable.", icon: "🛡️", color: "from-indigo-500 to-purple-500" },
    { title: "GST Compliance", desc: "Automatic invoice capture, GSTIN validation, ITC tracking, and Tally-ready exports. The feature Indian CFOs need.", icon: "🧾", color: "from-purple-500 to-pink-500" },
    { title: "Spend Analytics", desc: "Real-time dashboards, department breakdowns, route analysis, advance booking insights. Complete visibility.", icon: "📊", color: "from-pink-500 to-rose-500" },
    { title: "Preference Learning", desc: "Gets smarter with every booking. Airline preferences, time-of-day patterns, seat choices — applied automatically.", icon: "🧠", color: "from-rose-500 to-orange-500" },
    { title: "Works Where You Work", desc: "WhatsApp for the field. Slack for the office. Teams for the enterprise. Web for everything else.", icon: "🔗", color: "from-orange-500 to-yellow-500" },
  ];

  return (
    <section className="relative overflow-hidden bg-[#020617] px-6 py-24 lg:py-32 border-t border-white/5">
      {/* Background ambient light blobs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[150px] animate-pulse-glow" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-purple-600/10 blur-[150px] animate-aura-spin" />

      <div className="relative mx-auto max-w-7xl">
        <FadeIn direction="up">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-5xl">
              The infrastructure for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">modern corporate travel.</span>
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              Enterprise-grade tools disguised as a simple chat interface. Everything required to run a global travel program over WhatsApp.
            </p>
          </div>
        </FadeIn>

        <Stagger className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
          {features.map((f) => (
            <StaggerChild key={f.title} className="h-full">
              <HoverTilt rotationRatio={3} className="h-full">
                <div className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-[#0A0F1E]/80 p-8 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-[#0A0F1E]">

                  {/* Neon Glow Behind Icon */}
                  <div className={`absolute -left-4 -top-4 h-32 w-32 rounded-full bg-gradient-to-br ${f.color} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20`} />

                  {/* Icon Container */}
                  <div className={`relative mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} p-[1px] shadow-lg`}>
                    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#0A0F1E]">
                      <span className="text-2xl drop-shadow-md">{f.icon}</span>
                    </div>
                  </div>

                  {/* Text Content */}
                  <h3 className="mb-3 text-xl font-semibold text-white transition-colors group-hover:text-blue-50">{f.title}</h3>
                  <p className="text-[15px] leading-relaxed text-slate-400">{f.desc}</p>

                  {/* Subtle inner top highlight */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent transition-opacity duration-300 group-hover:opacity-50" />
                </div>
              </HoverTilt>
            </StaggerChild>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

// ── Pricing ──

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
    <section id="pricing" className="relative overflow-hidden bg-background px-6 py-24 lg:py-32">
      {/* Deep glow behind pricing cards */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[800px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-900/10 blur-[150px]" />

      <div className="relative mx-auto max-w-6xl">
        <FadeIn direction="up">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">Start free. <span className="text-blue-400">Scale when ready.</span></h2>
            <p className="mt-4 text-lg text-slate-400">No credit card required. No contracts. Cancel anytime.</p>
          </div>
        </FadeIn>

        <Stagger className="mt-20 grid gap-8 lg:grid-cols-3 lg:items-center" stagger={0.15}>
          {plans.map((plan) => (
            <StaggerChild key={plan.name} className={plan.highlighted ? "z-10" : ""}>
              <div
                className={`group relative rounded-[2rem] p-8 transition-transform duration-300 ${plan.highlighted
                  ? "scale-105 border-transparent bg-[#0A0F1E] shadow-[0_0_50px_rgba(59,130,246,0.3)] lg:p-10"
                  : "border border-white/5 bg-[#0A0F1E]/50 backdrop-blur-md hover:border-white/10 hover:bg-[#0A0F1E]/80"
                  }`}
              >
                {/* Animated Gradient Border for Highlighted Plan */}
                {plan.highlighted && (
                  <div className="pointer-events-none absolute -inset-[2px] -z-10 rounded-[2rem] bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 opacity-70 blur-[2px]" />
                )}

                {/* Subtle Inner Glow */}
                <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-b from-white/5 to-transparent opacity-50" />

                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full border border-blue-400/50 bg-blue-500/20 px-4 py-1.5 shadow-[0_0_20px_rgba(59,130,246,0.5)] backdrop-blur-md">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-blue-300">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <h3 className={`text-xl font-medium ${plan.highlighted ? "text-blue-400" : "text-slate-300"}`}>{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight text-white">{plan.price}</span>
                  {plan.period && <span className="text-sm font-medium text-slate-500">{plan.period}</span>}
                </div>
                <p className="mt-4 text-[15px] text-slate-400">{plan.subtitle}</p>

                <Link
                  href="/signup"
                  className={`mt-8 block rounded-xl px-6 py-4 text-center text-[15px] font-semibold transition-all active:scale-[0.98] ${plan.highlighted
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/50 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/25"
                    : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                    }`}
                >
                  {plan.cta}
                </Link>

                <ul className="mt-10 space-y-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <CheckIcon className={`mt-[2px] h-5 w-5 shrink-0 ${plan.highlighted ? "text-blue-400" : "text-slate-500"}`} />
                      <span className="text-[15px] text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerChild>
          ))}
        </Stagger>

        <FadeIn delay={0.4} direction="up">
          <p className="mt-16 text-center text-[15px] text-slate-400">
            SkySwift pays for itself — companies recover <span className="font-semibold text-white">₹6-15 lakhs/year</span> in GST credits alone.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Trust / Security Section ──

function TrustSection() {
  return (
    <section className="relative overflow-hidden bg-background px-6 py-24 lg:py-32">
      {/* Subtle glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-blue-500/5 blur-[120px]" />

      <div className="relative mx-auto max-w-4xl">
        <FadeIn direction="up">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0F1E] p-10 text-center shadow-2xl lg:p-14">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Enterprise security. <span className="text-slate-500">Bank-grade compliance.</span>
            </h2>
            <div className="mt-8 space-y-4 text-[15px] text-slate-400">
              <p>Trusted by India&apos;s fastest-growing companies.</p>
              <p>Rigorous data isolation, end-to-end encryption, and continuous monitoring.</p>
              <p>Because your corporate data should never be a compromise.</p>
            </div>

            <div className="mt-14 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-300">
              {[
                { icon: "🔒", label: "AES-256 Encryption" },
                { icon: "🇮🇳", label: "India Data Residency" },
                { icon: "🛡️", label: "SOC 2 Type II" },
                { icon: "📋", label: "DPDP Compliant" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm transition-colors hover:bg-white/10 hover:border-white/20">
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
    { q: "How does WhatsApp booking work?", a: "Employees message the SkySwift WhatsApp bot in natural language (e.g., 'Book BLR to DEL Monday morning'). The AI searches flights, applies your company policy, and shows options. Tap to confirm. Done in 30 seconds." },
    { q: "What airlines do you support?", a: "We support 300+ airlines globally, including all major Indian carriers — IndiGo, Air India, Vistara, SpiceJet, AirAsia India, and more." },
    { q: "How does the policy engine work?", a: "Define rules by seniority — cabin class, spend limits, advance booking metrics. The AI enforces these automatically. Exceptions route to managers for 1-tap WhatsApp approval." },
    { q: "How is GST compliance handled?", a: "Your GSTIN is captured at setup. For every booking, we auto-generate GST-compliant invoice entries with exact SAC codes and ITC eligibility. Export to Tally instantly." },
    { q: "Is my data secure?", a: "Extremely. Data is encrypted at rest and in transit. We maintain strict tenant isolation with India data residency. No employee can ever see another company's data." },
  ];

  return (
    <section className="relative overflow-hidden bg-[#020617] px-6 py-24 lg:py-32 border-t border-white/5">
      <div className="mx-auto max-w-3xl">
        <FadeIn direction="up">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-slate-400">Everything you need to know about SkySwift.</p>
          </div>
        </FadeIn>

        <Stagger className="space-y-4" stagger={0.05}>
          {faqs.map((faq) => (
            <StaggerChild key={faq.q}>
              <details className="group rounded-2xl border border-white/5 bg-[#0A0F1E]/80 backdrop-blur-md transition-all duration-300 hover:border-white/10 hover:bg-[#0A0F1E] open:bg-[#0A0F1E] open:border-white/10">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-[15px] font-semibold text-white outline-none">
                  {faq.q}
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 transition-transform duration-200 group-open:rotate-180">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </summary>
                <div className="border-t border-white/5 px-6 pb-5 pt-3 text-[14.5px] leading-relaxed text-slate-400">
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
    <section className="relative overflow-hidden bg-[#050A15] px-6 py-24 lg:py-32 border-t border-white/5">
      {/* Dark premium gradient mesh */}
      <div className="pointer-events-none absolute inset-0 mix-blend-screen">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] translate-y-1/3 rounded-full bg-indigo-500/20 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <FadeIn direction="up">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Ready to upgrade your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">corporate travel?</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
            Start your free pilot today. Get 20 bookings on us and see the difference AI makes.
          </p>
          <div className="mt-10">
            <Link
              href="/signup"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-8 py-4 text-base font-bold text-[#050A15] transition-transform hover:scale-105 active:scale-95"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-100 to-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative">Start Free Pilot</span>
              <ArrowRight className="relative h-5 w-5 transition-transform group-hover:translate-x-1" />
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
    <footer className="border-t border-white/5 bg-[#020617] px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-4 lg:gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">SkySwift</span>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-slate-400 max-w-xs">
              AI corporate travel for India. Book flights in 30 seconds via WhatsApp. Enforce policy, capture GST automatically.
            </p>
          </div>
          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-wider text-slate-300">Product</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#how-it-works" className="transition-colors hover:text-white">How it works</a></li>
              <li><a href="#platform" className="transition-colors hover:text-white">Platform</a></li>
              <li><a href="#pricing" className="transition-colors hover:text-white">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-wider text-slate-300">Company</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="transition-colors hover:text-white">About Us</a></li>
              <li><a href="#" className="transition-colors hover:text-white">Blog</a></li>
              <li><a href="#" className="transition-colors hover:text-white">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-wider text-slate-300">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="transition-colors hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="transition-colors hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="transition-colors hover:text-white">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-16 flex flex-col items-center justify-between border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} SkySwift Technologies Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050A15] selection:bg-blue-500/30">
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

