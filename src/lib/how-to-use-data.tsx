import {
  Briefcase, Users, GitBranch, Calendar, FileText, Globe,
  Layers, Building2, LayoutDashboard, Zap, Search, Sparkles,
  CheckCircle2, Check, Clock, Video, MapPin, MailWarning,
  ToggleRight, ArrowRight, Bell, Upload, ShieldCheck, ClipboardList,
} from "lucide-react";

// ─── Step data ────────────────────────────────────────────────────────────────

export interface HowToStep {
  slug: string;
  title: string;
  shortTitle: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  description: string;
  details: { heading: string; body: string }[];
  tips: string[];
  mockup: React.ReactNode;
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Briefcase,       label: "Jobs" },
  { icon: GitBranch,       label: "Pipeline" },
  { icon: Users,           label: "Candidates" },
  { icon: Calendar,        label: "Interviews" },
  { icon: Zap,             label: "Automations" },
  { icon: FileText,        label: "Offer Letters" },
];

function MiniSidebar({ active }: { active: string }) {
  return (
    <div className="w-36 shrink-0 border-r bg-card flex flex-col p-2 gap-0.5">
      <div className="flex items-center gap-1.5 px-2 py-1.5 mb-2">
        <div className="grid h-5 w-5 place-items-center rounded-md bg-primary text-primary-foreground shrink-0">
          <Briefcase className="h-3 w-3" />
        </div>
        <span className="text-[10px] font-bold">HireFlow</span>
      </div>
      {SIDEBAR_ITEMS.map(({ icon: Icon, label }) => (
        <div key={label} className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] ${label === active ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"}`}>
          <Icon className="h-3 w-3 shrink-0" />{label}
        </div>
      ))}
    </div>
  );
}

