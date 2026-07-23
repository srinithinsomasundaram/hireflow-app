import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { SmtpConfig } from "@/lib/smtp";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminSb(): any {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { realtime: { transport: ws as never }, auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

function makeToken(len = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function makeOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function escHtml(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Read system-level SMTP from env vars as fallback when org SMTP is not set */
function getSystemSmtp(): SmtpConfig | null {
  const host     = process.env.SYSTEM_SMTP_HOST;
  const port     = process.env.SYSTEM_SMTP_PORT     ?? "465";
  const username = process.env.SYSTEM_SMTP_USER;
  const password = process.env.SYSTEM_SMTP_PASS;
  const from_email = process.env.SYSTEM_EMAIL_FROM  ?? (username ?? "");
  const from_name  = process.env.SYSTEM_EMAIL_FROM_NAME ?? "HireFlow";
  if (!host || !username || !password) return null;
  return { host, port, username, password, from_name, from_email };
}

/** Resolve the best available SMTP config: org first, then system */
async function resolveSmtp(orgId: string): Promise<SmtpConfig> {
  const sb = adminSb();
  const { data: settings } = await sb
    .from("organization_settings")
    .select("smtp_enabled, smtp_config")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (settings?.smtp_enabled && settings?.smtp_config) {
    const { decryptSmtpConfig } = await import("./smtp-decrypt");
    return decryptSmtpConfig(settings.smtp_config as Record<string, unknown>) as SmtpConfig;
  }

  const sys = getSystemSmtp();
  if (sys) return sys;

  throw new Error(
    "Email sending is not configured for this company. " +
    "Please contact your HR team to receive your verification code.",
  );
}

/** OTP verification email sent to the candidate */
function buildOtpEmail(opts: { candidateName: string; companyName: string; otp: string }): string {
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
  <div style="background:#0f172a;padding:20px 28px;">
    <span style="color:#fff;font-size:15px;font-weight:700;">${escHtml(opts.companyName)}</span>
  </div>
  <div style="padding:32px 28px;text-align:center;">
    <p style="margin:0 0 8px;font-size:15px;color:#374151;">Hi <strong>${escHtml(opts.candidateName)}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;">Use this code to access your onboarding portal:</p>
    <div style="display:inline-block;background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:16px 32px;letter-spacing:10px;font-size:36px;font-weight:700;font-family:monospace;color:#0f172a;">
      ${opts.otp}
    </div>
    <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">This code expires in <strong>15 minutes</strong>. Do not share it with anyone.</p>
  </div>
  <div style="padding:14px 28px;border-top:1px solid #f3f4f6;text-align:center;">
    <span style="font-size:12px;color:#d1d5db;">Powered by HireFlow</span>
  </div>
</div>`;
}

/** Compose the onboarding invite email */
function buildInviteEmail(opts: {
  candidateName: string; companyName: string;
  jobTitle: string | null; joiningDate: string | null; portalUrl: string;
}): string {
  const joiningLine = opts.joiningDate
    ? `<p style="margin:12px 0;font-size:15px;color:#374151;">Your joining date is <strong>${new Date(opts.joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>`
    : "";
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
  <div style="background:#0f172a;padding:24px 32px;">
    <span style="color:#fff;font-size:16px;font-weight:700;letter-spacing:-.3px;">${escHtml(opts.companyName)}</span>
  </div>
  <div style="padding:36px 32px;">
    <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">Welcome, ${escHtml(opts.candidateName)}!</h2>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.7;">
      You're joining <strong>${escHtml(opts.companyName)}</strong>${opts.jobTitle ? ` as <strong>${escHtml(opts.jobTitle)}</strong>` : ""}.
      Please complete your onboarding form to get ready for day one.
    </p>
    ${joiningLine}
    <div style="margin:28px 0;text-align:center;">
      <a href="${opts.portalUrl}" style="display:inline-block;background:#10b981;color:#ffffff;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;">
        Complete Onboarding →
      </a>
    </div>
    <p style="margin:0;font-size:13px;color:#9ca3af;">
      Or copy this link: <a href="${opts.portalUrl}" style="color:#6b7280;">${opts.portalUrl}</a>
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;">This link is valid for 30 days. For questions, contact your HR team.</p>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center;">
    <span style="font-size:12px;color:#d1d5db;">Powered by HireFlow</span>
  </div>
</div>`;
}

/** Build the portal URL using the workspace subdomain if available */
function buildPortalUrl(token: string, subdomain: string | null): string {
  const appDomain = process.env.VITE_APP_DOMAIN ?? "hireflow.yesp.space";
  const base = subdomain ? `https://${subdomain}.${appDomain}` : `https://${appDomain}`;
  return `${base}/welcome/${token}`;
}

// ── Public: fetch session by token ────────────────────────────────────────────

export const getOnboardingByToken = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ token: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const sb = adminSb();
    const { data: session } = await sb
      .from("onboarding_sessions")
      .select(`
        id, token, status, verified, expires_at, submitted_at,
        candidate_email, candidate_name, job_title, department,
        office_location, joining_date, hr_contact_name, hr_contact_email,
        organization_id, last_verified_at, rejected_at, rejection_reason,
        agreements_config, custom_fields_config, documents_config,
        organizations(company_name, logo_url, subdomain, website)
      `)
      .eq("token", data.token)
      .maybeSingle();

    if (!session) return null;
    if (session.expires_at && new Date(session.expires_at) < new Date()) return null;

    const { data: sections } = await sb
      .from("onboarding_data")
      .select("section, data, completed")
      .eq("session_id", session.id);

    return { ...session, sections: sections ?? [] };
  });

// ── Public: request OTP ───────────────────────────────────────────────────────

export const requestOnboardingOtp = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ token: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const sb = adminSb();
    const { data: session } = await sb
      .from("onboarding_sessions")
      .select("id, candidate_email, candidate_name, organization_id, expires_at, rejected_at")
      .eq("token", data.token)
      .maybeSingle();

    if (!session) throw new Error("Invalid link");
    if (session.rejected_at) throw new Error("This onboarding session has been cancelled");
    if (session.expires_at && new Date(session.expires_at) < new Date()) throw new Error("This link has expired");

    const otp = makeOtp();
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await sb.from("onboarding_sessions")
      .update({ otp_code: otp, otp_expires_at: expiry })
      .eq("id", session.id);

    // Look up company name for the email
    const { data: orgData } = await sb
      .from("organizations")
      .select("company_name")
      .eq("id", session.organization_id)
      .maybeSingle();

    // Send OTP email — throws if neither org nor system SMTP is configured
    const smtpCfg = await resolveSmtp(session.organization_id);
    const { sendSmtpEmail } = await import("./smtp");
    await sendSmtpEmail(
      smtpCfg,
      session.candidate_email,
      `Your verification code — ${orgData?.company_name ?? "Onboarding"}`,
      buildOtpEmail({
        candidateName: session.candidate_name,
        companyName:   orgData?.company_name ?? "the company",
        otp,
      }),
    );

    return { success: true, email: session.candidate_email };
  });

// ── Public: verify OTP (handles both initial verify and re-verify) ─────────────

export const verifyOnboardingOtp = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    token: z.string().min(1),
    code: z.string().min(4).max(8),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = adminSb();
    const { data: session } = await sb
      .from("onboarding_sessions")
      .select("id, otp_code, otp_expires_at, verified, status, rejected_at")
      .eq("token", data.token)
      .maybeSingle();

    if (!session) throw new Error("Invalid link");
    if (session.rejected_at) throw new Error("This onboarding session has been cancelled");
    if (!session.otp_code) throw new Error("No OTP requested — please click Send OTP first");
    if (session.otp_expires_at && new Date(session.otp_expires_at) < new Date()) throw new Error("OTP has expired. Please request a new one.");
    if (session.otp_code !== data.code.trim()) throw new Error("Incorrect code. Please try again.");

    await sb.from("onboarding_sessions")
      .update({
        verified: true,
        otp_code: null,
        otp_expires_at: null,
        status: session.status === "pending" ? "in_progress" : session.status,
        last_verified_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    return { verified: true };
  });

// ── Public: save a single section ─────────────────────────────────────────────

export const saveOnboardingSection = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    token: z.string().min(1),
    section: z.string().min(1),
    data: z.record(z.unknown()),
    completed: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = adminSb();
    const { data: session } = await sb
      .from("onboarding_sessions")
      .select("id, verified, status")
      .eq("token", data.token)
      .maybeSingle();

    if (!session?.verified) throw new Error("Not verified");
    if (session.status === "submitted") throw new Error("Onboarding already submitted");

    const { error } = await sb.from("onboarding_data").upsert({
      session_id: session.id,
      section: data.section,
      data: data.data,
      completed: data.completed,
      updated_at: new Date().toISOString(),
    }, { onConflict: "session_id,section" });

    if (error) throw new Error("Failed to save section");
    return { success: true };
  });

