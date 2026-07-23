import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Sparkles, Loader2, CheckCircle2, Zap, Hand,
  ChevronRight, Info,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings/ai-screening")({
  component: AiScreeningSettings,
});

type AiMode = "recommendation" | "automatic" | "manual";

type AiScreeningCfg = {
  mode: AiMode;
  auto_advance_threshold: number;
  auto_reject_threshold: number;
};

const DEFAULT_CFG: AiScreeningCfg = {
  mode: "recommendation",
  auto_advance_threshold: 85,
  auto_reject_threshold: 30,
};

const MODES: {
  id: AiMode;
  icon: React.ReactNode;
  title: string;
  badge: string;
  description: string;
  bullets: string[];
  accentBorder: string;
  accentBg: string;
  accentText: string;
  badgeCls: string;
}[] = [
  {
    id: "recommendation",
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "AI Recommendation",
    badge: "Recommended Default",
    description: "Leah reviews every application, scores it, and recommends which stage to move the candidate to. Recruiters make the final call.",
    bullets: [
      "AI scores and summarises every resume automatically",
      "Each candidate card shows Leah's recommended next stage",
      "Recruiters approve or override with one click",
      "Nothing moves without a human decision",
    ],
    accentBorder: "border-primary",
    accentBg: "bg-primary/5",
    accentText: "text-primary",
    badgeCls: "bg-primary/10 text-primary border-primary/20",
  },
  {
    id: "automatic",
    icon: <Zap className="h-5 w-5" />,
    title: "Automatic Progression",
    badge: "Fastest pipeline",
    description: "Candidates who exceed your score threshold are moved to Screening automatically. Those who fall below the reject threshold are declined without manual work.",
    bullets: [
      "High scorers auto-advance to Screening instantly after applying",
      "Low scorers are auto-rejected (configurable threshold)",
      "Mid-range candidates stay in AI Screening for recruiter review",
      "Full audit trail — every auto-move is logged",
    ],
    accentBorder: "border-amber-400",
    accentBg: "bg-amber-50/60",
    accentText: "text-amber-700",
    badgeCls: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    id: "manual",
    icon: <Hand className="h-5 w-5" />,
    title: "Manual Only",
    badge: "Full recruiter control",
    description: "AI scores and summarises every candidate in the background, but never moves anyone. Recruiters use scores as a signal and decide everything themselves.",
    bullets: [
      "AI score and summary visible on every card",
      "Leah AI assistant available for pipeline questions",
      "No automatic stage changes — ever",
      "Best for teams with specific hiring processes",
    ],
    accentBorder: "border-slate-300",
    accentBg: "bg-slate-50",
    accentText: "text-slate-700",
    badgeCls: "bg-slate-100 text-slate-600 border-slate-200",
  },
];

