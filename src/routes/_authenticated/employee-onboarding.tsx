import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Loader2, CheckCircle2, Clock, FileText, Copy, ExternalLink,
  Plus, User, ChevronRight, AlertCircle, Calendar, XCircle,
  Mail, MailCheck, MailX, Check,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listOnboardingSessions, createOnboardingSession } from "@/lib/onboarding.functions";

export const Route = createFileRoute("/_authenticated/employee-onboarding")({
  head: () => ({ meta: [{ title: "Onboarding · HireFlow" }] }),
  component: OnboardingLayout,
});

function OnboardingLayout() {
  const path = useRouterState({ select: r => r.location.pathname });
  if (path === "/employee-onboarding") return <EmployeeOnboarding />;
  return <Outlet />;
}

type Session = {
  id: string; token: string; status: string; verified: boolean;
  candidate_name: string; candidate_email: string;
  job_title: string | null; joining_date: string | null;
  submitted_at: string | null; created_at: string;
  rejected_at?: string | null;
  organizations?: { subdomain: string | null } | null;
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:     { label: "Pending",     cls: "bg-slate-100 text-slate-600 border-slate-200",       icon: Clock },
  in_progress: { label: "In Progress", cls: "bg-blue-100 text-blue-700 border-blue-200",          icon: FileText },
  submitted:   { label: "Submitted",   cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  completed:   { label: "Completed",   cls: "bg-green-100 text-green-700 border-green-200",       icon: CheckCircle2 },
  rejected:    { label: "Rejected",    cls: "bg-red-100 text-red-600 border-red-200",             icon: XCircle },
};

const APP_DOMAIN = typeof window !== "undefined"
  ? ((window as unknown as Record<string, Record<string, string>>).__VITE_ENV__?.VITE_APP_DOMAIN ?? "hireflow.yesp.space")
  : "hireflow.yesp.space";

function getPortalUrl(token: string, subdomain?: string | null): string {
  const base = subdomain
    ? `https://${subdomain}.${APP_DOMAIN}`
    : (typeof window !== "undefined" ? window.location.origin : `https://${APP_DOMAIN}`);
  return `${base}/welcome/${token}`;
}

// ── Candidate row for multi-select ─────────────────────────────────────────────
type AppRow = { id: string; name: string; job: string; stage: string; email: string };

type BatchResult = { appId: string; name: string; status: "success" | "error"; message?: string; token?: string; emailSent?: boolean; portalUrl?: string };

function NewSessionModal({ onClose }: { onClose: () => void }) {
  const { data: org } = useCurrentOrg();
  const qc = useQueryClient();

  const [step, setStep]             = useState<"select" | "configure">("select");
  const [search, setSearch]         = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Per-candidate joining date, keyed by application id
  const [perConfig, setPerConfig]   = useState<Record<string, { joiningDate: string }>>({});
  const [creating, setCreating]     = useState(false);
  const [results, setResults]       = useState<BatchResult[] | null>(null);

  const { data: apps, isLoading } = useQuery({
    enabled: !!org?.id,
    queryKey: ["apps-for-onboarding", org?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, stage, candidates(full_name, email), jobs(title)")
        .eq("organization_id", org!.id)
        .in("stage", ["offer", "hired"])
        .order("applied_at", { ascending: false })
        .limit(100);
      return (data ?? []).map(a => {
        const cand = Array.isArray(a.candidates) ? a.candidates[0] : a.candidates as { full_name: string; email: string } | null;
        const job  = Array.isArray(a.jobs)       ? a.jobs[0]       : a.jobs       as { title: string }    | null;
        return { id: a.id, name: cand?.full_name ?? "Unknown", email: cand?.email ?? "", job: job?.title ?? "", stage: a.stage } as AppRow;
      });
    },
  });

  const filtered = (apps ?? []).filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.job.toLowerCase().includes(search.toLowerCase())
  );

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filtered.map(a => a.id)));
  }

  const selectedApps = filtered.filter(a => selectedIds.has(a.id));

  function goToConfigure() {
    if (selectedIds.size === 0) return;
    // Initialise per-candidate config, keeping existing values if already set
    const init: Record<string, { joiningDate: string }> = {};
    selectedApps.forEach(a => { init[a.id] = perConfig[a.id] ?? { joiningDate: "" }; });
    setPerConfig(init);
    setStep("configure");
  }

  async function handleCreate() {
    if (selectedApps.length === 0) return;
    setCreating(true);
    const batchResults: BatchResult[] = [];

    for (const app of selectedApps) {
      try {
        const joiningDate = perConfig[app.id]?.joiningDate ?? "";
        const res = await createOnboardingSession({
          data: {
            applicationId: app.id,
            joiningDate: joiningDate || undefined,
            sendInviteEmail: true,
          },
        });
        batchResults.push({ appId: app.id, name: app.name, status: "success", token: res.token, emailSent: res.emailSent, portalUrl: res.portalUrl });
      } catch (e) {
        batchResults.push({ appId: app.id, name: app.name, status: "error", message: e instanceof Error ? e.message : "Failed" });
      }
    }

    setResults(batchResults);
    qc.invalidateQueries({ queryKey: ["onboarding-sessions", org?.id] });

    const ok  = batchResults.filter(r => r.status === "success").length;
    const bad = batchResults.filter(r => r.status === "error").length;
    if (ok > 0)  toast.success(`${ok} onboarding session${ok > 1 ? "s" : ""} created`);
    if (bad > 0) toast.error(`${bad} session${bad > 1 ? "s" : ""} failed — see details`);
    setCreating(false);
  }

  // ── Results screen ──────────────────────────────────────────────────────────
  if (results !== null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border bg-white shadow-2xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold">Onboarding Sessions Created</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {results.filter(r => r.status === "success").length} of {results.length} created successfully
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2">
            {results.map(r => (
              <div key={r.appId} className={`flex items-start gap-3 rounded-xl border p-3 ${r.status === "success" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                <div className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${r.status === "success" ? "bg-emerald-500" : "bg-red-500"} text-white`}>
                  {r.status === "success" ? <Check className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  {r.status === "success" && (
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs ${r.emailSent ? "text-emerald-700" : "text-amber-600"}`}>
                        {r.emailSent ? <MailCheck className="h-3 w-3" /> : <MailX className="h-3 w-3" />}
                        {r.emailSent ? "Invite sent" : "Email not sent (SMTP not configured)"}
                      </span>
                      {r.portalUrl && (
                        <button
                          onClick={() => { navigator.clipboard.writeText(r.portalUrl!).catch(() => {}); toast.success("Link copied!"); }}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="h-3 w-3" /> Copy link
                        </button>
                      )}
                    </div>
                  )}
                  {r.status === "error" && (
                    <p className="mt-0.5 text-xs text-red-600">{r.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full" onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  // ── Configure screen (Step 2) ───────────────────────────────────────────────
  if (step === "configure") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl border bg-white shadow-2xl p-6 space-y-5">
          <div>
            <button onClick={() => setStep("select")} className="mb-1 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              ← Back to selection
            </button>
            <h2 className="text-lg font-bold">Configure Sessions</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Set the joining date for each candidate. Invite emails will be sent via your SMTP settings.
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
            {selectedApps.map(a => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {a.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.job}</p>
                </div>
                <div className="shrink-0 space-y-1 text-right">
                  <label className="block text-[10px] text-muted-foreground font-medium">Joining Date</label>
                  <Input
                    type="date"
                    value={perConfig[a.id]?.joiningDate ?? ""}
                    onChange={e => setPerConfig(prev => ({ ...prev, [a.id]: { ...prev[a.id], joiningDate: e.target.value } }))}
                    className="h-7 text-xs w-36"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-sm">
            <Mail className="h-4 w-4 text-primary shrink-0" />
            <span className="text-primary font-medium text-xs">
              Invite emails will be sent to each candidate if SMTP is configured
            </span>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={creating}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={creating} onClick={handleCreate}>
              {creating
                ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Creating…</>
                : <>Create {selectedApps.length} Session{selectedApps.length > 1 ? "s" : ""} &amp; Send Invites</>
              }
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Selection screen (Step 1) ────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-2xl p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold">New Onboarding Session</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select candidates in Offer or Hired stage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search candidates or jobs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 text-sm flex-1"
          />
          {filtered.length > 0 && (
            <button
              onClick={selectAll}
              className="shrink-0 text-xs text-primary hover:underline whitespace-nowrap"
            >
              Select all ({filtered.length})
            </button>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1 rounded-xl border p-1.5">
          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center py-6 gap-2 text-center">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No candidates in Offer or Hired stage.</p>
            </div>
          )}
          {filtered.map(a => {
            const selected = selectedIds.has(a.id);
            return (
              <button
                key={a.id}
                onClick={() => toggleSelect(a.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left transition-colors ${selected ? "bg-primary/10" : "hover:bg-muted"}`}
              >
                <div className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${selected ? "bg-primary border-primary" : "border-input"}`}>
                  {selected && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {a.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-medium truncate ${selected ? "text-primary" : ""}`}>{a.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.job}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${a.stage === "hired" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {a.stage}
                </span>
              </button>
            );
          })}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
            <Check className="h-4 w-4 text-primary shrink-0" />
            <span className="text-primary font-medium text-sm">
              {selectedIds.size} candidate{selectedIds.size > 1 ? "s" : ""} selected
            </span>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={selectedIds.size === 0}
            onClick={goToConfigure}
          >
            Next: Configure →
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmployeeOnboarding() {
  const { data: org } = useCurrentOrg();
  const [showNew, setShowNew] = useState(false);

  const { data: sessions, isLoading } = useQuery({
    enabled: !!org?.id,
    queryKey: ["onboarding-sessions", org?.id],
    queryFn: () => listOnboardingSessions({ data: { orgId: org!.id } }),
  });

  const stats = {
    total:      sessions?.length ?? 0,
    submitted:  sessions?.filter(s => s.status === "submitted" || s.status === "completed").length ?? 0,
    inProgress: sessions?.filter(s => s.status === "in_progress").length ?? 0,
    pending:    sessions?.filter(s => s.status === "pending").length ?? 0,
  };

  function copyLink(token: string, subdomain?: string | null) {
    navigator.clipboard.writeText(getPortalUrl(token, subdomain))
      .then(() => toast.success("Link copied!"))
      .catch(() => toast.error("Could not copy link"));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Onboarding</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage new hire onboarding portals and track completion.</p>
        </div>
        <Button className="gap-1.5 shrink-0" onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" /> New Onboarding
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",       value: stats.total,      icon: User,         cls: "text-foreground" },
          { label: "Pending",     value: stats.pending,    icon: Clock,        cls: "text-slate-600" },
          { label: "In Progress", value: stats.inProgress, icon: FileText,     cls: "text-blue-600" },
          { label: "Submitted",   value: stats.submitted,  icon: CheckCircle2, cls: "text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className={`grid h-9 w-9 place-items-center rounded-xl bg-muted ${s.cls}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sessions table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && (!sessions || sessions.length === 0) && (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-semibold">No onboarding sessions yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">Create a session for any candidate in the Offer or Hired stage to get started.</p>
            <Button className="mt-2 gap-1.5" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" /> Create First Session
            </Button>
          </div>
        )}

        {!isLoading && sessions && sessions.length > 0 && (
          <div className="divide-y">
            <div className="grid grid-cols-[1fr_1fr_7rem_7rem_5rem] gap-4 px-5 py-3 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span>Candidate</span>
              <span>Role</span>
              <span>Joining</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            {(sessions as Session[]).map(s => {
              const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const isRejected = !!s.rejected_at;
              const subdomain = s.organizations?.subdomain ?? null;
              return (
                <div key={s.id} className={`grid grid-cols-[1fr_1fr_7rem_7rem_5rem] gap-4 px-5 py-4 items-center hover:bg-muted/20 transition-colors ${isRejected ? "opacity-60" : ""}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.candidate_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.candidate_email}</p>
                  </div>
                  <p className="text-sm truncate text-muted-foreground">{s.job_title ?? "—"}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {s.joining_date
                      ? <><Calendar className="h-3.5 w-3.5 shrink-0" />{new Date(s.joining_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</>
                      : "—"}
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold w-fit ${cfg.cls}`}>
                    <StatusIcon className="h-3 w-3 shrink-0" />
                    {cfg.label}
                  </span>
                  <div className="flex items-center justify-end gap-1">
                    {!isRejected && (
                      <>
                        <button onClick={() => copyLink(s.token, subdomain)} title="Copy link"
                          className="grid h-7 w-7 place-items-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <a href={getPortalUrl(s.token, subdomain)} target="_blank" rel="noopener noreferrer" title="Open portal"
                          className="grid h-7 w-7 place-items-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </>
                    )}
                    {isRejected && (
                      <span title="Rejected">
                        <XCircle className="h-4 w-4 text-red-400 mr-1" />
                      </span>
                    )}
                    <Link to="/employee-onboarding/$id" params={{ id: s.id }} title="View details"
                      className="grid h-7 w-7 place-items-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNew && <NewSessionModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
