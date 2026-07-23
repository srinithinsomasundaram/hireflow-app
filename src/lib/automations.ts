import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import type { Database } from "@/integrations/supabase/types";
import { sendSmtpEmail } from "./smtp";
import { decryptSmtpConfig } from "./smtp-decrypt";
import { sendSystemEmail } from "./system-email";

type AutomationContext = {
  applicationId: string;
  candidateId: string;
  jobId: string;
  organizationId: string;
  stage?: string;
};

type ActionConfig = {
  delay_minutes?: number;
  subject?: string;
  message?: string;
  salary?: string;
  start_date?: string;
  tone?: string;
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

function substitute(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => escapeHtml(vars[key] ?? `{{${key}}}`));
}

function wrapEmail(body: string, workspaceName: string): string {
  const bodyHtml = body.replace(/\n/g, "<br>");
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#0f172a;padding:22px 32px;">
        <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:-.3px;">${escapeHtml(workspaceName)}</span>
      </div>
      <div style="padding:36px 32px;">
        <p style="margin:0;font-size:15px;color:#374151;line-height:1.75;">${bodyHtml}</p>
      </div>
    </div>
  `;
}

export async function runAutomations(trigger: string, ctx: AutomationContext) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.warn("[automations] SUPABASE_SERVICE_ROLE_KEY not set — skipping automations");
    return;
  }

  const sb = createClient<Database>(
    process.env.SUPABASE_URL!,
    serviceKey,
    { realtime: { transport: ws }, auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Fetch matching enabled automations
  const { data: automations, error: fetchErr } = await sb
    .from("automations")
    .select("id, name, action, action_config, trigger_config")
    .eq("organization_id", ctx.organizationId)
    .eq("trigger", trigger)
    .eq("enabled", true);

  if (fetchErr) {
    console.error(`[automations] fetch error (trigger=${trigger}):`, fetchErr.message);
    return;
  }
  if (!automations?.length) {
    console.log(`[automations] no enabled automations for trigger=${trigger} org=${ctx.organizationId}`);
    return;
  }

  console.log(`[automations] running ${automations.length} automation(s) for trigger=${trigger}`);

  // Load all context data in parallel
  const [{ data: candidate }, { data: job }, { data: org }, { data: settings }] = await Promise.all([
    sb.from("candidates").select("full_name, email, tags").eq("id", ctx.candidateId).maybeSingle(),
    sb.from("jobs").select("title, department").eq("id", ctx.jobId).maybeSingle(),
    sb.from("organizations").select("company_name, owner_id").eq("id", ctx.organizationId).maybeSingle(),
    sb.from("organization_settings").select("smtp_config, smtp_enabled").eq("organization_id", ctx.organizationId).maybeSingle(),
  ]);

  // Org-level SMTP for candidate emails (configured in Settings → Integrations)
  const orgSmtp = settings?.smtp_enabled && settings?.smtp_config
    ? decryptSmtpConfig(settings.smtp_config as Record<string, unknown>)
    : null;

  const vars: Record<string, string> = {
    candidate_name: candidate?.full_name ?? "Candidate",
    job_title:      job?.title ?? "the role",
    company_name:   org?.company_name ?? "the company",
  };

  // Send email to candidate.
  // Primary: org's own SMTP (personalized domain/sender).
  // Fallback: system email (Resend / platform SMTP) so emails always go through
  // even before the org configures their own SMTP.
  async function sendToCandidate(subject: string, body: string) {
    if (!candidate?.email) {
      console.warn("[automations] candidate has no email — skipping send_email");
      return;
    }
    const html = wrapEmail(body, org?.company_name ?? "HireFlow");
    if (orgSmtp) {
      console.log(`[automations] sending via org SMTP to ${candidate.email} — ${subject}`);
      await sendSmtpEmail(orgSmtp, candidate.email, subject, html);
    } else {
      console.log(`[automations] org SMTP not configured — sending via system email to ${candidate.email}`);
      await sendSystemEmail(candidate.email, subject, html);
    }
  }

  // Notify all org admins & recruiters (not just the owner).
  // Always appends a candidate details card so the team knows who triggered the automation.
  async function notifyTeam(message: string) {
    const dashboardUrl = process.env.APP_URL
      ? `${process.env.APP_URL}/pipeline`
      : "https://hireflow.yespstudio.com/pipeline";

    const candidateCard = candidate ? `
      <div style="margin-top:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;">Candidate</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:5px 0;color:#64748b;font-size:13px;width:110px;font-weight:500;">Name</td><td style="padding:5px 0;color:#0f172a;font-size:13px;font-weight:600;">${escapeHtml(candidate.full_name ?? "")}</td></tr>
          ${candidate.email ? `<tr><td style="padding:5px 0;color:#64748b;font-size:13px;font-weight:500;">Email</td><td style="padding:5px 0;font-size:13px;"><a href="mailto:${escapeHtml(candidate.email)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(candidate.email)}</a></td></tr>` : ""}
          ${job?.title ? `<tr><td style="padding:5px 0;color:#64748b;font-size:13px;font-weight:500;">Position</td><td style="padding:5px 0;color:#0f172a;font-size:13px;font-weight:600;">${escapeHtml(job.title)}</td></tr>` : ""}
        </table>
        <div style="margin-top:16px;">
          <a href="${dashboardUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 20px;border-radius:7px;">View in Pipeline →</a>
        </div>
      </div>
    ` : "";

    const bodyHtml = `<p style="margin:0 0 4px;font-size:15px;color:#374151;line-height:1.75;">${message.replace(/\n/g, "<br>")}</p>${candidateCard}`;
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="background:#0f172a;padding:22px 32px;">
          <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:-.3px;">${escapeHtml(org?.company_name ?? "HireFlow")}</span>
        </div>
        <div style="padding:32px;">${bodyHtml}</div>
      </div>
    `;
    const subject = `${org?.company_name ?? "HireFlow"}: ${message.replace(/<[^>]*>/g, "").slice(0, 80)}`;

    // Collect all owner/admin/recruiter user IDs
    const { data: members } = await sb
      .from("user_roles")
      .select("user_id")
      .eq("organization_id", ctx.organizationId)
      .in("role", ["owner", "admin", "recruiter"]);

    const uniqueIds = [...new Set((members ?? []).map(m => m.user_id))];
    if (!uniqueIds.length) {
      console.warn("[automations] notify_team: no org members found");
      return;
    }

    // Resolve auth emails for each member
    const emailResults = await Promise.all(uniqueIds.map(uid => sb.auth.admin.getUserById(uid)));
    const emails = emailResults.map(r => r.data.user?.email).filter(Boolean) as string[];

    if (!emails.length) {
      console.warn("[automations] notify_team: could not resolve any member emails");
      return;
    }

    console.log(`[automations] notifying ${emails.length} team member(s):`, emails);
    await Promise.allSettled(emails.map(email => sendSystemEmail(email, subject, html)));
  }

  for (const auto of automations) {
    const ac = (auto.action_config ?? {}) as ActionConfig;
    const tc = (auto.trigger_config ?? {}) as { stage_filter?: string };

    // Stage filter check
    if (trigger === "stage_changed" && tc.stage_filter && tc.stage_filter !== ctx.stage) continue;

    // Delay scheduling is not yet implemented — log and execute immediately
    if ((ac.delay_minutes ?? 0) > 0) {
      console.warn(`[automations] "${auto.name}" has delay_minutes=${ac.delay_minutes} — scheduled delays not yet implemented, executing immediately`);
    }

    console.log(`[automations] executing "${auto.name}" → action=${auto.action}`);

    try {
      switch (auto.action) {
        case "send_email": {
          const subject = substitute(ac.subject ?? "Update on your application", vars);
          const message = substitute(ac.message ?? "", vars);
          await sendToCandidate(subject, message);
          break;
        }
        case "notify_team": {
          const message = substitute(ac.message ?? "Team notification", vars);
          await notifyTeam(message);
          break;
        }
        case "move_stage": {
          const newStage = ac.message ?? "screening";
          await sb.from("applications")
            .update({ stage: newStage as Database["public"]["Enums"]["application_stage"] })
            .eq("id", ctx.applicationId);
          break;
        }
        case "add_tag": {
          const tag = ac.message ?? "";
          if (!tag) break;
          const existing = candidate?.tags ?? [];
          if (!existing.includes(tag)) {
            await sb.from("candidates").update({ tags: [...existing, tag] }).eq("id", ctx.candidateId);
          }
          break;
        }
        case "send_offer_letter": {
          // Notify the recruiter that an offer letter is ready — the formal letter
          // is sent to the candidate separately from the Offer Letters page.
          const message = substitute(
            `An offer letter is ready for <strong>{{candidate_name}}</strong> for the <strong>{{job_title}}</strong> position. Please review and send it from the Offer Letters section.`,
            vars,
          );
          await notifyTeam(message);
          break;
        }
        default:
          console.warn(`[automations] unknown action "${auto.action}" — skipping`);
      }
      console.log(`[automations] "${auto.name}" completed`);
    } catch (e) {
      console.error(`[automations] "${auto.name}" failed:`, e instanceof Error ? e.message : e);
    }
  }
}