function AiScreeningSettings() {
  const { data: org } = useCurrentOrg();
  const qc = useQueryClient();

  const { data: saved, isLoading } = useQuery<AiScreeningCfg>({
    enabled: !!org?.id,
    queryKey: ["ai-screening-cfg", org?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("organization_settings")
        .select("crm_config")
        .eq("organization_id", org!.id)
        .maybeSingle();
      const raw = (data?.crm_config as Record<string, unknown>)?.ai_screening as Partial<AiScreeningCfg> | undefined;
      return { ...DEFAULT_CFG, ...raw };
    },
  });

  const [cfg, setCfg] = useState<AiScreeningCfg>(DEFAULT_CFG);
  useEffect(() => { if (saved) setCfg(saved); }, [saved]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase
        .from("organization_settings")
        .select("crm_config")
        .eq("organization_id", org!.id)
        .maybeSingle();
      const current = (existing?.crm_config as Record<string, unknown>) ?? {};
      const { error } = await supabase.from("organization_settings").upsert({
        organization_id: org!.id,
        crm_config: { ...current, ai_screening: cfg },
        updated_at: new Date().toISOString(),
      }, { onConflict: "organization_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-screening-cfg", org?.id] });
      toast.success("AI Screening settings saved");
    },
    onError: e => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  if (isLoading) return (
    <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Recruiter Control Mode</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose how much Leah (your AI hiring assistant) influences candidate movement through the pipeline.
          </p>
        </div>
      </div>

      {/* Mode cards */}
      <div className="space-y-3">
        {MODES.map(mode => {
          const active = cfg.mode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setCfg(c => ({ ...c, mode: mode.id }))}
              className={`w-full text-left rounded-xl border-2 p-5 transition-all duration-150 ${
                active ? `${mode.accentBorder} ${mode.accentBg}` : "border-border bg-card hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Radio */}
                <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                  active ? `${mode.accentBorder} ${mode.accentBg}` : "border-muted-foreground/30"
                }`}>
                  {active && <div className={`h-2.5 w-2.5 rounded-full ${mode.accentText.replace("text-", "bg-")}`} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <div className={`${mode.accentText}`}>{mode.icon}</div>
                    <span className="font-semibold text-[15px]">{mode.title}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${mode.badgeCls}`}>
                      {mode.badge}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{mode.description}</p>
                  <ul className="space-y-1">
                    {mode.bullets.map(b => (
                      <li key={b} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <ChevronRight className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${active ? mode.accentText : ""}`} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Threshold sliders — only shown in automatic mode */}
      {cfg.mode === "automatic" && (
        <Card className="border-amber-200 bg-amber-50/40 shadow-sm">
          <CardContent className="pt-5 space-y-5">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="font-semibold text-sm">Automatic progression thresholds</p>
            </div>

            {/* Advance threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto-advance to Screening if score ≥</label>
                <span className="text-lg font-bold tabular-nums text-emerald-600">{cfg.auto_advance_threshold}</span>
              </div>
              <input
                type="range" min={60} max={95} step={5}
                value={cfg.auto_advance_threshold}
                onChange={e => setCfg(c => ({ ...c, auto_advance_threshold: Number(e.target.value) }))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>60 — More candidates advance</span>
                <span>95 — Only top matches</span>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1.5 bg-white/60 rounded-lg p-2.5 border border-amber-200">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                Candidates scoring at or above <strong className="text-emerald-700">&nbsp;{cfg.auto_advance_threshold}&nbsp;</strong> will be automatically moved to the <strong>Screening</strong> stage the moment their resume is scored.
              </p>
            </div>

            {/* Reject threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto-reject if score &lt;</label>
                <span className="text-lg font-bold tabular-nums text-red-500">{cfg.auto_reject_threshold}</span>
              </div>
              <input
                type="range" min={10} max={55} step={5}
                value={cfg.auto_reject_threshold}
                onChange={e => setCfg(c => ({ ...c, auto_reject_threshold: Number(e.target.value) }))}
                className="w-full accent-red-400"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>10 — Rarely auto-reject</span>
                <span>55 — Reject weak matches</span>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1.5 bg-white/60 rounded-lg p-2.5 border border-amber-200">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                Candidates scoring below <strong className="text-red-600">&nbsp;{cfg.auto_reject_threshold}&nbsp;</strong> are automatically rejected. Set to 10 to almost never auto-reject.
              </p>
            </div>

            {/* Zone summary */}
            <div className="rounded-lg border border-amber-200 bg-white/60 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Score zones</p>
              {[
                { label: `≥ ${cfg.auto_advance_threshold}`,                           action: "Auto-advance to Screening", color: "bg-emerald-500" },
                { label: `${cfg.auto_reject_threshold} – ${cfg.auto_advance_threshold - 1}`, action: "Stays in AI Screening queue for review", color: "bg-amber-400" },
                { label: `< ${cfg.auto_reject_threshold}`,                            action: "Auto-rejected",             color: "bg-red-400" },
              ].map(z => (
                <div key={z.label} className="flex items-center gap-2 text-xs">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${z.color}`} />
                  <span className="font-semibold w-20 shrink-0 tabular-nums">{z.label}</span>
                  <span className="text-muted-foreground">{z.action}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info callout for recommendation mode */}
      {cfg.mode === "recommendation" && (
        <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <p>In Recommendation mode all candidates stay in <strong>Applied</strong> until a recruiter acts. Visit the <Link to="/ai/screening" className="text-primary underline-offset-2 hover:underline">AI Screening queue</Link> to review Leah's suggestions and advance or reject candidates with one click.</p>
        </div>
      )}

      {/* Info callout for manual mode */}
      {cfg.mode === "manual" && (
        <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-slate-500" />
          <p>In Manual mode AI scores still appear on every candidate card and the <Link to="/ai/screening" className="text-primary underline-offset-2 hover:underline">AI Screening</Link> page is still available as a view — Leah just won't move anyone automatically.</p>
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-1.5 min-w-32">
          {save.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