export function MockupShell({ url, children, height = "h-[320px]" }: { url: string; children: React.ReactNode; height?: string }) {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-emerald-500/5 blur-2xl rounded-full" />
      <div className="relative rounded-2xl border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2.5 shrink-0">
          <div className="flex gap-1.5">
            {[0,1,2].map(k => <div key={k} className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />)}
          </div>
          <div className="mx-auto flex items-center gap-1.5 rounded-md bg-background border px-3 py-1 text-[11px] text-muted-foreground">
            <Globe className="h-3 w-3" />
            {url}
          </div>
        </div>
        <div className={`flex ${height} select-none pointer-events-none`}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Individual mockups ───────────────────────────────────────────────────────

function OnboardingStep1Mockup() {
  return (
    <MockupShell url="hireflow.yesp.space/onboarding" height="h-auto">
      <div className="bg-gray-50 p-6 w-full select-none pointer-events-none">
        <div className="flex items-center justify-center gap-3 mb-6">
          {["Organisation", "Workspace", "Brand"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-gray-200" />}
              <div className="flex items-center gap-1.5">
                <div className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${i === 0 ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"}`}>{i + 1}</div>
                <span className={`text-[11px] font-medium hidden sm:block ${i === 0 ? "text-indigo-700" : "text-gray-400"}`}>{label}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-sm mx-auto bg-white rounded-xl border shadow-sm p-5">
          <h2 className="text-[14px] font-semibold text-gray-900 mb-0.5">Create your Organisation</h2>
          <p className="text-[10px] text-gray-500 mb-4">This is the top-level container for your entire company.</p>
          <div className="space-y-3">
            {[
              { label: "Organisation name", icon: Building2, value: "Yesp Studio" },
              { label: "Industry", icon: Layers, value: "Technology" },
              { label: "Website", icon: Globe, value: "https://yesp.co" },
            ].map(({ label, icon: Icon, value }) => (
              <div key={label}>
                <p className="text-[10px] font-medium text-gray-700 mb-1">{label}</p>
                <div className="flex items-center gap-2 rounded-md border border-gray-200 px-2.5 py-1.5 bg-white">
                  <Icon className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="text-[11px] text-gray-700">{value}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-[11px] font-semibold text-white">Continue →</button>
        </div>
      </div>
    </MockupShell>
  );
}

function OnboardingStep2Mockup() {
  return (
    <MockupShell url="hireflow.yesp.space/onboarding" height="h-auto">
      <div className="bg-gray-50 p-6 w-full select-none pointer-events-none">
        <div className="flex items-center justify-center gap-3 mb-6">
          {["Organisation", "Workspace", "Brand"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className={`w-8 h-px ${i <= 1 ? "bg-indigo-300" : "bg-gray-200"}`} />}
              <div className="flex items-center gap-1.5">
                <div className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${i <= 1 ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                  {i === 0 ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span className={`text-[11px] font-medium hidden sm:block ${i === 1 ? "text-indigo-700" : i === 0 ? "text-indigo-400" : "text-gray-400"}`}>{label}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-sm mx-auto bg-white rounded-xl border shadow-sm p-5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 mb-3">
            <span className="text-[9px] font-medium text-indigo-600">Yesp Studio</span>
          </div>
          <h2 className="text-[14px] font-semibold text-gray-900 mb-0.5">Create your first Workspace</h2>
          <p className="text-[10px] text-gray-500 mb-4">Workspaces separate hiring for different teams or regions.</p>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-medium text-gray-700 mb-1">Workspace name</p>
              <div className="flex items-center gap-2 rounded-md border border-gray-200 px-2.5 py-1.5">
                <Layers className="h-3 w-3 text-gray-400 shrink-0" />
                <span className="text-[11px] text-gray-700">Engineering Hiring</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-700 mb-1">Careers page subdomain</p>
              <div className="flex items-center gap-0 rounded-md border border-emerald-400 bg-emerald-50/40 overflow-hidden">
                <span className="px-2 py-1.5 text-[10px] text-gray-400 bg-muted/40 border-r">hireflow.io/c/</span>
                <span className="px-2 py-1.5 text-[11px] text-gray-700 flex-1">yesp-engineering</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mr-2 shrink-0" />
              </div>
              <p className="text-[9px] text-emerald-600 mt-1">✓ Subdomain is available</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="flex-1 rounded-lg border py-2 text-[11px] font-medium text-gray-600">Back</button>
            <button className="flex-1 rounded-lg bg-indigo-600 py-2 text-[11px] font-semibold text-white">Continue →</button>
          </div>
        </div>
      </div>
    </MockupShell>
  );
}

function JobsMockup() {
  return (
    <MockupShell url="hireflow.yesp.space/jobs">
      <MiniSidebar active="Jobs" />
      <div className="flex-1 bg-background overflow-hidden flex flex-col">
        <div className="px-4 pt-3 pb-2 border-b flex items-center justify-between shrink-0">
          <div>
            <p className="text-[9px] text-muted-foreground">Workspace · Jobs</p>
            <p className="text-[13px] font-semibold">Jobs</p>
          </div>
          <div className="rounded-md bg-primary px-2 py-1 text-[9px] font-medium text-primary-foreground flex items-center gap-1">+ New job</div>
        </div>
        <div className="flex gap-1 px-4 py-2 border-b shrink-0">
          {["All (4)", "Published (2)", "Drafts (1)", "Closed (1)"].map((t, i) => (
            <div key={t} className={`rounded-md px-2 py-0.5 text-[9px] font-medium ${i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>{t}</div>
          ))}
        </div>
        <div className="flex-1 overflow-hidden divide-y">
          {[
            { title: "Business Development Executive", dept: "Sales", type: "Full-time", apps: 8, dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", status: "Published" },
            { title: "Frontend Developer (React.js)", dept: "Engineering", type: "Full-time", apps: 6, dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", status: "Published" },
            { title: "HR Executive", dept: "Human Resources", type: "Full-time", apps: 4, dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600 border-slate-200", status: "Draft" },
            { title: "Product Designer", dept: "Design", type: "Contract", apps: 2, dot: "bg-orange-400", badge: "bg-orange-50 text-orange-700 border-orange-200", status: "Closed" },
          ].map(({ title, dept, type, apps, dot, badge, status }) => (
            <div key={title} className="flex items-center gap-2.5 px-4 py-2">
              <div className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium truncate">{title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Layers className="h-2 w-2" />{dept}</span>
                  <span className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2 w-2" />{type}</span>
                  <span className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Users className="h-2 w-2" />{apps} apps</span>
                </div>
              </div>
              <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-medium border ${badge}`}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    </MockupShell>
  );
}

function CareersMockup() {
  return (
    <MockupShell url="hireflow.io/c/yesp-engineering" height="h-auto">
      <div className="w-full select-none pointer-events-none">
        <div className="flex items-center justify-between px-6 py-3 border-b bg-white/80">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-indigo-600 text-white"><Building2 className="h-4 w-4" /></div>
            <span className="text-[12px] font-semibold text-gray-900">Yesp Studio</span>
          </div>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" />yesp.co</span>
        </div>
        <div className="bg-indigo-600 px-6 py-8 text-white">
          <h2 className="text-[18px] font-semibold mb-1">Join our team</h2>
          <p className="text-[11px] text-indigo-200 mb-3">Open roles. Apply directly — we'll get back to you fast.</p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-indigo-200 flex items-center gap-1"><MapPin className="h-3 w-3" />Remote</span>
            <span className="text-[10px] text-indigo-200">· 3 open roles</span>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 space-y-2">
          {["Business Development Executive · Sales", "Frontend Developer (React.js) · Engineering", "HR Executive · Human Resources"].map(j => {
            const [title, dept] = j.split(" · ");
            return (
              <div key={j} className="flex items-center justify-between rounded-xl border bg-white p-3">
                <div>
                  <p className="text-[11px] font-semibold text-gray-900">{title}</p>
                  <p className="text-[9px] text-gray-500">{dept} · Full-time</p>
                </div>
                <div className="rounded-full bg-indigo-600 px-2.5 py-1 text-[9px] font-medium text-white">Apply</div>
              </div>
            );
          })}
        </div>
      </div>
    </MockupShell>
  );
}

const AVATAR_COLORS = ["bg-blue-100 text-blue-700","bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700","bg-amber-100 text-amber-700","bg-pink-100 text-pink-700"];

function CandidatesMockup() {
  const rows = [
    { name: "Srinithin Somasundaram", email: "srinithin@yesp.co", company: "Yesp Studio", score: 92, sb: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { name: "Kumaravel M.", email: "kumaravel@email.com", company: "TechCorp", score: 78, sb: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { name: "Priya N.", email: "priya@email.com", company: "StartupXYZ", score: 61, sb: "bg-amber-50 text-amber-700 border-amber-200" },
    { name: "Arjun Kumar", email: "arjun@email.com", company: "Infosys", score: 45, sb: "bg-red-50 text-red-600 border-red-200" },
  ];
  return (
    <MockupShell url="hireflow.yesp.space/candidates">
      <MiniSidebar active="Candidates" />
      <div className="flex-1 bg-background overflow-hidden flex flex-col">
        <div className="px-4 pt-3 pb-2 border-b shrink-0">
          <p className="text-[9px] text-muted-foreground">Workspace · Candidates</p>
          <p className="text-[13px] font-semibold">Candidates <span className="text-[10px] font-normal text-muted-foreground ml-1">24 total</span></p>
        </div>
        <div className="px-4 py-2 border-b shrink-0">
          <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 bg-muted/20">
            <Search className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground">Search candidates…</span>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_70px_38px] gap-2 px-4 py-1.5 border-b bg-muted/30 shrink-0">
          <p className="text-[8px] font-medium uppercase tracking-wider text-muted-foreground">Candidate</p>
          <p className="text-[8px] font-medium uppercase tracking-wider text-muted-foreground">Company</p>
          <p className="text-[8px] font-medium uppercase tracking-wider text-muted-foreground text-right">Score</p>
        </div>
        <div className="divide-y overflow-hidden flex-1">
          {rows.map(({ name, email, company, score, sb }, i) => (
            <div key={name} className="grid grid-cols-[1fr_70px_38px] gap-2 items-center px-4 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9px] font-semibold ${AVATAR_COLORS[i]}`}>{name[0]}</div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium truncate">{name}</p>
                  <p className="text-[8px] text-muted-foreground truncate">{email}</p>
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground truncate">{company}</p>
              <div className="flex items-center justify-end gap-0.5">
                <Sparkles className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-semibold ${sb}`}>{score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockupShell>
  );
}

function PipelineMockup() {
  const stages = [
    { label: "Applied",   dot: "bg-slate-400",   bg: "bg-slate-50 border-slate-200",   cards: [{ name: "Srinithin S.", score: 92, sc: "text-emerald-600" }, { name: "Arjun K.", score: 45, sc: "text-red-500" }] },
    { label: "Screening", dot: "bg-blue-500",     bg: "bg-blue-50 border-blue-200",     cards: [{ name: "Kumaravel M.", score: 78, sc: "text-emerald-600" }] },
    { label: "Technical", dot: "bg-violet-500",   bg: "bg-violet-50 border-violet-200", cards: [{ name: "Priya N.", score: 61, sc: "text-amber-600" }] },
    { label: "Offer",     dot: "bg-amber-500",    bg: "bg-amber-50 border-amber-200",   cards: [{ name: "Ravi T.", score: 88, sc: "text-emerald-600" }] },
    { label: "Hired",     dot: "bg-emerald-500",  bg: "bg-emerald-50 border-emerald-200", cards: [{ name: "Nisha M.", score: 95, sc: "text-emerald-600" }] },
  ];
  return (
    <MockupShell url="hireflow.yesp.space/pipeline">
      <MiniSidebar active="Pipeline" />
      <div className="flex-1 bg-background flex flex-col overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b flex items-center justify-between shrink-0">
          <div>
            <p className="text-[9px] text-muted-foreground">Workspace · Pipeline</p>
            <p className="text-[13px] font-semibold">Pipeline</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="text-[9px] text-muted-foreground rounded-md border px-2 py-0.5">All jobs ▾</div>
            <div className="text-[9px] text-primary rounded-md border border-primary/30 bg-primary/5 px-2 py-0.5">Bulk select</div>
          </div>
        </div>
        <div className="flex gap-2 p-3 overflow-x-auto flex-1">
          {stages.map(({ label, dot, bg, cards }) => (
            <div key={label} className="w-[112px] shrink-0 flex flex-col gap-1.5">
              <div className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 ${bg}`}>
                <div className={`h-2 w-2 rounded-full ${dot} shrink-0`} />
                <span className="text-[9px] font-semibold truncate">{label}</span>
                <span className="ml-auto text-[8px] text-muted-foreground bg-white/60 rounded-full px-1">{cards.length}</span>
              </div>
              {cards.map(({ name, score, sc }) => (
                <div key={name} className="rounded-lg border bg-background px-2 py-2 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="grid h-5 w-5 place-items-center rounded-full bg-muted text-[8px] font-bold shrink-0">{name[0]}</div>
                    <p className="text-[9px] font-medium truncate">{name}</p>
                  </div>
                  <p className="text-[8px] text-muted-foreground">Frontend Dev</p>
                  <div className="flex items-center gap-0.5 mt-1">
                    <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                    <span className={`text-[8px] font-semibold ${sc}`}>{score}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </MockupShell>
  );
}

function InterviewsMockup() {
  const rows = [
    { name: "Srinithin S.", job: "BDE (B2B SaaS)", type: "Screening", time: "09:30 AM", color: AVATAR_COLORS[0], today: true },
    { name: "Kumaravel M.", job: "Frontend Dev",   type: "Technical", time: "11:00 AM", color: AVATAR_COLORS[1], today: true },
    { name: "Priya N.",     job: "HR Executive",   type: "HR Round",  time: "02:00 PM", color: AVATAR_COLORS[2], today: true },
    { name: "Arjun K.",     job: "BDE (B2B SaaS)", type: "Manager",   time: "04:00 PM", color: AVATAR_COLORS[3], today: false },
  ];
  return (
    <MockupShell url="hireflow.yesp.space/interviews" height="h-[340px]">
      <MiniSidebar active="Interviews" />
      <div className="flex-1 bg-background overflow-hidden flex flex-col">
        <div className="px-4 pt-3 pb-2 border-b flex items-center justify-between shrink-0">
          <div>
            <p className="text-[9px] text-muted-foreground">Workspace · Interviews</p>
            <p className="text-[13px] font-semibold">Interviews</p>
          </div>
          <div className="rounded-md bg-primary px-2 py-1 text-[9px] font-medium text-primary-foreground">+ Schedule</div>
        </div>
        <div className="grid grid-cols-3 gap-2 px-4 py-2 border-b shrink-0">
          {[{ l:"Upcoming",v:"4",a:"border-l-blue-500"},{l:"Completed",v:"12",a:"border-l-emerald-500"},{l:"No-shows",v:"1",a:"border-l-orange-400"}].map(({l,v,a})=>(
            <div key={l} className={`rounded-lg border border-l-4 px-2 py-1.5 bg-card ${a}`}>
              <p className="text-[7px] text-muted-foreground uppercase">{l}</p>
              <p className="text-sm font-bold">{v}</p>
            </div>
          ))}
        </div>
        <div className="divide-y overflow-hidden flex-1">
          {rows.map(({ name, job, type, time, color, today }) => (
            <div key={name} className="flex items-center gap-2 px-4 py-2">
              <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9px] font-semibold ${color}`}>{name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium truncate">{name}</p>
                <div className="flex items-center gap-1">
                  <Video className="h-2.5 w-2.5 text-muted-foreground" />
                  <p className="text-[8px] text-muted-foreground truncate">{type} · {job}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] font-semibold tabular-nums">{time}</p>
                {today && <span className="text-[7px] bg-blue-100 text-blue-700 rounded px-1">Today</span>}
              </div>
              <span className="rounded-full border px-1.5 py-0.5 text-[7px] font-medium bg-blue-100 text-blue-700 border-blue-200">Scheduled</span>
            </div>
          ))}
        </div>
      </div>
    </MockupShell>
  );
}

function AutomationsMockup() {
  const automations = [
    { name: "Application Received — Confirmation", trigger: "Application received", action: "Send email", enabled: true, delay: "Immediately" },
    { name: "Interview Scheduled — Confirmation", trigger: "Interview scheduled", action: "Send email", enabled: true, delay: "Immediately" },
    { name: "Interview Reminder (24h)", trigger: "Interview scheduled", action: "Send email", enabled: true, delay: "24 hrs later" },
    { name: "Rejection Email", trigger: "Candidate rejected", action: "Send email", enabled: false, delay: "4 hrs later" },
  ];
  return (
    <MockupShell url="hireflow.yesp.space/automations" height="h-[360px]">
      <MiniSidebar active="Automations" />
      <div className="flex-1 bg-background overflow-hidden flex flex-col">
        <div className="px-4 pt-3 pb-2 border-b flex items-center justify-between shrink-0">
          <div>
            <p className="text-[9px] text-muted-foreground">Workspace · Automations</p>
            <p className="text-[13px] font-semibold">Automations</p>
          </div>
          <div className="rounded-md bg-primary px-2 py-1 text-[9px] font-medium text-primary-foreground flex items-center gap-1">
            <Zap className="h-2.5 w-2.5" /> + New
          </div>
        </div>
        {/* Templates strip */}
        <div className="px-4 py-2 border-b shrink-0 bg-muted/20">
          <p className="text-[9px] font-semibold text-muted-foreground mb-1.5">Quick templates</p>
          <div className="flex gap-1.5 overflow-x-auto">
            {["Offer follow-up", "Stage update email", "New app — notify team", "Scorecard reminder"].map(t => (
              <div key={t} className="shrink-0 rounded-md border bg-card px-2 py-1 text-[8px] font-medium text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                <Zap className="h-2 w-2 text-amber-500" />{t}
              </div>
            ))}
          </div>
        </div>
        {/* Active automations */}
        <div className="divide-y overflow-hidden flex-1">
          {automations.map(({ name, trigger, action, enabled, delay }) => (
            <div key={name} className="flex items-start gap-2 px-4 py-2.5">
              <div className={`mt-0.5 h-4 w-7 rounded-full shrink-0 flex items-center px-0.5 ${enabled ? "bg-emerald-500 justify-end" : "bg-muted justify-start"}`}>
                <div className="h-3 w-3 rounded-full bg-white shadow-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium truncate">{name}</p>
                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  <span className="rounded-full bg-blue-50 border border-blue-200 text-blue-700 px-1.5 py-0.5 text-[7px] font-medium">{trigger}</span>
                  <ArrowRight className="h-2 w-2 text-muted-foreground" />
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 text-[7px] font-medium">{action}</span>
                  <span className="text-[7px] text-muted-foreground ml-1">· {delay}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockupShell>
  );
}

function OffersMockup() {
  return (
    <MockupShell url="hireflow.yesp.space/offers" height="h-[340px]">
      <MiniSidebar active="Offer Letters" />
      <div className="flex-1 bg-background overflow-hidden flex flex-col">
        <div className="px-4 pt-3 pb-2 border-b shrink-0">
          <p className="text-[9px] text-muted-foreground">Workspace · Offer Letters</p>
          <p className="text-[13px] font-semibold">Offer Letters</p>
        </div>
        <div className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <p className="text-[10px] font-semibold">Generate with AI</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[{ l:"Annual salary",v:"₹8,00,000"},{l:"Start date",v:"Aug 1, 2026"},{l:"Tone",v:"Warm"}].map(({l,v})=>(
              <div key={l} className="rounded-md border bg-muted/20 px-2 py-1.5">
                <p className="text-[7px] text-muted-foreground">{l}</p>
                <p className="text-[9px] font-medium">{v}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1 mb-2">
            {[
              { name:"Srinithin Somasundaram", job:"BDE (B2B SaaS)", sent: true },
              { name:"Kumaravel M.", job:"Frontend Developer", sent: false },
            ].map(({ name, job, sent }) => (
              <div key={name} className="flex items-center gap-2 rounded-md border px-2 py-1.5 bg-card">
                <input type="checkbox" className="h-3 w-3 accent-primary" defaultChecked={!sent} readOnly />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-medium truncate">{name}</p>
                  <p className="text-[8px] text-muted-foreground truncate">{job}</p>
                </div>
                {sent && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[7px] text-emerald-700">Sent</span>}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 justify-center">
            <Sparkles className="h-3 w-3 text-primary-foreground" />
            <span className="text-[9px] font-semibold text-primary-foreground">Generate 1 offer letter with AI</span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-4 py-2">
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-medium truncate">Kumaravel M. — Frontend Developer</p>
                <p className="text-[8px] text-muted-foreground">kumaravel@email.com</p>
              </div>
              <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[7px] text-emerald-700">
                <Check className="h-2 w-2" /> Sent Jul 6
              </span>
            </div>
            <div className="px-3 py-2">
              <p className="font-mono text-[8px] text-muted-foreground leading-relaxed line-clamp-3">
                Dear Kumaravel, We are pleased to offer you the position of Frontend Developer at Yesp Studio with an annual compensation of ₹8,00,000...
              </p>
            </div>
          </div>
        </div>
      </div>
    </MockupShell>
  );
}

function AIScreeningMockup() {
  const candidates = [
    { name: "Srinithin S.",   score: 94, grade: "A+", bar: "w-[94%]", sc: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", skills: ["React", "Node.js", "TypeScript"] },
    { name: "Kumaravel M.",   score: 78, grade: "B+", bar: "w-[78%]", sc: "bg-blue-500",    badge: "bg-blue-50 text-blue-700 border-blue-200",         skills: ["Vue.js", "Python"] },
    { name: "Priya N.",       score: 61, grade: "C+", bar: "w-[61%]", sc: "bg-amber-500",   badge: "bg-amber-50 text-amber-700 border-amber-200",       skills: ["HTML", "CSS", "jQuery"] },
    { name: "Arjun Kumar",    score: 42, grade: "D",  bar: "w-[42%]", sc: "bg-red-400",     badge: "bg-red-50 text-red-600 border-red-200",             skills: ["Excel", "Photoshop"] },
  ];
  return (
    <MockupShell url="hireflow.yesp.space/ai/screening" height="h-auto">
      <MiniSidebar active="Candidates" />
      <div className="flex-1 bg-background overflow-hidden flex flex-col">
        <div className="px-4 pt-3 pb-2 border-b flex items-center justify-between shrink-0">
          <div>
            <p className="text-[9px] text-muted-foreground">Workspace · AI Screening</p>
            <p className="text-[13px] font-semibold">AI Candidate Scoring</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span className="text-[9px] font-semibold text-amber-700">AI Active</span>
          </div>
        </div>

        {/* Job context */}
        <div className="mx-3 my-2 rounded-lg border bg-primary/5 border-primary/20 px-3 py-2 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-muted-foreground">Scoring against</p>
              <p className="text-[11px] font-semibold">Frontend Developer (React.js)</p>
            </div>
            <span className="text-[8px] rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5">4 candidates</span>
          </div>
        </div>

        {/* Score list */}
        <div className="flex-1 divide-y overflow-hidden">
          {candidates.map(({ name, score, grade, bar, sc, badge, skills }) => (
            <div key={name} className="px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-[9px] font-bold">{name[0]}</div>
                  <span className="text-[10px] font-medium">{name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[8px] font-bold rounded-full border px-1.5 py-0.5 ${badge}`}>{grade}</span>
                  <span className="text-[11px] font-bold tabular-nums">{score}</span>
                  <Sparkles className="h-3 w-3 text-amber-400" />
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1.5">
                <div className={`h-full rounded-full ${sc} ${bar} transition-all`} />
              </div>
              <div className="flex gap-1 flex-wrap">
                {skills.map(s => (
                  <span key={s} className="text-[7px] rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Breakdown footer */}
        <div className="border-t px-3 py-2 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-[8px] text-muted-foreground">Score breakdown: Skills · Experience · Role fit</p>
            <div className="flex items-center gap-1 text-[8px] text-primary font-medium">
              <ShieldCheck className="h-2.5 w-2.5" />AI-verified
            </div>
          </div>
        </div>
      </div>
    </MockupShell>
  );
}

function OnboardingMockup() {
  return (
    <MockupShell url="hireflow.yesp.space/employee-onboarding" height="h-auto">
      <MiniSidebar active="Dashboard" />
      <div className="flex-1 bg-background overflow-hidden flex flex-col">
        <div className="px-4 pt-3 pb-2 border-b flex items-center justify-between shrink-0">
          <div>
            <p className="text-[9px] text-muted-foreground">Workspace · Onboarding</p>
            <p className="text-[13px] font-semibold">Employee Onboarding</p>
          </div>
          <div className="rounded-md bg-primary px-2 py-1 text-[9px] font-medium text-primary-foreground flex items-center gap-1">
            <Users className="h-2.5 w-2.5" /> New session
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 px-3 py-2 border-b shrink-0">
          {[{ l: "Pending", v: "3", c: "border-l-slate-400" }, { l: "In Progress", v: "2", c: "border-l-blue-500" }, { l: "Completed", v: "8", c: "border-l-emerald-500" }].map(({ l, v, c }) => (
            <div key={l} className={`rounded-lg border border-l-4 px-2 py-1.5 bg-card ${c}`}>
              <p className="text-[7px] text-muted-foreground uppercase">{l}</p>
              <p className="text-sm font-bold">{v}</p>
            </div>
          ))}
        </div>

        {/* Session list */}
        <div className="flex-1 divide-y overflow-hidden">
          {[
            { name: "Srinithin S.",   job: "Frontend Developer",   status: "In Progress", pct: 65, sc: "bg-blue-500",    badge: "bg-blue-50 text-blue-700 border-blue-200" },
            { name: "Nisha M.",       job: "HR Executive",         status: "Completed",   pct: 100, sc: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
            { name: "Ravi T.",        job: "BDE (B2B SaaS)",       status: "Pending",     pct: 0,   sc: "bg-slate-300",   badge: "bg-slate-100 text-slate-600 border-slate-200" },
          ].map(({ name, job, status, pct, sc, badge }) => (
            <div key={name} className="px-3 py-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">{name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium truncate">{name}</p>
                  <p className="text-[8px] text-muted-foreground truncate">{job}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[7px] font-medium ${badge}`}>{status}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${sc}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[8px] text-muted-foreground tabular-nums shrink-0">{pct}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Candidate portal preview strip */}
        <div className="border-t bg-indigo-50/60 px-3 py-2 shrink-0">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-3 w-3 text-indigo-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold text-indigo-700">Candidate portal</p>
              <p className="text-[8px] text-indigo-500 truncate">yesp.hireflow.yesp.space/welcome/abc123</p>
            </div>
            <div className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[8px] font-medium text-white flex items-center gap-1">
              <Upload className="h-2 w-2" />OTP
            </div>
          </div>
        </div>
      </div>
    </MockupShell>
  );
}

// ─── Steps array ──────────────────────────────────────────────────────────────

export const STEPS: HowToStep[] = [
  {
    slug: "create-organisation",
    title: "Create your Organisation",
    shortTitle: "Create Organisation",
    seoTitle: "How to Create an Organisation in HireFlow | Yesp Guide",
    seoDescription: "Step-by-step guide to creating your organisation in HireFlow by Yesp. Set up your company profile, industry, website, and invite your first team members in under two minutes.",
    seoKeywords: "create organisation HireFlow, HireFlow setup, Yesp HireFlow onboarding, ATS setup, hiring platform setup",
    description: "Your organisation is the top-level container that holds all your workspaces, jobs, candidates, and team members. Setting one up takes under two minutes.",
    details: [
      { heading: "Sign up at hireflow.yesp.space", body: "Click 'Sign up', enter your email and create a password. No credit card required. All features are unlocked from day one." },
      { heading: "Enter your company details", body: "Fill in your organisation name (e.g. Acme Corp), industry (e.g. Technology), and your company website URL." },
      { heading: "Choose a subdomain", body: "Your branded careers page will live at your-company.hireflow.io. Pick a slug that matches your brand — this is what candidates will see." },
      { heading: "Invite your team", body: "Add team members by email. Assign them roles: Admin (full access), Recruiter (manage candidates), or Viewer (read only)." },
    ],
    tips: [
      "Use your official company name — it shows on offer letters and candidate emails",
      "Pick a short, memorable subdomain — it can't be changed later without creating a new workspace",
      "Invite at least one other team member before posting your first job",
    ],
    mockup: <OnboardingStep1Mockup />,
  },
  {
    slug: "create-workspace",
    title: "Set Up Your Workspace",
    shortTitle: "Create Workspace",
    seoTitle: "How to Set Up a Workspace in HireFlow | Yesp Guide",
    seoDescription: "Learn how to create and configure a hiring workspace in HireFlow. Workspaces let you separate hiring for different teams, regions, or roles — all under one organisation.",
    seoKeywords: "HireFlow workspace, create workspace HireFlow, ATS workspace setup, hiring workspace, Yesp HireFlow workspace",
    description: "Workspaces separate hiring for different teams, regions, or business units. Each workspace has its own jobs, pipeline, careers page, and settings.",
    details: [
      { heading: "Name your workspace", body: "Give it a descriptive name like 'Engineering Hiring Q3' or 'US Sales Team'. This is visible only to your internal team." },
      { heading: "Set a careers subdomain", body: "Each workspace gets its own careers page URL. Enter a slug — HireFlow checks availability in real time and shows a green tick when it's free." },
      { heading: "Configure pipeline stages", body: "Go to Settings → Pipeline stages. Add or reorder stages: Applied → Screening → HR Interview → Technical → Offer → Hired. These become the default for every job in this workspace." },
      { heading: "Add team members", body: "Assign team members to this specific workspace. Org admins can see all workspaces; workspace members only see theirs." },
    ],
    tips: [
      "Create one workspace per distinct hiring function (Engineering, Sales, Operations) for cleaner pipelines",
      "Subdomain slugs must be unique across all HireFlow workspaces — try 'company-team' format",
      "You can change pipeline stage names and order any time — it doesn't affect existing candidate positions",
    ],
    mockup: <OnboardingStep2Mockup />,
  },
  {
    slug: "post-a-job",
    title: "Post Your First Job",
    shortTitle: "Post a Job",
    seoTitle: "How to Post a Job on HireFlow | Yesp Guide",
    seoDescription: "Learn how to create and publish a job posting on HireFlow by Yesp. Add a title, description, department, and location — your job goes live on your careers page instantly.",
    seoKeywords: "post job HireFlow, create job posting ATS, HireFlow jobs, publish job listing, Yesp ATS job posting",
    description: "Create a job posting in under two minutes. Add a title, department, job type, and description. Your job is instantly published to your branded careers page when you hit Publish.",
    details: [
      { heading: "Click '+ New job'", body: "From the dashboard or the Jobs page in the sidebar. The job creation form opens as a full page." },
      { heading: "Fill in the basics", body: "Job title, department (e.g. Engineering), employment type (Full-time, Part-time, Contract, Internship), location, and salary range (optional)." },
      { heading: "Write the description", body: "Use the rich-text editor to add responsibilities, requirements, and about-the-company sections. The AI scorer uses this text to rank applicants — be specific." },
      { heading: "Publish", body: "Click Publish and the job goes live on your careers page immediately. You can save as Draft first and publish later. Closed roles are hidden from the careers page but preserved in your history." },
    ],
    tips: [
      "The more detailed your job description, the more accurate the AI resume scoring will be",
      "Add 'nice to have' requirements separately from 'required' — AI uses both for scoring",
      "You can duplicate an existing job to save time when hiring for a similar role",
    ],
    mockup: <JobsMockup />,
  },
  {
    slug: "careers-page",
    title: "Share Your Careers Page",
    shortTitle: "Careers Page",
    seoTitle: "How to Use the HireFlow Branded Careers Page | Yesp Guide",
    seoDescription: "Learn how to customise and share your branded careers page on HireFlow. Every workspace gets its own job board on a custom subdomain — publish your first role in under a minute.",
    seoKeywords: "HireFlow careers page, branded job board, custom careers page ATS, job board subdomain, Yesp HireFlow careers",
    description: "Every workspace automatically gets a fully branded careers page at your chosen subdomain. Share this link anywhere — your website, LinkedIn, job boards — to start receiving applications.",
    details: [
      { heading: "Find your careers page URL", body: "Go to Careers Page in the sidebar. Your public URL is shown at the top — it looks like hireflow.io/c/your-slug." },
      { heading: "Customise the branding", body: "Upload your company logo, set a hero background colour, add a custom subtitle, and choose fonts. Changes apply instantly — no deploy required." },
      { heading: "Preview before sharing", body: "Click 'Preview' to see exactly what candidates see. Check on mobile too — the page is fully responsive." },
      { heading: "Share everywhere", body: "Copy the URL and paste it on your website's hiring page, your LinkedIn 'Life' tab, and any job boards. The page is public and SEO-indexed by default." },
    ],
    tips: [
      "Add a 'We're hiring' banner on your main website with a direct link to the careers page",
      "The careers page auto-updates when you publish or close jobs — no manual edits needed",
      "Candidates apply directly on the page — there's no redirect to a third-party form",
    ],
    mockup: <CareersMockup />,
  },
  {
    slug: "review-applications",
    title: "Review AI-Scored Applications",
    shortTitle: "Review Applications",
    seoTitle: "How to Review AI-Scored Applications in HireFlow | Yesp Guide",
    seoDescription: "Learn how HireFlow's AI automatically scores and ranks candidates. Every resume is parsed and scored 0–100 against your job description so you focus on the best fits first.",
    seoKeywords: "AI resume scoring HireFlow, review applications ATS, candidate scoring, HireFlow AI, Yesp AI hiring, resume screening",
    description: "Every incoming application is automatically scored by AI against the job description. Candidates are ranked by fit (0–100) so you spend less time screening and more time deciding.",
    details: [
      { heading: "Open the Candidates page", body: "Click Candidates in the sidebar. All applicants across all jobs appear here. Filter by job, stage, score range, or tag using the top filters." },
      { heading: "Read the AI score", body: "Each candidate shows a Sparkles (✦) icon with a score: green (75+) = strong fit, amber (50–74) = partial fit, red (<50) = weak fit. Scores are based on skills, experience, and role match." },
      { heading: "Open the candidate profile", body: "Click any candidate to open their full profile: parsed resume, application answers, job they applied for, AI score breakdown, and your team's internal notes." },
      { heading: "Take action", body: "From the profile you can: move them to the next pipeline stage, add internal notes (visible only to your team), add tags (e.g. 'referral', 'priority'), schedule an interview, or reject with an automated email." },
    ],
    tips: [
      "Sort by AI score descending to work through your strongest candidates first",
      "Re-score a candidate any time if you've updated the job description",
      "Add tags like 'referral' or 'priority' to filter candidates across jobs",
    ],
    mockup: <CandidatesMockup />,
  },
  {
    slug: "ai-screening",
    title: "AI Screening — Score & Rank Candidates",
    shortTitle: "AI Screening",
    seoTitle: "How to Use AI Screening in HireFlow | Yesp Guide",
    seoDescription: "Learn how HireFlow's AI screening engine scores every candidate 0–100 against the role. Understand grade breakdowns, advance top scorers instantly, and set automations for score thresholds.",
    seoKeywords: "AI screening HireFlow, AI candidate scoring, resume scoring ATS, Yesp AI screening, HireFlow AI score, automated candidate shortlisting",
    description: "HireFlow's AI engine reads every resume and scores candidates 0–100 against the job description, breaking the score into Skills, Experience, and Role Fit components so you know exactly why someone ranks where they do.",
    details: [
      { heading: "Scores appear automatically", body: "As soon as a candidate applies, HireFlow scores them in the background. Open the Candidates page and look for the Sparkles (✦) icon — it shows the 0–100 score and letter grade (A+, B, C…) inline on the list." },
      { heading: "Understand the grade scale", body: "A+ (90–100) = exceptional fit, A (80–89) = strong fit, B (70–79) = good fit, C (60–69) = partial fit, D/F = weak match. Use letter grades as a quick gut-check before opening a full profile." },
      { heading: "Open the score breakdown", body: "Click a candidate's score badge to see the breakdown: Skills match, Experience level, and Role fit are each scored individually. This tells you whether someone is strong overall or strong in one area only." },
      { heading: "Sort and filter by score", body: "Use the 'Score' column header to sort candidates descending. Use the score range filter (e.g. ≥75) to create a shortlist without reading every resume individually." },
      { heading: "Advance top scorers", body: "Select candidates with high scores and bulk-move them to the Screening stage. You can also set up an automation (Step 8) to auto-advance any candidate scoring ≥80 to a stage automatically." },
      { heading: "Re-score after job edits", body: "If you update the job description (new must-have skills, different seniority level), trigger a re-score from the job settings page. All candidates are re-ranked against the updated requirements." },
    ],
    tips: [
      "Pair AI score sorting with a skills tag filter to find niche candidates who might score moderately overall but nail the core requirement",
      "A score of 60–70 with a strong skills match is often more useful than 85 with a broad-but-shallow profile",
      "Use the score breakdown to prep interview questions — a low 'Role fit' score often means you should probe cultural alignment",
    ],
    mockup: <AIScreeningMockup />,
  },
  {
    slug: "work-the-pipeline",
    title: "Work on the Pipeline",
    shortTitle: "Work the Pipeline",
    seoTitle: "How to Manage Your Hiring Pipeline in HireFlow | Yesp Guide",
    seoDescription: "Learn how to manage candidates in HireFlow's visual Kanban pipeline. Drag and drop candidates between stages, bulk-move, and trigger automated emails on stage changes.",
    seoKeywords: "HireFlow pipeline, Kanban hiring pipeline, manage candidates stages, drag drop ATS, HireFlow Kanban, Yesp pipeline management",
    description: "The visual Kanban pipeline gives you a bird's-eye view of every active candidate by stage. Drag to move, bulk-select to act on many at once, and automate emails that fire on each transition.",
    details: [
      { heading: "Open the Pipeline view", body: "Click Pipeline in the sidebar. All active candidates appear as cards in columns — one column per stage. Use the 'All jobs' dropdown to filter by a specific role." },
      { heading: "Drag candidates between stages", body: "Click and hold a candidate card, then drag it to the next column. The stage updates instantly and any automation triggered on that stage transition fires immediately." },
      { heading: "Use bulk select for efficiency", body: "Click 'Bulk select' in the top-right, then tick multiple candidates. Use 'Move to' to advance a whole cohort at once — ideal after a batch screening call." },
      { heading: "Read the AI score on each card", body: "Every card shows the candidate's AI fit score. This persists through every stage so you always have context — especially useful when making offer decisions." },
      { heading: "Customise your stages", body: "Go to Settings → Pipeline stages to rename, reorder, or add custom stages. You can have different stage sets for different job types within the same workspace." },
    ],
    tips: [
      "Keep 'Rejected' candidates in the pipeline — they stay off your active view but you can revisit them later",
      "Set up automations (Step 8) before you start moving candidates — stage changes trigger them in real time",
      "Use the job filter to work through one role's pipeline at a time for focused sessions",
    ],
    mockup: <PipelineMockup />,
  },
  {
    slug: "schedule-interviews",
    title: "Schedule & Run Interviews",
    shortTitle: "Schedule Interviews",
    seoTitle: "How to Schedule Interviews in HireFlow | Yesp Guide",
    seoDescription: "Learn how to schedule, manage, and score interviews in HireFlow by Yesp. Assign interviewers, collect scorecards, and keep all feedback inside one unified candidate profile.",
    seoKeywords: "schedule interview HireFlow, interview management ATS, scorecard HireFlow, interview scheduling software, Yesp HireFlow interviews",
    description: "Schedule structured interviews directly inside HireFlow. Assign interviewers, pick the type, set the time — they get a calendar invite and you collect their scorecard after.",
    details: [
      { heading: "Open Interviews and click '+ Schedule'", body: "Or open a candidate profile directly and click 'Schedule interview' from the action panel. Either route opens the same scheduling dialog." },
      { heading: "Fill in the details", body: "Choose the candidate (auto-filled if scheduling from their profile), interview type (Screening, Technical, HR, Manager Round, Onsite), duration (30/45/60/90 min), date, time, and optional meeting link." },
      { heading: "Assign interviewers", body: "Select one or more team members as interviewers. Each receives a calendar invite with the candidate name, job title, and meeting link automatically." },
      { heading: "Track the day of", body: "On the Interviews page, today's interviews are highlighted with a 'Today' badge. The dashboard also shows them in 'Today's agenda' for quick access." },
      { heading: "Submit a scorecard", body: "After the interview, click the interview row and select 'Mark completed'. Fill in the feedback notes and rating (1–5). All feedback is stored on the candidate's profile — visible to your whole team." },
    ],
    tips: [
      "Schedule multiple rounds sequentially — each shows on the candidate timeline in order",
      "Use the meeting URL field to paste a Zoom or Google Meet link — it's included in the calendar invite",
      "Scorecards from all interviewers are aggregated on the candidate profile — great for debrief meetings",
    ],
    mockup: <InterviewsMockup />,
  },
  {
    slug: "set-up-automations",
    title: "Set Up Email Automations",
    shortTitle: "Automations",
    seoTitle: "How to Set Up Email Automations in HireFlow | Yesp Guide",
    seoDescription: "Learn how to automate candidate communication in HireFlow by Yesp. Set trigger-based email automations for application received, interview scheduled, stage changes, and offer follow-ups.",
    seoKeywords: "HireFlow automations, email automation ATS, trigger-based emails hiring, automate candidate emails, Yesp HireFlow automations, hiring email templates",
    description: "Automations let you send the right email at the right time without any manual work. Define a trigger (e.g. 'application received') and an action (e.g. 'send email') — HireFlow does the rest.",
    details: [
      { heading: "Open Automations in the sidebar", body: "Click Automations under the Tools section. You'll see a list of any active automations and a template gallery for quick setup." },
      { heading: "Start from a template", body: "Click any template card — e.g. 'Application Received Confirmation' or 'Interview Reminder (24h)'. The trigger, action, timing, and email body are pre-filled. Edit the subject and message, then save." },
      { heading: "Or create from scratch", body: "Click '+ New'. Choose a trigger: Application received, Stage changed (pick which stage), Interview scheduled, Interview completed, Candidate rejected, or Offer sent. Then choose the action: Send email, Notify team, Add tag, Move stage, or Generate offer letter." },
      { heading: "Set the timing", body: "Automations can fire immediately or after a delay: 1 hour, 4 hours, 24 hours, 48 hours, or 72 hours. Use delays for rejection emails or offer follow-ups to feel more human." },
      { heading: "Use template variables", body: "Email bodies support {{candidate_name}}, {{job_title}}, {{company_name}}, and {{interviewer_name}}. These are replaced automatically when the email sends." },
      { heading: "Enable and test", body: "Toggle the automation on. You can disable it at any time without deleting it. Each automation shows its last-triggered time in the list so you can verify it's firing correctly." },
    ],
    tips: [
      "Set up the 'Application Received' automation before you publish your first job — every applicant gets an instant confirmation",
      "Use a 4-hour delay on rejection emails — immediate rejections feel harsh, a short delay feels more considered",
      "The 'Notify team' action sends a Slack-style notification to your team — great for alerting recruiters when a candidate reaches the Offer stage",
    ],
    mockup: <AutomationsMockup />,
  },
  {
    slug: "send-offer-letters",
    title: "Send AI-Generated Offer Letters",
    shortTitle: "Send Offer Letters",
    seoTitle: "How to Send AI-Generated Offer Letters in HireFlow | Yesp Guide",
    seoDescription: "Learn how to generate, customise, and send professional offer letters using AI in HireFlow by Yesp. Draft, review, and track offer acceptance — all in one place.",
    seoKeywords: "offer letter HireFlow, AI offer letter, generate offer letter ATS, HireFlow offer letters, Yesp AI offer, send offer letter hiring",
    description: "When you're ready to hire, HireFlow drafts a professional offer letter using AI. Review, edit, and send it — then track when the candidate views and accepts.",
    details: [
      { heading: "Open Offer Letters", body: "Click 'Offer Letters' in the sidebar under Tools. You'll see the generation panel at the top and any previously sent letters below." },
      { heading: "Set the offer details", body: "Fill in annual salary, start date, and tone (Warm, Formal, or Friendly). These are injected into the AI prompt and into the letter itself." },
      { heading: "Select candidates", body: "Tick the candidates you want to generate letters for. You can generate in batch for multiple hires. Candidates already sent a letter show a 'Sent' badge." },
      { heading: "Generate with AI", body: "Click 'Generate X offer letter(s) with AI'. HireFlow uses GPT to write a complete, professional offer letter for each selected candidate in seconds." },
      { heading: "Review and edit", body: "Each generated letter appears as an editable text area. Read through carefully — edit salary, start date, role-specific clauses, or tone as needed before sending." },
      { heading: "Send and track", body: "Click 'Send' on each letter. The candidate receives a branded email. HireFlow tracks whether they've viewed it and marks it as accepted or declined when they respond." },
    ],
    tips: [
      "'Warm' tone works well for startups and SMEs; use 'Formal' for enterprise or regulated industries",
      "Always review the AI-generated letter before sending — especially compensation figures and start dates",
      "You can set up an automation to generate an offer letter automatically when a candidate reaches the 'Offer' stage",
    ],
    mockup: <OffersMockup />,
  },
  {
    slug: "employee-onboarding",
    title: "Onboard New Hires with Ease",
    shortTitle: "Onboarding",
    seoTitle: "How to Onboard New Employees in HireFlow | Yesp Guide",
    seoDescription: "Learn how to create onboarding sessions in HireFlow, send candidates a secure OTP portal link for document collection and e-signature, and track completion status in real time.",
    seoKeywords: "employee onboarding HireFlow, onboarding portal ATS, document collection hiring, e-signature onboarding, Yesp onboarding, HireFlow new hire onboarding",
    description: "After a candidate accepts their offer, create an onboarding session to collect documents, signatures, and custom information through a branded candidate portal — no back-and-forth email required.",
    details: [
      { heading: "Open Employee Onboarding", body: "Click 'Onboarding' under the sidebar Tools section. The dashboard shows all active sessions with a progress bar and status badge (Pending, In Progress, Completed)." },
      { heading: "Create a new session", body: "Click '+ New session'. Select one or more accepted candidates from the list. Each candidate gets their own session with an isolated document checklist and portal link." },
      { heading: "Configure the document checklist", body: "The session inherits your global onboarding template (configured in Settings → Onboarding). You can then customise it per session: add or remove document types (ID proof, certificates, bank details, etc.) and toggle which are required." },
      { heading: "Configure agreements & consent", body: "Switch to the Agreements tab to manage NDA, employment contract, or custom consent items. Each agreement can have custom body text and an optional PDF attachment for the candidate to countersign." },
      { heading: "Send the portal link", body: "Click 'Send portal link'. The candidate receives an email with a one-time-password (OTP) link at their application email. They enter their OTP, land on a branded portal, and complete all steps in one session." },
      { heading: "Track and follow up", body: "Progress updates in real time as the candidate completes each document upload and agreement. When all steps are done the session flips to 'Completed' and you're notified automatically." },
    ],
    tips: [
      "Set up your global onboarding template in Settings → Onboarding before creating sessions — every new session inherits it so you never have to reconfigure",
      "For bulk hiring, select multiple candidates when creating a session — each gets their own isolated portal link but you configure the checklist once",
      "The OTP portal link is single-use and expires — if a candidate reports it isn't working, regenerate it from the session detail page",
    ],
    mockup: <OnboardingMockup />,
  },
];
