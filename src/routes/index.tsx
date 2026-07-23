import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase, GitBranch, Calendar, Sparkles, ArrowRight,
  Globe, Zap, FileText, Check, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookDemoButton } from "@/components/BookDemoButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HireFlow — Modern Applicant Tracking System" },
      { name: "description", content: "HireFlow by Yesp — Post jobs, manage pipelines, run structured interviews, and send AI-generated offer letters — from one workspace." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Globe,     title: "Branded careers page",   body: "Your own job board on a custom subdomain. Publish your first role in under a minute." },
  { icon: GitBranch, title: "Visual pipeline",         body: "Kanban pipeline built for recruiting teams. Drag candidates through customisable stages." },
  { icon: Sparkles,  title: "AI resume scoring",       body: "Automatically rank candidates by role fit. Spend less time reading, more time deciding." },
  { icon: Calendar,  title: "Structured interviews",   body: "Schedule interviews and collect scorecards inside one unified candidate profile." },
  { icon: Zap,       title: "Email automations",       body: "Stage-based triggers and reusable templates. Candidates always know where they stand." },
  { icon: FileText,  title: "Offer letters",           body: "AI-drafted offer letters delivered to candidates and tracked to acceptance in one place." },
];

const CHECKLIST = [
  "Branded careers page", "AI resume scoring", "Visual kanban pipeline",
  "Structured scorecards", "Interview scheduling", "Email automations",
  "AI offer letters", "Talent CRM", "Hiring analytics",
  "Team roles & permissions", "Multiple workspaces", "Unlimited jobs",
];

function Logo({ size = 7 }: { size?: number }) {
  return (
    <div className={`grid h-${size} w-${size} shrink-0 place-items-center rounded-md bg-primary text-primary-foreground`}>
      <Briefcase className={size >= 7 ? "h-4 w-4" : "h-3.5 w-3.5"} />
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-5xl mx-auto select-none pointer-events-none">
      <div className="absolute -inset-6 bg-emerald-500/5 blur-3xl rounded-full" />
      <div className="relative rounded-2xl border bg-card shadow-2xl overflow-hidden">

        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2.5">
          <div className="flex gap-1.5">
            {[0,1,2].map(i => <div key={i} className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />)}
          </div>
          <div className="mx-auto flex items-center gap-1.5 rounded-md bg-background border px-3 py-1 text-[11px] text-muted-foreground">
            <Globe className="h-3 w-3" />
            hireflow.yesp.space/dashboard
          </div>
        </div>

        <img
          src="/dashboard-hero.png"
          alt="HireFlow dashboard — open jobs, pipeline, recent applications and upcoming interviews"
          className="w-full h-auto block"
        />
      </div>
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 h-14">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-sm">
            <Logo size={7} />
            HireFlow
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <Link to="/how-to-use" className="hover:text-foreground transition-colors">Guide</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-sm">Sign in</Button>
            </Link>
            <BookDemoButton className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 h-8 transition-colors">
              Book a demo <Calendar className="h-3.5 w-3.5" />
            </BookDemoButton>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b">
        {/* subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            AI-powered screening & offer letters — included
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-bold tracking-tight leading-[1.05] mb-6 max-w-3xl">
            The hiring platform built for speed.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mb-10">
            Post jobs, manage your pipeline, run structured interviews, and send AI-generated
            offer letters — from one clean workspace.
          </p>

          <div className="flex flex-wrap gap-3 mb-16">
            <BookDemoButton className="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors">
              Book a demo <Calendar className="h-4 w-4" />
            </BookDemoButton>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="h-11 px-6">
                Sign in
              </Button>
            </Link>
          </div>

          <DashboardMockup />
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="border-b bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            <p className="text-xs text-muted-foreground font-medium">Built for every hiring team —</p>
            {["Startups", "Scale-ups", "Agencies", "Enterprise", "Remote teams"].map(label => (
              <span key={label} className="text-xs font-medium text-muted-foreground/70">{label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-xl mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Platform</p>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Everything you need to hire.</h2>
            <p className="text-muted-foreground leading-relaxed">
              No integrations required. Every capability available from the moment you create your workspace.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="group bg-card p-7 hover:bg-muted/20 transition-colors">
                <div className="grid h-9 w-9 place-items-center rounded-xl border bg-emerald-50 mb-5">
                  <Icon className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="font-semibold mb-2">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-b bg-muted/10">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-xl mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Getting started</p>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Up and running in minutes.</h2>
            <p className="text-muted-foreground leading-relaxed">
              No implementation partner, no lengthy onboarding. Sign up and start hiring today.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-10">
            {[
              { n: "01", title: "Create your organisation", body: "Sign up, name your organisation, and create your first hiring workspace in under two minutes." },
              { n: "02", title: "Post your first job",      body: "Write a job description, set pipeline stages, and publish to your branded careers page instantly." },
              { n: "03", title: "Hire with visibility",     body: "AI-score applicants, interview as a team, and send branded offer letters — all in one place." },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex gap-5">
                <div>
                  <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-emerald-500 text-sm font-bold text-emerald-600 shrink-0">
                    {n}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Included ── */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Included</p>
              <h2 className="text-4xl font-bold tracking-tight mb-4">Everything. No upsells.</h2>
              <p className="text-muted-foreground leading-relaxed mb-8 max-w-sm">
                Every feature is available from day one — no upgrades, no sales call to unlock a capability.
              </p>
              <BookDemoButton className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 h-9 transition-colors">
                Book a demo <Calendar className="h-4 w-4" />
              </BookDemoButton>
            </div>
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-8">
              {CHECKLIST.map(item => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <div className="shrink-0 grid h-5 w-5 place-items-center rounded-full bg-emerald-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-b bg-emerald-600">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight mb-5">
              Ready to start hiring smarter?
            </h2>
            <p className="text-emerald-100 text-lg leading-relaxed mb-10">
              Set up your organisation, create a workspace, and publish your first job in under two minutes.
              No credit card required.
            </p>
            <div className="flex flex-wrap gap-3">
              <BookDemoButton className="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-sm transition-colors">
                Book a demo <Calendar className="h-4 w-4" />
              </BookDemoButton>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="h-11 px-6 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50">
                  Sign in <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t bg-background">
        <div className="mx-auto max-w-6xl px-6 py-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-sm">
            <Logo size={6} />
            HireFlow
          </Link>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} HireFlow. All rights reserved.</p>
          <div className="flex gap-5 text-sm text-muted-foreground">
            <Link to="/auth" className="hover:text-foreground transition-colors">Sign in</Link>
            <BookDemoButton className="hover:text-foreground transition-colors">Book a demo</BookDemoButton>
          </div>
        </div>
      </footer>

    </div>
  );
}