// ── Public: upload document ───────────────────────────────────────────────────

export const uploadOnboardingDoc = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    token: z.string().min(1),
    docType: z.string().min(1),
    fileName: z.string().min(1),
    fileBase64: z.string().min(1),
    mimeType: z.string().default("application/octet-stream"),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = adminSb();
    const { data: session } = await sb
      .from("onboarding_sessions")
      .select("id, verified")
      .eq("token", data.token)
      .maybeSingle();

    if (!session?.verified) throw new Error("Not verified");

    await sb.storage.createBucket("onboarding-docs", { public: false, fileSizeLimit: 10485760 }).catch(() => {});

    const b64 = data.fileBase64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(b64, "base64");
    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${session.id}/${data.docType}/${safeName}`;

    const { error: upErr } = await sb.storage
      .from("onboarding-docs")
      .upload(path, buffer, { contentType: data.mimeType, upsert: true });

    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

    const { data: signed } = await sb.storage
      .from("onboarding-docs")
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    return { url: signed?.signedUrl ?? "", path };
  });

// ── Public: final submit ──────────────────────────────────────────────────────

export const submitOnboarding = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ token: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const sb = adminSb();
    const { data: session } = await sb
      .from("onboarding_sessions")
      .select("id, verified, status, application_id, candidate_id, organization_id")
      .eq("token", data.token)
      .maybeSingle();

    if (!session?.verified) throw new Error("Not verified");
    if (session.status === "submitted") return { success: true };

    await sb.from("onboarding_sessions")
      .update({ status: "submitted", submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", session.id);

    // Fire onboarding_submitted automations (best-effort, non-fatal)
    if (session.application_id && session.candidate_id && session.organization_id) {
      try {
        const { data: app } = await sb
          .from("applications")
          .select("job_id")
          .eq("id", session.application_id)
          .maybeSingle();
        if (app?.job_id) {
          const { runAutomations } = await import("./automations");
          await runAutomations("onboarding_submitted", {
            applicationId:  session.application_id,
            candidateId:    session.candidate_id,
            jobId:          app.job_id,
            organizationId: session.organization_id,
          });
        }
      } catch {
        // Non-fatal — submission is already recorded
      }
    }

    return { success: true };
  });

// ── Authenticated: create session + send invite email ────────────────────────

export const createOnboardingSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({
    applicationId: z.string().uuid(),
    joiningDate: z.string().optional(),
    sendInviteEmail: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;
    const sbAdmin = adminSb();

    const { data: app } = await sb
      .from("applications")
      .select("id, organization_id, candidate_id, candidates(full_name, email), jobs(title, department, location)")
      .eq("id", data.applicationId)
      .single();

    if (!app) throw new Error("Application not found");

    const cand = (Array.isArray(app.candidates) ? app.candidates[0] : app.candidates) as { full_name: string; email: string } | null;
    const job  = (Array.isArray(app.jobs)       ? app.jobs[0]       : app.jobs)       as { title: string; department: string | null; location: string | null } | null;

    if (!cand) throw new Error("Candidate not found");

    // Block if a non-rejected session already exists for this application
    const { data: existing } = await sbAdmin
      .from("onboarding_sessions")
      .select("id, token, rejected_at, status, organizations(subdomain)")
      .eq("application_id", data.applicationId)
      .order("created_at", { ascending: false });

    const activeSession = (existing ?? []).find((s: { rejected_at: string | null }) => !s.rejected_at);
    if (activeSession) {
      throw new Error(
        "An active onboarding session already exists for this candidate. " +
        "Please reject the current session first before creating a new one."
      );
    }

    // Fetch workspace info (subdomain + company_name) for email & portal URL
    const { data: orgData } = await sbAdmin
      .from("organizations")
      .select("subdomain, company_name")
      .eq("id", app.organization_id)
      .maybeSingle();

    // Inherit default documents_config / agreements_config from the org template
    const { data: settingsRow } = await sbAdmin
      .from("organization_settings")
      .select("onboarding_template")
      .eq("organization_id", app.organization_id)
      .maybeSingle();
    const tpl = (settingsRow?.onboarding_template ?? {}) as Record<string, unknown>;
    const inheritedDocs  = Array.isArray(tpl.documents_config)  ? tpl.documents_config  : [];
    const inheritedAgree = Array.isArray(tpl.agreements_config) ? tpl.agreements_config : [];

    const token = makeToken(12);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const portalUrl = buildPortalUrl(token, orgData?.subdomain ?? null);

    const { error } = await sbAdmin.from("onboarding_sessions").insert({
      token,
      organization_id: app.organization_id,
      application_id: app.id,
      candidate_id: app.candidate_id,
      status: "pending",
      candidate_email: cand.email,
      candidate_name: cand.full_name,
      job_title: job?.title ?? null,
      department: job?.department ?? null,
      office_location: job?.location ?? null,
      joining_date: data.joiningDate ?? null,
      expires_at: expiresAt,
      ...(inheritedDocs.length  > 0 ? { documents_config:  inheritedDocs  } : {}),
      ...(inheritedAgree.length > 0 ? { agreements_config: inheritedAgree } : {}),
    });

    if (error) throw new Error("Failed to create onboarding session");

    // Send invite email (best-effort, non-fatal)
    let emailSent = false;
    if (data.sendInviteEmail) {
      try {
        const { data: settings } = await sbAdmin
          .from("organization_settings")
          .select("smtp_enabled, smtp_config")
          .eq("organization_id", app.organization_id)
          .maybeSingle();

        if (settings?.smtp_enabled && settings?.smtp_config) {
          const { decryptSmtpConfig } = await import("./smtp-decrypt");
          const { sendSmtpEmail }     = await import("./smtp");
          const smtpCfg = decryptSmtpConfig(settings.smtp_config as Record<string, unknown>);
          const html    = buildInviteEmail({
            candidateName: cand.full_name,
            companyName:   orgData?.company_name ?? "the company",
            jobTitle:      job?.title ?? null,
            joiningDate:   data.joiningDate ?? null,
            portalUrl,
          });
          await sendSmtpEmail(
            smtpCfg,
            cand.email,
            `Complete your onboarding — ${orgData?.company_name ?? ""}`,
            html,
          );
          emailSent = true;
        }
      } catch {
        // Email failure is non-fatal — session is still created
      }
    }

    return { token, portalUrl, emailSent };
  });

// ── Authenticated: list sessions for org ──────────────────────────────────────

export const listOnboardingSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ orgId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;
    const { data: sessions } = await sb
      .from("onboarding_sessions")
      .select("id, token, status, verified, candidate_name, candidate_email, job_title, joining_date, submitted_at, created_at, rejected_at, organizations(subdomain)")
      .eq("organization_id", data.orgId)
      .order("created_at", { ascending: false });
    return (sessions ?? []) as {
      id: string; token: string; status: string; verified: boolean;
      candidate_name: string; candidate_email: string; job_title: string | null;
      joining_date: string | null; submitted_at: string | null; created_at: string;
      rejected_at: string | null;
      organizations: { subdomain: string | null } | null;
    }[];
  });

// ── Authenticated: get session details ────────────────────────────────────────

export const getOnboardingDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;
    const { data: session } = await sb
      .from("onboarding_sessions")
      .select("*, organizations(company_name, logo_url, subdomain, website)")
      .eq("id", data.sessionId)
      .single();

    if (!session) throw new Error("Session not found");

    const { data: sections } = await sb
      .from("onboarding_data")
      .select("section, data, completed, updated_at")
      .eq("session_id", data.sessionId);

    return { session, sections: sections ?? [] };
  });

// ── Authenticated: update agreements/custom-fields config ─────────────────────

const AgreementItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  file_url: z.string().nullable(),
  required: z.boolean(),
});

const CustomFieldSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  type: z.enum(["text", "number", "date", "select", "textarea"]),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
  placeholder: z.string().optional(),
});

const DocumentItemSchema = z.object({
  id: z.string(),
  key: z.string().min(1),
  label: z.string().min(1),
  hint: z.string(),
  required: z.boolean(),
  accept: z.string(),
  maxSizeMb: z.number().int().positive(),
});

export const updateOnboardingConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({
    sessionId: z.string().uuid(),
    agreementsConfig: z.array(AgreementItemSchema).optional(),
    customFieldsConfig: z.record(z.array(CustomFieldSchema)).optional(),
    documentsConfig: z.array(DocumentItemSchema).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.agreementsConfig !== undefined)  updates.agreements_config    = data.agreementsConfig;
    if (data.customFieldsConfig !== undefined) updates.custom_fields_config = data.customFieldsConfig;
    if (data.documentsConfig !== undefined)    updates.documents_config     = data.documentsConfig;

    const { error } = await sb.from("onboarding_sessions")
      .update(updates)
      .eq("id", data.sessionId);
    if (error) throw new Error("Failed to update config");
    return { success: true };
  });

// ── Authenticated: HR uploads a PDF for an agreement ──────────────────────────

export const uploadAgreementFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({
    sessionId: z.string().uuid(),
    fileName: z.string().min(1),
    fileBase64: z.string().min(1),
    mimeType: z.string().default("application/pdf"),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = adminSb();
    await sb.storage.createBucket("onboarding-docs", { public: false, fileSizeLimit: 20971520 }).catch(() => {});

    const b64 = data.fileBase64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(b64, "base64");
    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${data.sessionId}/hr-agreements/${safeName}`;

    const { error } = await sb.storage
      .from("onboarding-docs")
      .upload(path, buffer, { contentType: data.mimeType, upsert: true });
    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: signed } = await sb.storage
      .from("onboarding-docs")
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    return { url: signed?.signedUrl ?? "", path };
  });

