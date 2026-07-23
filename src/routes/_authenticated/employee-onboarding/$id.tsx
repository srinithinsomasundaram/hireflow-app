import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Loader2, ArrowLeft, CheckCircle2, Circle, Copy, ExternalLink, Calendar,
  User, Briefcase, Settings2, FileText, Upload, XCircle,
  AlertTriangle, Mail, FileDown, CheckCheck, X, Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  getOnboardingDetails, updateOnboardingConfig,
  rejectOnboardingSession, resendOnboardingInvite,
} from "@/lib/onboarding.functions";
import type { AgreementItem, CustomFieldsConfig, DocumentItem } from "@/routes/welcome/$token";
import { Button } from "@/components/ui/button";
import {
  AgreementEditor, DocumentsEditor, CustomFieldsEditor, SECTION_LABELS,
} from "@/components/onboarding/editors";

export const Route = createFileRoute("/_authenticated/employee-onboarding/$id")({
  head: () => ({ meta: [{ title: "Onboarding Details · HireFlow" }] }),
  component: OnboardingDetail,
});

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:     { label: "Pending",     cls: "bg-slate-100 text-slate-600 border-slate-200" },
  in_progress: { label: "In Progress", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  submitted:   { label: "Submitted",   cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  completed:   { label: "Completed",   cls: "bg-green-100 text-green-700 border-green-200" },
  rejected:    { label: "Rejected",    cls: "bg-red-100 text-red-700 border-red-200" },
};

function getPortalUrl(token: string, subdomain?: string | null): string {
  const appDomain = "hireflow.yesp.space";
  const base = subdomain
    ? `https://${subdomain}.${appDomain}`
    : (typeof window !== "undefined" ? window.location.origin : `https://${appDomain}`);
  return `${base}/welcome/${token}`;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type DocState    = { name: string; url: string } | null;
type AgreementState = { agreed: boolean; signature: string; signed_at: string };

// ─── PDF generator ─────────────────────────────────────────────────────────────

function generatePdf(opts: {
  session: Record<string, unknown>;
  sections: { section: string; data: Record<string, unknown> }[];
  docsConfig: DocumentItem[];
  agreeConfig: AgreementItem[];
}) {
  const { session, sections, docsConfig, agreeConfig } = opts;
  const fmtKey  = (k: string) => k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const fmtDate = (s: string) => { try { return new Date(s).toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return s; } };

  const sectionOrder = ["personal", "employment", "banking", "tax", "additional", "documents", "agreements"];
  const ordered = sectionOrder
    .map(id => sections.find(s => s.section === id))
    .filter(Boolean) as typeof sections;

  const sectionHtml = ordered.map(s => {
    if (s.section === "documents") {
      const rows = docsConfig.map(doc => {
        const st = s.data[doc.key] as DocState;
        return `<tr>
          <td>${doc.label}</td>
          <td>${st?.name ?? "—"}</td>
          <td>${st?.url ? `<a href="${st.url}">${st.url}</a>` : "Not uploaded"}</td>
        </tr>`;
      }).join("");
      return `<section><h2>Uploaded Documents</h2><table><thead><tr><th>Document</th><th>File Name</th><th>Download URL</th></tr></thead><tbody>${rows}</tbody></table></section>`;
    }

    if (s.section === "agreements") {
      const rows = agreeConfig.map(a => {
        const st = s.data[a.id] as AgreementState | undefined;
        return `<tr>
          <td>${a.name}</td>
          <td>${st?.agreed ? "✓ Signed" : "✗ Not signed"}</td>
          <td>${st?.signature ?? "—"}</td>
          <td>${st?.signed_at ? fmtDate(st.signed_at) : "—"}</td>
        </tr>`;
      }).join("");
      return `<section><h2>Digital Agreements</h2><table><thead><tr><th>Agreement</th><th>Status</th><th>Signed By</th><th>Signed At</th></tr></thead><tbody>${rows}</tbody></table></section>`;
    }

    const entries = Object.entries(s.data).filter(([, v]) => v != null && v !== "");
    if (entries.length === 0) return "";
    const rows = entries.map(([k, v]) => `<tr><td>${fmtKey(k)}</td><td>${String(v)}</td></tr>`).join("");
    const label = (SECTION_LABELS as Record<string, string>)[s.section] ?? s.section;
    return `<section><h2>${label}</h2><table><tbody>${rows}</tbody></table></section>`;
  }).join("");

  const companyName = (Array.isArray(session.organizations) ? session.organizations[0] : session.organizations as Record<string, unknown> | null)?.company_name ?? "Company";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Onboarding — ${session.candidate_name ?? ""}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; padding: 40px 48px; font-size: 13px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #111827; margin-bottom: 24px; }
  header h1 { font-size: 22px; font-weight: 700; }
  header .meta { text-align: right; color: #6b7280; font-size: 12px; line-height: 1.8; }
  section { margin-bottom: 24px; break-inside: avoid; }
  section h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; font-size: 13px; vertical-align: top; }
  th { font-weight: 600; background: #f9fafb; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; }
  td:first-child { color: #6b7280; width: 200px; white-space: nowrap; }
  a { color: #2563eb; }
  footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
  @media print { body { padding: 20px 28px; } }
</style>
</head>
<body>
<header>
  <div>
    <h1>${session.candidate_name ?? "Candidate"}</h1>
    <p style="color:#6b7280;margin-top:4px;">${session.candidate_email ?? ""}</p>
    ${session.job_title ? `<p style="margin-top:2px;color:#6b7280;">${session.job_title}${session.department ? ` · ${session.department}` : ""}</p>` : ""}
    ${session.joining_date ? `<p style="margin-top:2px;color:#6b7280;">Joining: ${new Date(String(session.joining_date)).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>` : ""}
  </div>
  <div class="meta">
    <div><strong>${companyName}</strong></div>
    <div>Onboarding Report</div>
    <div>Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
  </div>
</header>
${sectionHtml}
<footer>Generated by HireFlow · Confidential</footer>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  }
}

// ─── Submitted Data View ────────────────────────────────────────────────────────

function SubmittedDataView({ sections, session }: {
  sections: { section: string; data: Record<string, unknown>; completed: boolean; updated_at: string }[];
  session: Record<string, unknown>;
}) {
  const docsConfig  = (session.documents_config  as DocumentItem[])  ?? [];
  const agreeConfig = (session.agreements_config as AgreementItem[]) ?? [];

  const docsSection  = sections.find(s => s.section === "documents");
  const agreeSection = sections.find(s => s.section === "agreements");
  const textSections = sections.filter(s => s.section !== "documents" && s.section !== "agreements");

  const fmtKey = (k: string) => k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="space-y-5">
      {/* Text sections */}
      {textSections.map(s => {
        const entries = Object.entries(s.data).filter(([, v]) => v != null && v !== "" && typeof v !== "object");
        if (entries.length === 0) return null;
        return (
          <div key={s.section} className="rounded-xl border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/30">
              <p className="text-sm font-semibold">{(SECTION_LABELS as Record<string, string>)[s.section] ?? s.section}</p>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {entries.map(([k, v]) => (
                <div key={k}>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{fmtKey(k)}</p>
                  <p className="text-sm font-medium mt-0.5">{String(v)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Uploaded documents */}
      {docsSection && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Uploaded Documents</p>
          </div>
          <div className="divide-y">
            {(docsConfig.length > 0 ? docsConfig : Object.keys(docsSection.data).map(k => ({ key: k, label: fmtKey(k) }))).map(doc => {
              const st = docsSection.data[(doc as DocumentItem).key ?? (doc as { key: string }).key] as DocState;
              const label = (doc as DocumentItem).label ?? fmtKey((doc as { key: string }).key);
              return (
                <div key={(doc as { key: string }).key} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${st ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground/40"}`}>
                    <FileDown className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    {st?.name && <p className="text-xs text-muted-foreground mt-0.5">{st.name}</p>}
                  </div>
                  {st?.url ? (
                    <a href={st.url} target="_blank" rel="noopener" download={st.name}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline shrink-0 bg-primary/5 rounded-lg px-3 py-1.5">
                      <Download className="h-3 w-3" /> Download
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground shrink-0">Not uploaded</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agreements */}
      {agreeSection && agreeConfig.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Digital Agreements & Consent</p>
          </div>
          <div className="divide-y">
            {agreeConfig.map(a => {
              const st = agreeSection.data[a.id] as AgreementState | undefined;
              return (
                <div key={a.id} className="px-5 py-4 flex items-start gap-3">
                  <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full mt-0.5 ${st?.agreed ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>
                    {st?.agreed ? <CheckCheck className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{a.name}</p>
                      <span className={`text-[10px] rounded-full px-2 py-0.5 font-semibold shrink-0 ${st?.agreed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                        {st?.agreed ? "Signed" : "Not signed"}
                      </span>
                    </div>
                    {st?.agreed && (
                      <div className="mt-1.5 space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          Signed by: <span className="font-semibold text-foreground">{st.signature}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(st.signed_at).toLocaleString("en-IN", {
                            day: "numeric", month: "long", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reject Dialog ─────────────────────────────────────────────────────────────

function RejectDialog({ onConfirm, onCancel, isPending }: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border bg-white shadow-2xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-base">Reject this session?</h2>
            <p className="text-sm text-muted-foreground mt-0.5">The candidate will no longer be able to access this onboarding link. You can create a new session afterwards.</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Reason <span className="text-muted-foreground text-xs">(optional)</span></label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Candidate withdrew, position filled…"
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 resize-none"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" className="flex-1" disabled={isPending} onClick={() => onConfirm(reason)}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Reject Session
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

function OnboardingDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"overview" | "configure" | "data">("overview");
  const [showReject, setShowReject]     = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["onboarding-detail", id],
    queryFn: () => getOnboardingDetails({ data: { sessionId: id } }),
    retry: false,
  });

  const updateConfig = useMutation({
    mutationFn: (payload: { agreementsConfig?: AgreementItem[]; customFieldsConfig?: CustomFieldsConfig; documentsConfig?: DocumentItem[] }) =>
      updateOnboardingConfig({ data: { sessionId: id, ...payload } }),
    onSuccess: () => {
      toast.success("Configuration saved");
      qc.invalidateQueries({ queryKey: ["onboarding-detail", id] });
    },
    onError: e => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const reject = useMutation({
    mutationFn: (reason: string) => rejectOnboardingSession({ data: { sessionId: id, reason: reason || undefined } }),
    onSuccess: () => {
      toast.success("Session rejected");
      setShowReject(false);
      qc.invalidateQueries({ queryKey: ["onboarding-detail", id] });
      qc.invalidateQueries({ queryKey: ["onboarding-sessions"] });
    },
    onError: e => toast.error(e instanceof Error ? e.message : "Failed to reject"),
  });

  if (isLoading) return (
    <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
  );

  if (!data) return (
    <div className="text-center py-16 text-muted-foreground">Session not found.</div>
  );

  const { session, sections } = data;
  const completedSections = new Set(sections.filter((s: { completed: boolean }) => s.completed).map((s: { section: string }) => s.section));
  const allSections = Object.keys(SECTION_LABELS);
  const pct = Math.round((completedSections.size / allSections.length) * 100);
  const statusCfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.pending;
  const isRejected = !!session.rejected_at;
  const canReject = !isRejected && session.status !== "submitted" && session.status !== "completed";
  const org = (Array.isArray(session.organizations) ? session.organizations[0] : session.organizations) as { subdomain?: string | null } | null;
  const portalUrl = getPortalUrl(session.token, org?.subdomain);

  function copyLink() {
    navigator.clipboard.writeText(portalUrl)
      .then(() => toast.success("Link copied!"))
      .catch(() => toast.error("Could not copy"));
  }

  async function handleResendInvite() {
    setResendLoading(true);
    try {
      await resendOnboardingInvite({ data: { sessionId: id } });
      toast.success("Invite email sent!", { description: `Sent to ${session.candidate_email}` });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send email");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {showReject && (
        <RejectDialog
          onConfirm={reason => reject.mutate(reason)}
          onCancel={() => setShowReject(false)}
          isPending={reject.isPending}
        />
      )}

      {/* Back */}
      <Link to="/employee-onboarding" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" /> All sessions
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary text-lg font-bold">
              {session.candidate_name?.[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold">{session.candidate_name}</h1>
              <p className="text-sm text-muted-foreground">{session.candidate_email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusCfg.cls}`}>{statusCfg.label}</span>
            {canReject && (
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => setShowReject(true)}>
                <XCircle className="h-3.5 w-3.5" /> Reject Session
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="h-4 w-4 shrink-0" /><span>{session.job_title ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4 shrink-0" /><span>{session.department ?? "—"}</span>
          </div>
          {session.joining_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{new Date(session.joining_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
          )}
        </div>

        {isRejected && session.rejection_reason && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            <span className="font-semibold">Rejection reason:</span> {session.rejection_reason}
          </div>
        )}

        {/* Progress */}
        {!isRejected && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{completedSections.size}/{allSections.length} sections completed</span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* Link actions */}
        {!isRejected && (
          <div className="flex gap-2 pt-1 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={copyLink}>
              <Copy className="h-3.5 w-3.5" /> Copy portal link
            </Button>
            <a href={portalUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                <ExternalLink className="h-3.5 w-3.5" /> Open portal
              </Button>
            </a>
            {(session.status === "pending" || session.status === "in_progress") && (
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={handleResendInvite} disabled={resendLoading}>
                {resendLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                Resend Invite
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b">
        {(["overview", "configure", ...((session.status === "submitted" || session.status === "completed") ? ["data"] : [])] as const).map(t => (
          <button key={t} onClick={() => setTab(t as typeof tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors capitalize border-b-2 -mb-px ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t === "configure" ? "Configure" : t === "data" ? "Submitted Data" : "Overview"}
          </button>
        ))}
        {(session.status === "submitted" || session.status === "completed") && (
          <button
            onClick={() => generatePdf({
              session: session as Record<string, unknown>,
              sections,
              docsConfig: (session.documents_config as DocumentItem[]) ?? [],
              agreeConfig: (session.agreements_config as AgreementItem[]) ?? [],
            })}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors mb-px">
            <Download className="h-3.5 w-3.5" /> Download PDF
          </button>
        )}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b bg-muted/30">
            <p className="text-sm font-semibold">Onboarding Checklist</p>
          </div>
          <div className="divide-y">
            {allSections.map(s => {
              const done = completedSections.has(s);
              const sectionData = sections.find((sd: { section: string }) => sd.section === s);
              return (
                <div key={s} className="flex items-center gap-4 px-5 py-4">
                  {done
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    : <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${done ? "" : "text-muted-foreground"}`}>{SECTION_LABELS[s]}</p>
                    {sectionData && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Last updated {new Date(sectionData.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${done ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {done ? "Done" : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Configure tab */}
      {tab === "configure" && (
        <div className="space-y-8">
          {/* Agreements */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Agreements & Consent</p>
            </div>
            <div className="p-5">
              <p className="text-xs text-muted-foreground mb-4">Define the documents the candidate must read and consent to. Attach PDFs so candidates can download and review before signing.</p>
              <AgreementEditor
                sessionId={id}
                initial={(session.agreements_config as AgreementItem[]) ?? []}
                onSave={items => updateConfig.mutate({ agreementsConfig: items })}
              />
            </div>
          </div>

          {/* Document uploads */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Document Uploads</p>
            </div>
            <div className="p-5">
              <p className="text-xs text-muted-foreground mb-4">
                Define which documents this candidate must upload. Set each as required or optional, control accepted file types and max size.
                Changes take effect the next time the candidate opens the portal.
              </p>
              <DocumentsEditor
                initial={(session.documents_config as DocumentItem[]) ?? []}
                onSave={items => updateConfig.mutate({ documentsConfig: items })}
              />
            </div>
          </div>

          {/* Custom fields */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Custom Form Fields</p>
            </div>
            <div className="p-5">
              <p className="text-xs text-muted-foreground mb-4">Add extra fields to any section of the onboarding form. These appear at the bottom of the selected section.</p>
              <CustomFieldsEditor
                initial={(session.custom_fields_config as CustomFieldsConfig) ?? {}}
                onSave={cfg => updateConfig.mutate({ customFieldsConfig: cfg })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Submitted Data tab */}
      {tab === "data" && (session.status === "submitted" || session.status === "completed") && sections.length > 0 && (
        <SubmittedDataView
          sections={sections as { section: string; data: Record<string, unknown>; completed: boolean; updated_at: string }[]}
          session={session as Record<string, unknown>}
        />
      )}
    </div>
  );
}
