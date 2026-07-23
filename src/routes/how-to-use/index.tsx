import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Briefcase, ChevronRight, Building2, Globe2,
  Users, GitBranch, Sparkles, LayoutDashboard, Calendar, Zap, FileText,
  ShieldCheck, ClipboardList,
} from "lucide-react";
import { STEPS } from "@/lib/how-to-use-data";
import { BookDemoButton } from "@/components/BookDemoButton";

export const Route = createFileRoute("/how-to-use/")({
  head: () => ({
    meta: [
      { title: "How to Use HireFlow — Complete Step-by-Step Guide | Yesp" },
      { name: "description", content: "The complete guide to setting up and using HireFlow by Yesp. From creating your organisation and posting jobs to scheduling interviews, setting up automations, and sending AI offer letters." },
      { name: "keywords", content: "how to use HireFlow, HireFlow guide, HireFlow tutorial, Yesp HireFlow setup, ATS guide, hiring software tutorial, HireFlow steps" },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "How to Use HireFlow — Complete Step-by-Step Guide" },
      { property: "og:description", content: "11-step guide to hiring with HireFlow by Yesp. Create an org, post jobs, AI-screen candidates, run interviews, automate emails, send offer letters, and onboard new hires." },
      { property: "og:type", content: "website" },
    ],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "How to Use HireFlow — Complete Hiring Guide",
        description: "A step-by-step guide to setting up HireFlow by Yesp and running your first hiring process from job post to offer letter.",
        totalTime: "PT15M",
        step: STEPS.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.title,
          text: s.description,
          url: `https://hireflow.yesp.space/how-to-use/${s.slug}`,
        })),
      }),
    }],
  }),
  component: HowToUseIndex,
});

const STEP_ICONS = [Building2, Globe2, Briefcase, Globe2, Sparkles, ShieldCheck, GitBranch, Calendar, Zap, FileText, ClipboardList];

const STATS = [
  { value: "11", label: "Steps" },
  { value: "15 min", label: "Setup time" },
  { value: "100%", label: "Free to try" },
];

function HowToUseIndex() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white antialiased">

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0f1a]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 h-14 text-sm text-white/60">
          <Link to="/" className="flex items-center gap-2 font-bold text-white">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground shrink-0">
              <Briefcase className="h-4 w-4" />
            </div>
            HireFlow
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium text-white">How to use</span>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Radial glow */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-white/60 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
            Complete guide to HireFlow
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.04] mb-6 max-w-4xl">
            From sign-up to{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              first hire.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/50 leading-relaxed max-w-2xl mb-12">
            Everything you need to run a structured hiring process with HireFlow by Yesp — in {STEPS.length} steps and under 15 minutes.
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-8 mb-12">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-bold tabular-nums text-white">{value}</p>
                <p className="text-xs text-white/40 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Link to="/auth">
              <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-colors px-6 py-3 text-sm font-semibold text-white">
                Get started free <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
            <Link to="/how-to-use/$step" params={{ step: STEPS[0].slug }}>
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-colors px-6 py-3 text-sm font-semibold text-white/80">
                Read the guide
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Steps list ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/30 mb-2">All steps</p>
          <h2 className="text-2xl font-bold text-white">Your complete playbook</h2>
        </div>

        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const Icon = STEP_ICONS[i] ?? Briefcase;
            return (
              <Link
                key={step.slug}
                to="/how-to-use/$step"
                params={{ step: step.slug }}
                className="group relative flex items-start gap-5 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all duration-200 p-5 overflow-hidden"
              >
                {/* Step number — large decorative */}
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[64px] font-black text-white/[0.04] select-none tabular-nums leading-none group-hover:text-white/[0.07] transition-colors">
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Step index pill */}
                <div className="shrink-0 grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white/50 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-all">
                  {String(i + 1).padStart(2, "0")}
                </div>

                {/* Icon */}
                <div className="shrink-0 grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/40 group-hover:border-white/20 group-hover:text-white/70 transition-all">
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 relative">
                  <p className="text-[15px] font-semibold text-white/90 group-hover:text-white transition-colors mb-1">{step.title}</p>
                  <p className="text-sm text-white/40 leading-relaxed line-clamp-2 group-hover:text-white/55 transition-colors max-w-2xl">
                    {step.description}
                  </p>
                </div>

                {/* Arrow */}
                <div className="shrink-0 grid h-9 w-9 place-items-center rounded-xl border border-white/8 bg-transparent group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-all self-center">
                  <ArrowRight className="h-4 w-4 text-white/30 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-950/60 via-[#0d1f18] to-teal-950/40 overflow-hidden p-10 sm:p-14">
          {/* Glow */}
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-400/70 mb-3">Ready to hire smarter?</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Start in under 2 minutes.</h2>
                <p className="text-white/50 text-sm max-w-md">No credit card required. All features unlocked from day one. Your first job post goes live in under 2 minutes.</p>
              </div>
              <div className="flex flex-col gap-3 shrink-0">
                <Link to="/auth">
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-colors px-7 py-3.5 text-sm font-semibold text-white whitespace-nowrap">
                    Create free account <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
                <BookDemoButton className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors px-7 py-3.5 text-sm font-semibold text-white/80 whitespace-nowrap">
                  Book a demo
                </BookDemoButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between gap-4 text-xs text-white/30">
          <Link to="/" className="hover:text-white/60 transition-colors">HireFlow by Yesp</Link>
          <p>© {new Date().getFullYear()} HireFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