// ── Authenticated: reject / cancel a session ──────────────────────────────────

export const rejectOnboardingSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({
    sessionId: z.string().uuid(),
    reason: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;
    const { error } = await sb.from("onboarding_sessions")
      .update({
        rejected_at: new Date().toISOString(),
        rejection_reason: data.reason ?? null,
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.sessionId);
    if (error) throw new Error("Failed to reject session");
    return { success: true };
  });

// ── Authenticated: get / save global onboarding template ─────────────────────

export const getOnboardingTemplate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ orgId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;
    const { data: row } = await sb
      .from("organization_settings")
      .select("onboarding_template")
      .eq("organization_id", data.orgId)
      .maybeSingle();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tpl = (row?.onboarding_template ?? {}) as Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docs:  any[] = Array.isArray(tpl.documents_config)  ? tpl.documents_config  : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agree: any[] = Array.isArray(tpl.agreements_config) ? tpl.agreements_config : [];
    return { documentsConfig: docs, agreementsConfig: agree };
  });

export const saveOnboardingTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({
    orgId: z.string().uuid(),
    documentsConfig:  z.array(DocumentItemSchema).optional(),
    agreementsConfig: z.array(AgreementItemSchema).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;

    // Read current template so we don't clobber the other key
    const { data: row } = await sb
      .from("organization_settings")
      .select("onboarding_template")
      .eq("organization_id", data.orgId)
      .maybeSingle();
    const current = (row?.onboarding_template ?? {}) as Record<string, unknown>;

    const updated: Record<string, unknown> = { ...current };
    if (data.documentsConfig  !== undefined) updated.documents_config  = data.documentsConfig;
    if (data.agreementsConfig !== undefined) updated.agreements_config = data.agreementsConfig;

    const { error } = await sb
      .from("organization_settings")
      .upsert(
        { organization_id: data.orgId, onboarding_template: updated, updated_at: new Date().toISOString() },
        { onConflict: "organization_id" },
      );
    if (error) throw new Error("Failed to save onboarding template");
    return { success: true };
  });

