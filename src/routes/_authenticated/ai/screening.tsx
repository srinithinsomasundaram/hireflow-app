import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Sparkles, Loader2, CheckCircle2, XCircle, ChevronRight,
  ArrowUpDown, Clock, Filter, Settings2, X, Check,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { scoreApplication } from "@/lib/ai.functions";
import { changeStageFn } from "@/lib/automations.functions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ApplicationDrawer } from "@/components/application-drawer";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/ai/screening")({
  head: () => ({ meta: [{ title: "AI Screening · HireFlow" }] }),
  component: AiScreening,
});

type App = {
  id: string;
  stage: string;
  ai_score: number | null;
  ai_summary: string | null;
  applied_at: string;
  job_id: string;
  candidates: { full_name: string; email: string; experience_years: number | null } | null;
  jobs: { title: string; department: string | null } | null;
};

type AiScreeningCfg = {
  enabled?: boolean;
  auto_advance_threshold?: number;
  auto_reject_threshold?: number;
  require_approval?: boolean;
};

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-500 bg-red-50 border-red-200";
}

function scoreLabel(score: number) {
  if (score >= 75) return "Strong match";
  if (score >= 50) return "Partial match";
  return "Weak match";
}

function stageTag(stage: string) {
  const map: Record<string, string> = {
    applied: "bg-slate-100 text-slate-600",
    screening: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-600",
  };
  return map[stage] ?? "bg-muted text-muted-foreground";
}

// ─── Settings panel ───────────────────────────────────────────────────────────

function SettingsPanel({ orgId, cfg, onClose }: { orgId: string; cfg: AiScreeningCfg; onClose: () => void }) {
  const qc = useQueryClient();
  const [local, setLocal] = useState<AiScreeningCfg>({
    enabled: cfg.enabled ?? false,
    auto_advance_threshold: cfg.auto_advance_threshold ?? 75,
    auto_reject_threshold: cfg.auto_reject_threshold ?? 30,
    require_approval: cfg.require_approval ?? false,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { data: existing } = await supabase
      .from("organization_settings")
      .select("crm_config")
      .eq("organization_id", orgId)
      .maybeSingle();
    const current = (existing?.crm_config as Record<string, unknown>) ?? {};
    await supabase.from("organization_settings").upsert({
      organization_id: orgId,
      crm_config: { ...current, ai_screening: local },
      updated_at: new Date().toISOString(),
    }, { onConflict: "organization_id" });
    qc.invalidateQueries({ queryKey: ["ai-screening-cfg", orgId] });
    toast.success("AI screening settings saved");
    setSaving(false);
    onClose();
  }

  return (
    <div className="rounded-2xl border bg-card shadow-lg p-5 space-y-5 w-80">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">AI Screening settings</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="ai-enabled" className="text-sm">Enable AI screening</Label>
        <Switch id="ai-enabled" checked={local.enabled} onCheckedChange={v => setLocal({ ...local, enabled: v })} />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="ai-approval" className="text-sm">Require recruiter approval</Label>
        <Switch id="ai-approval" checked={local.require_approval} onCheckedChange={v => setLocal({ ...local, require_approval: v })} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Auto-advance to Screening if score ≥</Label>
        <div className="flex items-center gap-3">
          <input
            type="range" min={50} max={95} step={5}
            value={local.auto_advance_threshold}
            onChange={e => setLocal({ ...local, auto_advance_threshold: Number(e.target.value) })}
            className="flex-1 accent-emerald-500"
          />
          <span className="w-8 text-sm font-semibold tabular-nums text-emerald-600">{local.auto_advance_threshold}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">Candidates scoring at or above this are auto-moved to Screening</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Auto-reject if score &lt;</Label>
        <div className="flex items-center gap-3">
          <input
            type="range" min={10} max={50} step={5}
            value={local.auto_reject_threshold}
            onChange={e => setLocal({ ...local, auto_reject_threshold: Number(e.target.value) })}
            className="flex-1 accent-red-400"
          />
          <span className="w-8 text-sm font-semibold tabular-nums text-red-500">{local.auto_reject_threshold}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">Candidates below this score are auto-rejected (only when approval not required)</p>
      </div>

      <Button className="w-full" onClick={save} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />} Save settings
      </Button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function AiScreening() {
  const { data: org } = useCurrentOrg();
  const qc = useQueryClient();
  const [stageFilter, setStageFilter] = useState<string>("applied");
  const [sortByScore, setSortByScore] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [scoringIds, setScoringIds] = useState<Set<string>>(new Set());
  const [drawerAppId, setDrawerAppId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Load AI screening config ──────────────────────────────────────────────
  const { data: cfg } = useQuery<AiScreeningCfg>({
    enabled: !!org?.id,
    queryKey: ["ai-screening-cfg", org?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("organization_settings")
        .select("crm_config")
        .eq("organization_id", org!.id)
        .maybeSingle();
      return ((data?.crm_config as Record<string, unknown>)?.ai_screening as AiScreeningCfg) ?? {};
    },
  });

  // ── Load applications ──────────────────────────────────────────────────────
  const { data: apps, isLoading } = useQuery<App[]>({
    enabled: !!org?.id,
    queryKey: ["ai-screening-apps", org?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, stage, ai_score, ai_summary, applied_at, job_id, candidates(full_name, email, experience_years), jobs(title, department)")
        .eq("organization_id", org!.id)
        .order("applied_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as App[];
    },
  });

  const filtered = useMemo(() => {
    let list = (apps ?? []).filter(a => stageFilter === "all" || a.stage === stageFilter);
    if (sortByScore) {
      list = [...list].sort((a, b) => {
        if (a.ai_score == null && b.ai_score == null) return 0;
        if (a.ai_score == null) return 1;
        if (b.ai_score == null) return -1;
        return b.ai_score - a.ai_score;
      });
    }
    return list;
  }, [apps, stageFilter, sortByScore]);

  const unscoredCount = useMemo(() => (apps ?? []).filter(a => a.ai_score == null && a.stage === "applied").length, [apps]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const all = apps ?? [];
    return {
      pending: all.filter(a => a.stage === "applied").length,
      advanced: all.filter(a => a.stage === "screening").length,
      rejected: all.filter(a => a.stage === "rejected").length,
      avgScore: (() => {
        const scored = all.filter(a => a.ai_score != null);
        return scored.length ? Math.round(scored.reduce((s, a) => s + a.ai_score!, 0) / scored.length) : null;
      })(),
    };
  }, [apps]);

  // ── Actions ───────────────────────────────────────────────────────────────
  async function scoreOne(appId: string) {
    setScoringIds(s => new Set(s).add(appId));
    try {
      await scoreApplication({ data: { applicationId: appId, force: false } });
      qc.invalidateQueries({ queryKey: ["ai-screening-apps", org?.id] });
    } catch { toast.error("Scoring failed"); }
    finally { setScoringIds(s => { const n = new Set(s); n.delete(appId); return n; }); }
  }

  async function scoreAll() {
    const unscored = (apps ?? []).filter(a => a.ai_score == null && a.stage === "applied");
    if (!unscored.length) { toast("All applications are already scored"); return; }
    setScoringIds(new Set(unscored.map(a => a.id)));
    let done = 0;
    for (const a of unscored) {
      try { await scoreApplication({ data: { applicationId: a.id, force: false } }); done++; }
      catch { /* continue */ }
      finally { setScoringIds(p => { const n = new Set(p); n.delete(a.id); return n; }); }
    }
    qc.invalidateQueries({ queryKey: ["ai-screening-apps", org?.id] });
    toast.success(`Scored ${done} application${done !== 1 ? "s" : ""}`);
  }

  const moveStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      changeStageFn({ data: { applicationId: id, stage: stage as "screening" | "rejected" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-screening-apps", org?.id] }),
    onError: () => toast.error("Could not update stage"),
  });

  async function advanceOne(id: string) { moveStage.mutate({ id, stage: "screening" }); }
  async function rejectOne(id: string)  { moveStage.mutate({ id, stage: "rejected" }); }

  async function bulkAdvance() {
    await Promise.all(Array.from(selected).map(id => changeStageFn({ data: { applicationId: id, stage: "screening" } })));
    qc.invalidateQueries({ queryKey: ["ai-screening-apps", org?.id] });
    toast.success(`Advanced ${selected.size} to Screening`);
    setSelected(new Set());
  }

  async function bulkReject() {
    await Promise.all(Array.from(selected).map(id => changeStageFn({ data: { applicationId: id, stage: "rejected" } })));
    qc.invalidateQueries({ queryKey: ["ai-screening-apps", org?.id] });
    toast.success(`Rejected ${selected.size} candidates`);
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const relTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return "Just now";
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  };

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">AI Screening</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Leah reviews every application and recommends which candidates to advance.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unscoredCount > 0 && (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={scoreAll} disabled={scoringIds.size > 0}>
              {scoringIds.size > 0 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Score all ({unscoredCount})
            </Button>
          )}
          <div className="relative">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5"
              onClick={() => setShowSettings(v => !v)}>
              <Settings2 className="h-3.5 w-3.5" /> Settings
            </Button>
            {showSettings && (
              <div className="absolute right-0 top-10 z-50">
                <SettingsPanel orgId={org?.id ?? ""} cfg={cfg ?? {}} onClose={() => setShowSettings(false)} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Config status banner */}
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
        cfg?.enabled ? "border-emerald-200 bg-emerald-50/60 text-emerald-800" : "border-amber-200 bg-amber-50/60 text-amber-800"
      }`}>
        <div className={`h-2 w-2 rounded-full shrink-0 ${cfg?.enabled ? "bg-emerald-500" : "bg-amber-400"}`} />
        {cfg?.enabled ? (
          <>
            AI screening is <strong>active</strong> — candidates scoring ≥&nbsp;{cfg.auto_advance_threshold ?? 75} auto-advance to Screening
            {cfg.require_approval ? "; approval required" : ""}
            {(cfg.auto_reject_threshold ?? 30) > 0 && <>; scores &lt;&nbsp;{cfg.auto_reject_threshold ?? 30} auto-rejected</>}
          </>
        ) : (
          <>AI screening is <strong>off</strong> — enable it in Settings to auto-advance candidates based on score</>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Pending review", value: stats.pending, color: "border-l-slate-400" },
          { label: "Advanced to screening", value: stats.advanced, color: "border-l-blue-500" },
          { label: "Auto-rejected", value: stats.rejected, color: "border-l-red-400" },
          { label: "Avg AI score", value: stats.avgScore != null ? `${stats.avgScore}/100` : "—", color: "border-l-amber-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border border-l-4 ${color} px-4 py-3 bg-card`}>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="h-8 text-xs w-36 gap-1">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            <SelectItem value="applied">Pending (Applied)</SelectItem>
            <SelectItem value="screening">Advanced</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={sortByScore ? "default" : "outline"} size="sm" className="h-8 text-xs gap-1.5"
          onClick={() => setSortByScore(v => !v)}>
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortByScore ? "Score ↓" : "Sort by score"}
        </Button>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto rounded-lg border bg-primary/5 border-primary/20 px-3 py-1.5">
            <span className="text-xs font-semibold">{selected.size} selected</span>
            <Button size="sm" variant="outline" className="h-6 text-xs gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={bulkAdvance}>
              <Check className="h-3 w-3" /> Advance
            </Button>
            <Button size="sm" variant="outline" className="h-6 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={bulkReject}>
              <X className="h-3 w-3" /> Reject
            </Button>
            <button onClick={() => setSelected(new Set())} className="text-muted-foreground hover:text-foreground ml-1">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading applications…
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground">No applications in this view</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Try changing the stage filter or wait for new applications</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden divide-y">
          {filtered.map(app => {
            const isScoring = scoringIds.has(app.id);
            const sel = selected.has(app.id);
            const recommended = app.ai_score != null
              ? app.ai_score >= (cfg?.auto_advance_threshold ?? 75) ? "screening"
              : app.ai_score < (cfg?.auto_reject_threshold ?? 30) ? "rejected"
              : "manual"
              : null;

            return (
              <div key={app.id} className={`flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors ${sel ? "bg-primary/5" : ""}`}>

                {/* Select checkbox */}
                <button onClick={() => toggleSelect(app.id)}
                  className={`shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${sel ? "bg-primary border-primary" : "border-muted-foreground/30 hover:border-primary"}`}>
                  {sel && <div className="h-2 w-2 rounded-sm bg-white" />}
                </button>

                {/* Avatar */}
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {(app.candidates?.full_name ?? "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                </div>

                {/* Name + job */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{app.candidates?.full_name ?? "Unknown"}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${stageTag(app.stage)}`}>
                      {app.stage.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-xs text-muted-foreground truncate">{app.jobs?.title ?? "—"}</p>
                    {app.candidates?.experience_years != null && (
                      <span className="text-[10px] text-muted-foreground/60">{app.candidates.experience_years}yr exp</span>
                    )}
                    <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />{relTime(app.applied_at)}
                    </span>
                  </div>
                </div>

                {/* AI score + recommendation */}
                <div className="shrink-0 flex flex-col items-end gap-1 min-w-[100px]">
                  {app.ai_score != null ? (
                    <>
                      <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreColor(app.ai_score)}`}>
                        <Sparkles className="h-3 w-3" />{app.ai_score}/100
                      </div>
                      <p className="text-[10px] text-muted-foreground">{scoreLabel(app.ai_score)}</p>
                    </>
                  ) : (
                    <button onClick={() => scoreOne(app.id)} disabled={isScoring}
                      className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-amber-600 hover:border-amber-300 transition-colors disabled:opacity-50">
                      {isScoring ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      {isScoring ? "Scoring…" : "Score"}
                    </button>
                  )}
                </div>

                {/* Recommendation badge */}
                {recommended && app.stage === "applied" && (
                  <div className={`shrink-0 hidden sm:flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                    recommended === "screening" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    recommended === "rejected"  ? "bg-red-50 text-red-600 border-red-200" :
                    "bg-slate-50 text-slate-600 border-slate-200"
                  }`}>
                    {recommended === "screening" ? <CheckCircle2 className="h-3 w-3" /> :
                     recommended === "rejected"  ? <XCircle className="h-3 w-3" /> :
                     <Clock className="h-3 w-3" />}
                    {recommended === "screening" ? "Advance" : recommended === "rejected" ? "Reject" : "Review"}
                  </div>
                )}

                {/* Summary tooltip-like */}
                {app.ai_summary && (
                  <div className="hidden lg:block max-w-[160px] shrink-0">
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{app.ai_summary}</p>
                  </div>
                )}

                {/* Actions */}
                {app.stage === "applied" && (
                  <div className="shrink-0 flex items-center gap-1.5">
                    <Button size="sm" variant="outline"
                      className="h-7 w-7 p-0 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      title="Advance to Screening"
                      onClick={() => advanceOne(app.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline"
                      className="h-7 w-7 p-0 text-red-500 border-red-200 hover:bg-red-50"
                      title="Reject"
                      onClick={() => rejectOne(app.id)}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {/* Open drawer */}
                <button onClick={() => setDrawerAppId(app.id)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ApplicationDrawer
        applicationId={drawerAppId}
        onClose={() => setDrawerAppId(null)}
        onOpenCandidate={() => {}}
      />
    </div>
  );
}