// ── Authenticated: resend invite email ────────────────────────────────────────

export const resendOnboardingInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;

    const { data: session } = await sb
      .from("onboarding_sessions")
      .select("token, candidate_email, candidate_name, job_title, joining_date, organization_id, rejected_at, status, organizations(subdomain, company_name)")
      .eq("id", data.sessionId)
      .single();

    if (!session) throw new Error("Session not found");
    if (session.rejected_at) throw new Error("Cannot resend for a rejected session");
    if (session.status === "submitted") throw new Error("Candidate has already submitted their onboarding");

    const org = (Array.isArray(session.organizations) ? session.organizations[0] : session.organizations) as { subdomain: string | null; company_name: string } | null;
    const portalUrl = buildPortalUrl(session.token, org?.subdomain ?? null);

    const smtpCfg = await resolveSmtp(session.organization_id);
    const { sendSmtpEmail } = await import("./smtp");
    const html = buildInviteEmail({
      candidateName: session.candidate_name,
      companyName:   org?.company_name ?? "the company",
      jobTitle:      session.job_title ?? null,
      joiningDate:   session.joining_date ?? null,
      portalUrl,
    });

    await sendSmtpEmail(smtpCfg, session.candidate_email, `Complete your onboarding — ${org?.company_name ?? ""}`, html);
    return { success: true, portalUrl };
  });
