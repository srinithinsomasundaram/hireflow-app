import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Loader2, User, Briefcase, CreditCard, FileText, Upload, PenLine,
  ClipboardList, CheckCircle2, ChevronRight, ChevronLeft, Building2,
  Check, AlertCircle, RefreshCw, FileDown, XCircle, Shield,
  Save, AlertTriangle, Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  getOnboardingByToken, requestOnboardingOtp, verifyOnboardingOtp,
  saveOnboardingSection, uploadOnboardingDoc, submitOnboarding,
} from "@/lib/onboarding.functions";

export const Route = createFileRoute("/welcome/$token")({
  head: () => ({ meta: [{ title: "Complete Your Onboarding" }] }),
  component: WelcomePortal,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionSection = { section: string; data: Record<string, unknown>; completed: boolean };

export type AgreementItem = {
  id: string;
  name: string;
  description: string;
  file_url: string | null;
  required: boolean;
};

export type CustomField = {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  options?: string[];
  required: boolean;
  placeholder?: string;
};

export type CustomFieldsConfig = Record<string, CustomField[]>;

export type DocumentItem = {
  id: string;
  key: string;
  label: string;
  hint: string;
  required: boolean;
  accept: string;
  maxSizeMb: number;
};

type Session = {
  id: string; token: string; status: string; verified: boolean;
  candidate_email: string; candidate_name: string;
  job_title: string | null; department: string | null;
  office_location: string | null; joining_date: string | null;
  hr_contact_name: string | null; hr_contact_email: string | null;
  last_verified_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  agreements_config: AgreementItem[] | null;
  custom_fields_config: CustomFieldsConfig | null;
  documents_config: DocumentItem[] | null;
  organizations: { company_name: string; logo_url: string | null; subdomain: string | null; website: string | null } | null;
  sections: SessionSection[];
};

type SectionId = "personal" | "employment" | "banking" | "tax" | "documents" | "agreements" | "additional" | "review";

const SECTION_LIST: { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "personal",    label: "Personal Info",    icon: User },
  { id: "employment",  label: "Employment",        icon: Briefcase },
  { id: "banking",     label: "Banking Details",   icon: CreditCard },
  { id: "tax",         label: "Tax Information",   icon: FileText },
  { id: "documents",   label: "Documents",         icon: Upload },
  { id: "agreements",  label: "Agreements",        icon: PenLine },
  { id: "additional",  label: "Additional Info",   icon: ClipboardList },
  { id: "review",      label: "Review & Submit",   icon: CheckCircle2 },
];

const FORM_SECTIONS: SectionId[] = ["personal", "employment", "banking", "tax", "documents", "agreements", "additional"];
// Sections that MUST be completed before submission
const REQUIRED_SECTIONS: SectionId[] = ["personal", "banking", "tax", "agreements"];
const REQUIRED_LABELS: Record<string, string> = {
  personal: "Personal Info", banking: "Banking Details",
  tax: "Tax Information", agreements: "Agreements",
};

const DEFAULT_AGREEMENTS: AgreementItem[] = [
  { id: "offer_letter",         name: "Offer Letter",              description: "I confirm I have read and accept the terms of the offer letter, including the compensation package, position, and start date as communicated by the HR team.", file_url: null, required: true },
  { id: "employment_agreement", name: "Employment Agreement",      description: "I agree to comply with all terms of employment including working hours, leave policy, and code of conduct as specified in the employment agreement.", file_url: null, required: true },
  { id: "nda",                  name: "Non-Disclosure Agreement",  description: "I agree to keep all proprietary, confidential, and trade secret information of the company strictly confidential during and after my employment.", file_url: null, required: true },
  { id: "code_of_conduct",      name: "Code of Conduct",           description: "I acknowledge and commit to upholding the company's standards of professional conduct, ethical behaviour, and workplace policies.", file_url: null, required: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function FInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 ${props.className ?? ""}`}
    />
  );
}

function FTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      {...props}
      className={`w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y ${props.className ?? ""}`}
    />
  );
}

function FSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white ${props.className ?? ""}`}
    >
      {children}
    </select>
  );
}

function CustomFields({
  fields, values, onChange,
}: {
  fields: CustomField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  if (!fields || fields.length === 0) return null;
  return (
    <div className="space-y-4 pt-2 border-t">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Additional fields</p>
      {fields.map(f => (
        <FieldRow key={f.id} label={f.label} required={f.required}>
          {f.type === "select" && f.options ? (
            <FSelect value={values[f.id] ?? ""} onChange={e => onChange(f.id, e.target.value)}>
              <option value="">Select</option>
              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
            </FSelect>
          ) : f.type === "textarea" ? (
            <FTextarea value={values[f.id] ?? ""} onChange={e => onChange(f.id, e.target.value)} placeholder={f.placeholder ?? ""} />
          ) : (
            <FInput
              type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
              value={values[f.id] ?? ""}
              onChange={e => onChange(f.id, e.target.value)}
              placeholder={f.placeholder ?? ""}
            />
          )}
        </FieldRow>
      ))}
    </div>
  );
}

function AutoSaveBadge({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "idle") return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-0.5 ${
      status === "saving" ? "bg-blue-50 text-blue-600" :
      status === "saved"  ? "bg-emerald-50 text-emerald-600" :
      "bg-red-50 text-red-600"
    }`}>
      {status === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === "saved"  && <Save className="h-3 w-3" />}
      {status === "saving" ? "Saving draft…" : status === "saved" ? "Draft saved" : "Auto-save failed"}
    </span>
  );
}

function SectionActions({
  onBack, onNext, saving, isFirst,
}: { onBack?: () => void; onNext: () => void; saving: boolean; isFirst?: boolean }) {
  return (
    <div className="flex gap-3 pt-6 border-t">
      {!isFirst && onBack && (
        <button onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
      )}
      <button onClick={onNext} disabled={saving}
        className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save & Continue
        {!saving && <ChevronRight className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Section Components ───────────────────────────────────────────────────────

function PersonalSection({ defaults, customFields, onSave, onChange }: {
  defaults: Record<string, unknown>;
  customFields?: CustomField[];
  onSave: (d: Record<string, unknown>) => Promise<void>;
  onChange?: (d: Record<string, unknown>) => void;
}) {
  const [f, setF] = useState({
    full_name: String(defaults.full_name ?? ""),
    dob: String(defaults.dob ?? ""),
    gender: String(defaults.gender ?? ""),
    address1: String(defaults.address1 ?? ""),
    address2: String(defaults.address2 ?? ""),
    city: String(defaults.city ?? ""),
    state: String(defaults.state ?? ""),
    pincode: String(defaults.pincode ?? ""),
    country: String(defaults.country ?? "India"),
    phone: String(defaults.phone ?? ""),
    nationality: String(defaults.nationality ?? ""),
    ec_name: String(defaults.ec_name ?? ""),
    ec_phone: String(defaults.ec_phone ?? ""),
    ec_relation: String(defaults.ec_relation ?? ""),
  });
  const [customValues, setCustomValues] = useState<Record<string, string>>(
    Object.fromEntries((customFields ?? []).map(cf => [cf.id, String(defaults[cf.id] ?? "")]))
  );
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }));
  const [saving, setSaving] = useState(false);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    onChange?.({ ...f, ...customValues });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, customValues]);

  async function handleSave() {
    if (!f.full_name.trim() || !f.dob || !f.phone.trim()) {
      toast.error("Please fill in Full Name, Date of Birth, and Phone Number");
      return;
    }
    setSaving(true);
    try { await onSave({ ...f, ...customValues }); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <FieldRow label="Full Name" required><FInput value={f.full_name} onChange={set("full_name")} placeholder="As per official ID" /></FieldRow>
        <FieldRow label="Date of Birth" required><FInput type="date" value={f.dob} onChange={set("dob")} /></FieldRow>
        <FieldRow label="Gender">
          <FSelect value={f.gender} onChange={set("gender")}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non_binary">Non-binary</option>
            <option value="prefer_not">Prefer not to say</option>
          </FSelect>
        </FieldRow>
        <FieldRow label="Phone Number" required><FInput type="tel" value={f.phone} onChange={set("phone")} placeholder="+91 98765 43210" /></FieldRow>
        <FieldRow label="Nationality"><FInput value={f.nationality} onChange={set("nationality")} placeholder="Indian" /></FieldRow>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900">Address</p>
        <FieldRow label="Address Line 1"><FInput value={f.address1} onChange={set("address1")} placeholder="Street, house no." /></FieldRow>
        <FieldRow label="Address Line 2"><FInput value={f.address2} onChange={set("address2")} placeholder="Apartment, suite (optional)" /></FieldRow>
        <div className="grid sm:grid-cols-3 gap-4">
          <FieldRow label="City"><FInput value={f.city} onChange={set("city")} /></FieldRow>
          <FieldRow label="State"><FInput value={f.state} onChange={set("state")} /></FieldRow>
          <FieldRow label="Pincode"><FInput value={f.pincode} onChange={set("pincode")} /></FieldRow>
        </div>
        <FieldRow label="Country"><FInput value={f.country} onChange={set("country")} /></FieldRow>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900">Emergency Contact</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <FieldRow label="Name"><FInput value={f.ec_name} onChange={set("ec_name")} placeholder="Contact name" /></FieldRow>
          <FieldRow label="Phone"><FInput type="tel" value={f.ec_phone} onChange={set("ec_phone")} /></FieldRow>
          <FieldRow label="Relationship"><FInput value={f.ec_relation} onChange={set("ec_relation")} placeholder="Spouse, Parent…" /></FieldRow>
        </div>
      </div>
      <CustomFields fields={customFields ?? []} values={customValues} onChange={(k, v) => setCustomValues(p => ({ ...p, [k]: v }))} />
      <SectionActions onNext={handleSave} saving={saving} isFirst />
    </div>
  );
}

function EmploymentSection({ session, defaults, customFields, onSave, onChange }: {
  session: Session; defaults: Record<string, unknown>;
  customFields?: CustomField[];
  onSave: (d: Record<string, unknown>) => Promise<void>;
  onChange?: (d: Record<string, unknown>) => void;
}) {
  const [joiningDate, setJoiningDate] = useState(String(defaults.joining_date ?? session.joining_date ?? ""));
  const [customValues, setCustomValues] = useState<Record<string, string>>(
    Object.fromEntries((customFields ?? []).map(cf => [cf.id, String(defaults[cf.id] ?? "")]))
  );
  const [saving, setSaving] = useState(false);

  const prefill = [
    { label: "Job Title", key: "job_title", value: session.job_title },
    { label: "Department", key: "department", value: session.department },
    { label: "Office Location", key: "office_location", value: session.office_location },
  ];

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const d: Record<string, unknown> = { joining_date: joiningDate, ...customValues };
    prefill.forEach(p => { d[p.key] = p.value; });
    onChange?.(d);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joiningDate, customValues]);

  async function handleSave() {
    const d: Record<string, unknown> = { joining_date: joiningDate, ...customValues };
    prefill.forEach(p => { d[p.key] = p.value; });
    setSaving(true);
    try { await onSave(d); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-muted/30 p-4 flex items-start gap-2.5">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Employment details are pre-filled by your HR team. Please verify and confirm.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {prefill.map(p => (
          <FieldRow key={p.label} label={p.label}>
            <FInput value={p.value ?? ""} disabled className="bg-gray-50 text-gray-600" />
          </FieldRow>
        ))}
        <FieldRow label="Joining Date" required>
          <FInput type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} />
        </FieldRow>
        {session.hr_contact_name && (
          <FieldRow label="HR Contact">
            <FInput value={`${session.hr_contact_name}${session.hr_contact_email ? ` (${session.hr_contact_email})` : ""}`} disabled className="bg-gray-50 text-gray-600" />
          </FieldRow>
        )}
      </div>
      <CustomFields fields={customFields ?? []} values={customValues} onChange={(k, v) => setCustomValues(p => ({ ...p, [k]: v }))} />
      <SectionActions onBack={undefined} onNext={handleSave} saving={saving} />
    </div>
  );
}

function BankingSection({ defaults, customFields, onSave, onBack, onChange }: {
  defaults: Record<string, unknown>;
  customFields?: CustomField[];
  onSave: (d: Record<string, unknown>) => Promise<void>;
  onBack: () => void;
  onChange?: (d: Record<string, unknown>) => void;
}) {
  const [f, setF] = useState({
    holder_name: String(defaults.holder_name ?? ""),
    bank_name: String(defaults.bank_name ?? ""),
    account_number: String(defaults.account_number ?? ""),
    ifsc: String(defaults.ifsc ?? ""),
    branch: String(defaults.branch ?? ""),
  });
  const [customValues, setCustomValues] = useState<Record<string, string>>(
    Object.fromEntries((customFields ?? []).map(cf => [cf.id, String(defaults[cf.id] ?? "")]))
  );
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value }));
  const [saving, setSaving] = useState(false);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    onChange?.({ ...f, ...customValues });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, customValues]);

  async function handleSave() {
    if (!f.holder_name.trim() || !f.bank_name.trim() || !f.account_number.trim() || !f.ifsc.trim()) {
      toast.error("Please fill in all required banking fields");
      return;
    }
    setSaving(true);
    try { await onSave({ ...f, ...customValues }); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <FieldRow label="Account Holder Name" required><FInput value={f.holder_name} onChange={set("holder_name")} placeholder="As per bank records" /></FieldRow>
        <FieldRow label="Bank Name" required><FInput value={f.bank_name} onChange={set("bank_name")} placeholder="HDFC Bank" /></FieldRow>
        <FieldRow label="Account Number" required><FInput value={f.account_number} onChange={set("account_number")} placeholder="12-digit account number" /></FieldRow>
        <FieldRow label="IFSC / SWIFT Code" required><FInput value={f.ifsc} onChange={set("ifsc")} placeholder="HDFC0001234" /></FieldRow>
        <FieldRow label="Branch"><FInput value={f.branch} onChange={set("branch")} placeholder="City, Branch" /></FieldRow>
      </div>
      <CustomFields fields={customFields ?? []} values={customValues} onChange={(k, v) => setCustomValues(p => ({ ...p, [k]: v }))} />
      <SectionActions onBack={onBack} onNext={handleSave} saving={saving} />
    </div>
  );
}

function TaxSection({ defaults, customFields, onSave, onBack, onChange }: {
  defaults: Record<string, unknown>;
  customFields?: CustomField[];
  onSave: (d: Record<string, unknown>) => Promise<void>;
  onBack: () => void;
  onChange?: (d: Record<string, unknown>) => void;
}) {
  const [f, setF] = useState({
    pan: String(defaults.pan ?? ""),
    aadhaar: String(defaults.aadhaar ?? ""),
    tin: String(defaults.tin ?? ""),
  });
  const [customValues, setCustomValues] = useState<Record<string, string>>(
    Object.fromEntries((customFields ?? []).map(cf => [cf.id, String(defaults[cf.id] ?? "")]))
  );
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value }));
  const [saving, setSaving] = useState(false);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    onChange?.({ ...f, ...customValues });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, customValues]);

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <FieldRow label="PAN Number"><FInput value={f.pan} onChange={set("pan")} placeholder="ABCDE1234F" maxLength={10} /></FieldRow>
        <FieldRow label="Aadhaar Number"><FInput value={f.aadhaar} onChange={set("aadhaar")} placeholder="12-digit Aadhaar" maxLength={14} /></FieldRow>
        <FieldRow label="Tax ID / TIN (if applicable)"><FInput value={f.tin} onChange={set("tin")} placeholder="Applicable outside India" /></FieldRow>
      </div>
      <CustomFields fields={customFields ?? []} values={customValues} onChange={(k, v) => setCustomValues(p => ({ ...p, [k]: v }))} />
      <SectionActions onBack={onBack}
        onNext={async () => { setSaving(true); try { await onSave({ ...f, ...customValues }); } finally { setSaving(false); } }}
        saving={saving} />
    </div>
  );
}

type DocState = { name: string; url: string } | null;

export const DEFAULT_DOCUMENT_ITEMS: DocumentItem[] = [
  { id: "govt_id",    key: "govt_id",    label: "Government ID",          hint: "Passport, Driving Licence, Voter ID",        required: true,  accept: ".pdf,.jpg,.jpeg,.png", maxSizeMb: 10 },
  { id: "address",    key: "address",    label: "Address Proof",           hint: "Utility bill, Bank statement (< 3 months)",  required: true,  accept: ".pdf,.jpg,.jpeg,.png", maxSizeMb: 10 },
  { id: "education",  key: "education",  label: "Educational Certificate", hint: "Highest degree / marksheet",                 required: true,  accept: ".pdf,.jpg,.jpeg,.png", maxSizeMb: 10 },
  { id: "experience", key: "experience", label: "Experience Letter",       hint: "From most recent employer",                  required: false, accept: ".pdf,.jpg,.jpeg,.png", maxSizeMb: 10 },
  { id: "photo",      key: "photo",      label: "Passport-size Photo",     hint: "Recent colour photograph",                   required: false, accept: ".jpg,.jpeg,.png",      maxSizeMb: 5  },
  { id: "bank_proof", key: "bank_proof", label: "Bank Proof",              hint: "Cancelled cheque or passbook front page",    required: true,  accept: ".pdf,.jpg,.jpeg,.png", maxSizeMb: 10 },
];

function DocumentsSection({ token, documentsConfig, defaults, onSave, onBack }: {
  token: string;
  documentsConfig: DocumentItem[];
  defaults: Record<string, unknown>;
  onSave: (d: Record<string, unknown>) => Promise<void>;
  onBack: () => void;
}) {
  const docItems = documentsConfig.length > 0 ? documentsConfig : DEFAULT_DOCUMENT_ITEMS;

  const [docs, setDocs] = useState<Record<string, DocState>>(
    Object.fromEntries(docItems.map(d => [d.key, (defaults[d.key] as DocState) ?? null]))
  );
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const readFile = useCallback((file: File): Promise<string> => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = () => rej(new Error("Could not read file"));
    reader.readAsDataURL(file);
  }), []);

  async function handleFile(docItem: DocumentItem, file: File) {
    if (file.size > docItem.maxSizeMb * 1024 * 1024) {
      toast.error(`File must be under ${docItem.maxSizeMb} MB`);
      return;
    }
    setUploading(u => ({ ...u, [docItem.key]: true }));
    try {
      const base64 = await readFile(file);
      const { url } = await uploadOnboardingDoc({ data: { token, docType: docItem.key, fileName: file.name, fileBase64: base64, mimeType: file.type } });
      setDocs(d => ({ ...d, [docItem.key]: { name: file.name, url } }));
      toast.success(`${docItem.label} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(u => ({ ...u, [docItem.key]: false }));
    }
  }

  const requiredCount  = docItems.filter(d => d.required).length;
  const uploadedRequired = docItems.filter(d => d.required && docs[d.key]).length;

  return (
    <div className="space-y-4">
      {requiredCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground border">
          <Upload className="h-3.5 w-3.5 shrink-0" />
          <span>{uploadedRequired} of {requiredCount} required documents uploaded</span>
        </div>
      )}

      {docItems.map(dt => {
        const doc  = docs[dt.key];
        const busy = uploading[dt.key];
        return (
          <div key={dt.key} className={`rounded-xl border p-4 flex items-start gap-4 ${dt.required && !doc ? "border-amber-200 bg-amber-50/30" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium">{dt.label}</p>
                {dt.required
                  ? <span className="text-[10px] rounded-full bg-red-100 text-red-600 px-2 py-0.5 font-medium shrink-0">Required</span>
                  : <span className="text-[10px] rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 shrink-0">Optional</span>
                }
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{dt.hint}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                Accepts: {dt.accept.replace(/\./g, "").toUpperCase().replace(/,/g, ", ")} · Max {dt.maxSizeMb} MB
              </p>
              {doc && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
                  <Check className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{doc.name}</span>
                </div>
              )}
            </div>
            <label className={`shrink-0 cursor-pointer flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              doc ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-background hover:bg-muted"
            }`}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : doc ? <RefreshCw className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
              {doc ? "Replace" : "Upload"}
              <input type="file" className="sr-only" accept={dt.accept}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(dt, f); e.target.value = ""; }} />
            </label>
          </div>
        );
      })}

      <SectionActions onBack={onBack}
        onNext={async () => { setSaving(true); try { await onSave(docs as Record<string, unknown>); } finally { setSaving(false); } }}
        saving={saving} />
    </div>
  );
}

function AgreementsSection({ candidateName, agreementsConfig, defaults, onSave, onBack, onChange }: {
  candidateName: string;
  agreementsConfig: AgreementItem[];
  defaults: Record<string, unknown>;
  onSave: (d: Record<string, unknown>) => Promise<void>;
  onBack: () => void;
  onChange?: (d: Record<string, unknown>) => void;
}) {
  const agreements = agreementsConfig.length > 0 ? agreementsConfig : DEFAULT_AGREEMENTS;

  type AgreementState = { agreed: boolean; signature: string; signed_at: string };
  const [items, setItems] = useState<Record<string, AgreementState>>(
    Object.fromEntries(agreements.map(a => [
      a.id,
      (defaults[a.id] as AgreementState) ?? { agreed: false, signature: "", signed_at: "" },
    ]))
  );
  const [saving, setSaving] = useState(false);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    onChange?.(items as unknown as Record<string, unknown>);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  function toggle(id: string) {
    setItems(prev => {
      const cur = prev[id] ?? { agreed: false, signature: "", signed_at: "" };
      return {
        ...prev,
        [id]: {
          agreed: !cur.agreed,
          signature: !cur.agreed ? candidateName : "",
          signed_at: !cur.agreed ? new Date().toISOString() : "",
        },
      };
    });
  }

  async function handleSave() {
    const requiredUnsigned = agreements.filter(a => a.required && !items[a.id]?.agreed);
    if (requiredUnsigned.length > 0) {
      toast.error(`Please agree to: ${requiredUnsigned.map(a => a.name).join(", ")}`);
      return;
    }
    setSaving(true);
    try { await onSave(items as unknown as Record<string, unknown>); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      {agreements.map(a => {
        const item = items[a.id] ?? { agreed: false, signature: "", signed_at: "" };
        return (
          <div key={a.id} className={`rounded-xl border-2 p-5 transition-colors ${item.agreed ? "border-emerald-200 bg-emerald-50/40" : "border-border bg-card"}`}>
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <p className="font-semibold text-sm">{a.name}</p>
              {!a.required && <span className="shrink-0 text-[10px] rounded-full bg-gray-100 text-gray-500 px-2 py-0.5">Optional</span>}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{a.description}</p>
            {a.file_url && (
              <a href={a.file_url} target="_blank" rel="noopener" download
                className="inline-flex items-center gap-1.5 mb-3 text-xs font-medium text-primary border border-primary/20 rounded-lg px-3 py-1.5 bg-primary/5 hover:bg-primary/10 transition-colors">
                <FileDown className="h-3.5 w-3.5" />
                Download & Read Document
              </a>
            )}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div
                className={`mt-0.5 h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${item.agreed ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}
                onClick={() => toggle(a.id)}
              >
                {item.agreed && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm font-medium">
                I, <strong>{item.agreed ? item.signature : candidateName}</strong>, agree to the {a.name}
                {a.required && <span className="text-red-500 ml-0.5">*</span>}
              </span>
            </label>
            {item.agreed && (
              <p className="mt-2 ml-8 text-[11px] text-emerald-600">
                Signed by {item.signature} · {new Date(item.signed_at).toLocaleString()}
              </p>
            )}
          </div>
        );
      })}
      <SectionActions onBack={onBack} onNext={handleSave} saving={saving} />
    </div>
  );
}

export const DEFAULT_ADDITIONAL_FIELDS: CustomField[] = [
  { id: "tshirt_size",       label: "T-Shirt Size",                       type: "select",   required: false, options: ["XS","S","M","L","XL","XXL","XXXL"] },
  { id: "laptop_pref",       label: "Laptop Preference",                  type: "select",   required: false, options: ["MacBook Pro","MacBook Air","Windows Laptop","No preference"] },
  { id: "dietary",           label: "Dietary Restrictions / Preferences", type: "text",     required: false, placeholder: "Vegetarian, vegan, allergies…" },
  { id: "emergency_medical", label: "Emergency Medical Information",       type: "textarea", required: false, placeholder: "Blood group, known allergies, medications (optional)" },
  { id: "other",             label: "Anything else you'd like to share?", type: "textarea", required: false, placeholder: "Any other information for your HR team" },
];

function AdditionalSection({ defaults, customFields, onSave, onBack, onChange }: {
  defaults: Record<string, unknown>;
  customFields?: CustomField[];
  onSave: (d: Record<string, unknown>) => Promise<void>;
  onBack: () => void;
  onChange?: (d: Record<string, unknown>) => void;
}) {
  // Use configured fields if set, otherwise fall back to the defaults.
  const activeFields = (customFields && customFields.length > 0) ? customFields : DEFAULT_ADDITIONAL_FIELDS;

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(activeFields.map(f => [f.id, String(defaults[f.id] ?? "")]))
  );
  const [saving, setSaving] = useState(false);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    onChange?.(values);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  return (
    <div className="space-y-4">
      {activeFields.map(field => (
        <FieldRow key={field.id} label={field.label} required={field.required}>
          {field.type === "select" && field.options ? (
            <FSelect value={values[field.id] ?? ""} onChange={e => setValues(p => ({ ...p, [field.id]: e.target.value }))}>
              <option value="">Select</option>
              {field.options.map(o => <option key={o} value={o}>{o}</option>)}
            </FSelect>
          ) : field.type === "textarea" ? (
            <FTextarea value={values[field.id] ?? ""} onChange={e => setValues(p => ({ ...p, [field.id]: e.target.value }))} placeholder={field.placeholder ?? ""} />
          ) : (
            <FInput
              type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
              value={values[field.id] ?? ""}
              onChange={e => setValues(p => ({ ...p, [field.id]: e.target.value }))}
              placeholder={field.placeholder ?? ""}
            />
          )}
        </FieldRow>
      ))}
      <SectionActions onBack={onBack}
        onNext={async () => { setSaving(true); try { await onSave(values); } finally { setSaving(false); } }}
        saving={saving} />
    </div>
  );
}

function ReviewSection({ session, savedData, completedSections, onBack, onSubmit, submitting }: {
  session: Session; savedData: Record<string, Record<string, unknown>>;
  completedSections: Set<string>;
  onBack: () => void; onSubmit: () => Promise<void>; submitting: boolean;
}) {
  const personal    = savedData.personal ?? {};
  const banking     = savedData.banking ?? {};
  const tax         = savedData.tax ?? {};
  const additional  = savedData.additional ?? {};

  const pendingRequired = REQUIRED_SECTIONS.filter(s => !completedSections.has(s));
  const canSubmit = pendingRequired.length === 0;

  const groups = [
    { title: "Personal Information", rows: [
      ["Full Name", personal.full_name], ["Date of Birth", personal.dob],
      ["Gender", personal.gender], ["Phone", personal.phone],
      ["Nationality", personal.nationality],
      ["City / State", personal.city ? `${personal.city}, ${personal.state}` : null],
      ["Emergency Contact", personal.ec_name ? `${personal.ec_name} (${personal.ec_relation}) · ${personal.ec_phone}` : null],
    ]},
    { title: "Employment", rows: [
      ["Job Title", session.job_title], ["Department", session.department],
      ["Location", session.office_location],
      ["Joining Date", savedData.employment?.joining_date ?? session.joining_date],
    ]},
    { title: "Banking", rows: [
      ["Bank", banking.bank_name],
      ["Account", banking.account_number ? `****${String(banking.account_number).slice(-4)}` : null],
      ["IFSC", banking.ifsc],
    ]},
    { title: "Tax", rows: [
      ["PAN", tax.pan],
      ["Aadhaar", tax.aadhaar ? `****${String(tax.aadhaar).slice(-4)}` : null],
    ]},
    { title: "Additional", rows: [
      ["T-Shirt Size", additional.tshirt_size], ["Laptop Pref", additional.laptop_pref],
      ["Dietary", additional.dietary],
    ]},
  ];

  return (
    <div className="space-y-5">
      {canSubmit ? (
        <div className="rounded-xl border bg-emerald-50/50 border-emerald-200 p-4 flex items-start gap-2.5">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Almost done!</p>
            <p className="text-xs text-emerald-700 mt-0.5">Review your details below before submitting. You can go back to edit any section.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Some required sections are incomplete</p>
              <p className="text-xs text-amber-700 mt-1">Please complete the following sections before submitting:</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 ml-7">
            {pendingRequired.map(s => (
              <span key={s} className="rounded-full bg-amber-100 text-amber-800 text-xs font-medium px-3 py-1 border border-amber-200">
                {REQUIRED_LABELS[s]}
              </span>
            ))}
          </div>
        </div>
      )}

      {groups.map(g => {
        const hasData = g.rows.some(r => r[1] != null && r[1] !== "");
        if (!hasData) return null;
        return (
          <div key={g.title} className="rounded-xl border p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-900">{g.title}</p>
            {g.rows.filter(r => r[1] != null && r[1] !== "").map(r => (
              <div key={String(r[0])} className="flex gap-2 text-sm">
                <span className="text-muted-foreground w-36 shrink-0">{String(r[0])}</span>
                <span className="font-medium">{String(r[1])}</span>
              </div>
            ))}
          </div>
        );
      })}

      <div className="flex gap-3 pt-4 border-t">
        <button onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={onSubmit} disabled={submitting || !canSubmit}
          title={!canSubmit ? "Complete all required sections first" : undefined}
          className="ml-auto flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Submit Onboarding
        </button>
      </div>
    </div>
  );
}

// ─── OTP Gate ────────────────────────────────────────────────────────────────

function OtpGate({ token, email, onVerified, reVerify }: {
  token: string; email: string; onVerified: () => void; reVerify?: boolean;
}) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (sent) setTimeout(() => inputRef.current?.focus(), 80); }, [sent]);

  async function handleSend() {
    setSending(true); setError(null);
    try {
      await requestOnboardingOtp({ data: { token } });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send OTP");
    } finally { setSending(false); }
  }

  async function handleVerify() {
    if (code.trim().length < 4) { setError("Please enter the 6-digit code"); return; }
    setVerifying(true); setError(null);
    try {
      await verifyOnboardingOtp({ data: { token, code: code.trim() } });
      onVerified();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally { setVerifying(false); }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 pt-4">
      <div className="text-center space-y-1">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          {reVerify ? <Shield className="h-7 w-7" /> : <FileText className="h-7 w-7" />}
        </div>
        <h2 className="text-xl font-bold">{reVerify ? "Verify to continue" : "Verify your identity"}</h2>
        <p className="text-sm text-muted-foreground">
          {sent ? "We've sent a 6-digit code to" : "We'll send a verification code to"}<br />
          <strong className="text-foreground">{email}</strong>
        </p>
        {reVerify && !sent && (
          <p className="text-xs bg-blue-50 text-blue-700 rounded-lg px-3 py-2 border border-blue-100 mt-2">
            Your progress is saved — you'll continue right where you left off.
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {!sent ? (
        <button onClick={handleSend} disabled={sending}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          {sending ? "Sending…" : "Send Verification Code"}
        </button>
      ) : (
        <div className="space-y-4">
          <input
            ref={inputRef}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={e => e.key === "Enter" && handleVerify()}
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-2xl font-mono tracking-widest outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button onClick={handleVerify} disabled={verifying || code.length < 6}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify & Continue
          </button>
          <button onClick={() => { setSent(false); setCode(""); setError(null); }}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
            Resend code
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

function Wizard({ token, session }: { token: string; session: Session }) {
  const qc = useQueryClient();
  const [current, setCurrent] = useState<SectionId>(() => {
    const done = new Set(session.sections.filter(s => s.completed).map(s => s.section));
    for (const s of FORM_SECTIONS) { if (!done.has(s)) return s as SectionId; }
    return "review";
  });
  const [savedData, setSavedData] = useState<Record<string, Record<string, unknown>>>(
    Object.fromEntries(session.sections.map(s => [s.section, s.data]))
  );
  const [completedSections, setCompletedSections] = useState<Set<string>>(
    new Set(session.sections.filter(s => s.completed).map(s => s.section))
  );
  const [submitting, setSubmitting] = useState(false);

  // Auto-save: debounced 2.5s, saves with completed:false
  const autoTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAutoSave = useCallback((section: SectionId, data: Record<string, unknown>) => {
    if (autoTimers.current[section]) clearTimeout(autoTimers.current[section]);
    setAutoSaveStatus("saving");
    autoTimers.current[section] = setTimeout(async () => {
      try {
        await saveOnboardingSection({ data: { token, section, data, completed: false } });
        setSavedData(prev => ({ ...prev, [section]: data }));
        setAutoSaveStatus("saved");
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = setTimeout(() => setAutoSaveStatus("idle"), 2500);
      } catch {
        setAutoSaveStatus("error");
      }
    }, 2500);
  }, [token]);

  const completedCount = FORM_SECTIONS.filter(s => completedSections.has(s)).length;
  const progress = Math.round((completedCount / FORM_SECTIONS.length) * 100);

  async function handleSave(section: SectionId, data: Record<string, unknown>) {
    // Cancel any pending auto-save for this section
    if (autoTimers.current[section]) clearTimeout(autoTimers.current[section]);
    await saveOnboardingSection({ data: { token, section, data, completed: true } });
    setSavedData(prev => ({ ...prev, [section]: data }));
    setCompletedSections(prev => new Set([...prev, section]));
    qc.invalidateQueries({ queryKey: ["onboarding", token] });
    const idx = SECTION_LIST.findIndex(s => s.id === section);
    if (idx < SECTION_LIST.length - 1) setCurrent(SECTION_LIST[idx + 1].id);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitOnboarding({ data: { token } });
      await qc.invalidateQueries({ queryKey: ["onboarding", token] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally { setSubmitting(false); }
  }

  const prevSection = (id: SectionId) => {
    const idx = SECTION_LIST.findIndex(s => s.id === id);
    return idx > 0 ? SECTION_LIST[idx - 1].id : null;
  };

  const org = session.organizations;
  const agreementsConfig = session.agreements_config ?? [];
  const customFieldsConfig = session.custom_fields_config ?? {};

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header — matches careers page style */}
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 sm:px-6 py-3 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            {org?.logo_url
              ? <img src={org.logo_url} alt="" className="h-8 w-8 rounded-lg object-contain shrink-0" />
              : <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">{(org?.company_name ?? "H")[0]}</div>
            }
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">{org?.company_name ?? "Onboarding"}</p>
              <p className="text-[11px] text-muted-foreground truncate leading-tight">{session.candidate_name}{session.job_title ? ` · ${session.job_title}` : ""}</p>
            </div>
          </div>
          {/* Progress + links */}
          <div className="flex items-center gap-3 shrink-0">
            <AutoSaveBadge status={autoSaveStatus} />
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-1.5 w-24 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">{progress}%</span>
            </div>
            {org?.website && (
              <a href={org.website} target="_blank" rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors border rounded-lg px-2.5 py-1">
                Website ↗
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl w-full flex flex-1 gap-6 p-4 sm:p-6">
        {/* Sidebar nav */}
        <aside className="hidden lg:flex w-52 shrink-0 flex-col gap-1 pt-2">
          {SECTION_LIST.map(s => {
            const done = s.id !== "review" && completedSections.has(s.id);
            const active = current === s.id;
            const isRequiredPending = s.id !== "review" && REQUIRED_SECTIONS.includes(s.id as SectionId) && !completedSections.has(s.id);
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setCurrent(s.id)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                  active ? "bg-primary/10 text-primary font-semibold"
                  : done ? "text-emerald-700 hover:bg-emerald-50"
                  : "text-muted-foreground hover:bg-gray-100"
                }`}
              >
                {done && !active
                  ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  : <Icon className="h-4 w-4 shrink-0" />
                }
                <span className="flex-1">{s.label}</span>
                {isRequiredPending && s.id !== "review" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                )}
              </button>
            );
          })}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold">{SECTION_LIST.find(s => s.id === current)?.label}</h2>
            </div>

            {current === "personal" && (
              <PersonalSection
                defaults={savedData.personal ?? {}}
                customFields={customFieldsConfig["personal"]}
                onSave={d => handleSave("personal", d)}
                onChange={d => handleAutoSave("personal", d)}
              />
            )}
            {current === "employment" && (
              <EmploymentSection
                session={session}
                defaults={savedData.employment ?? {}}
                customFields={customFieldsConfig["employment"]}
                onSave={d => handleSave("employment", d)}
                onChange={d => handleAutoSave("employment", d)}
              />
            )}
            {current === "banking" && (
              <BankingSection
                defaults={savedData.banking ?? {}}
                customFields={customFieldsConfig["banking"]}
                onSave={d => handleSave("banking", d)}
                onBack={() => { const p = prevSection("banking"); if (p) setCurrent(p); }}
                onChange={d => handleAutoSave("banking", d)}
              />
            )}
            {current === "tax" && (
              <TaxSection
                defaults={savedData.tax ?? {}}
                customFields={customFieldsConfig["tax"]}
                onSave={d => handleSave("tax", d)}
                onBack={() => { const p = prevSection("tax"); if (p) setCurrent(p); }}
                onChange={d => handleAutoSave("tax", d)}
              />
            )}
            {current === "documents" && (
              <DocumentsSection
                token={token}
                documentsConfig={(session.documents_config as DocumentItem[]) ?? []}
                defaults={savedData.documents ?? {}}
                onSave={d => handleSave("documents", d)}
                onBack={() => { const p = prevSection("documents"); if (p) setCurrent(p); }}
              />
            )}
            {current === "agreements" && (
              <AgreementsSection
                candidateName={session.candidate_name}
                agreementsConfig={agreementsConfig}
                defaults={savedData.agreements ?? {}}
                onSave={d => handleSave("agreements", d)}
                onBack={() => { const p = prevSection("agreements"); if (p) setCurrent(p); }}
                onChange={d => handleAutoSave("agreements", d)}
              />
            )}
            {current === "additional" && (
              <AdditionalSection
                defaults={savedData.additional ?? {}}
                customFields={customFieldsConfig["additional"]}
                onSave={d => handleSave("additional", d)}
                onBack={() => { const p = prevSection("additional"); if (p) setCurrent(p); }}
                onChange={d => handleAutoSave("additional", d)}
              />
            )}
            {current === "review" && (
              <ReviewSection
                session={session}
                savedData={savedData}
                completedSections={completedSections}
                onBack={() => setCurrent("additional")}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Thank You ─────────────────────────────────────────────────────────────────

function ThankYou({ session }: { session: Session }) {
  const org = session.organizations;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">You're all set, {session.candidate_name.split(" ")[0]}!</h1>
          <p className="text-muted-foreground mt-2">
            Your onboarding information has been submitted to {org?.company_name ?? "the team"}.
            HR will review your documents and reach out if anything is needed.
          </p>
        </div>
        {session.joining_date && (
          <div className="rounded-xl border bg-white p-5 text-sm">
            <p className="text-muted-foreground">Your joining date</p>
            <p className="text-xl font-bold mt-1">{new Date(session.joining_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        )}
        {session.hr_contact_email && (
          <p className="text-sm text-muted-foreground">
            Questions? Reach out at{" "}
            <a href={`mailto:${session.hr_contact_email}`} className="text-primary hover:underline">{session.hr_contact_email}</a>
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Rejected Page ─────────────────────────────────────────────────────────────

function RejectedPage({ session }: { session: Session }) {
  const org = session.organizations;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-100 text-red-500">
          <XCircle className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Onboarding session cancelled</h1>
          <p className="text-sm text-muted-foreground mt-2">
            This onboarding session has been cancelled by {org?.company_name ?? "your HR team"}.
            {session.rejection_reason && ` Reason: ${session.rejection_reason}.`}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Please contact your HR team for a new onboarding invitation.
        </p>
        {session.hr_contact_email && (
          <a href={`mailto:${session.hr_contact_email}`} className="text-sm text-primary hover:underline">
            {session.hr_contact_email}
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Root Portal Component ─────────────────────────────────────────────────────

function WelcomePortal() {
  const { token } = Route.useParams();
  const qc = useQueryClient();

  // Verification is scoped to the current page session.
  // Closing the tab, reloading, or opening in a new tab all reset this to false,
  // forcing the candidate to re-enter their OTP every time.
  const [isSessionVerified, setIsSessionVerified] = useState(false);

  const { data: session, isLoading, error } = useQuery({
    queryKey: ["onboarding", token],
    queryFn: () => getOnboardingByToken({ data: { token } }),
    retry: false,
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
    </div>
  );

  if (error || !session) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-sm text-center space-y-4">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold">Invalid or expired link</h1>
        <p className="text-sm text-muted-foreground">This onboarding link is either invalid or has expired. Please contact your HR team for a new link.</p>
      </div>
    </div>
  );

  const typedSession = session as Session;

  if (typedSession.rejected_at) return <RejectedPage session={typedSession} />;
  if (typedSession.status === "submitted") return <ThankYou session={typedSession} />;

  // Always show OTP gate unless verified in the current page session
  if (!isSessionVerified) {
    const verifyOrg = typedSession.organizations;
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2.5 font-semibold">
              {verifyOrg?.logo_url
                ? <img src={verifyOrg.logo_url} alt="" className="h-8 w-8 rounded-lg object-contain" />
                : <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-bold"><Building2 className="h-4 w-4" /></div>
              }
              <span className="text-sm">{verifyOrg?.company_name ?? "Onboarding"}</span>
            </div>
            {verifyOrg?.website && (
              <a href={verifyOrg.website} target="_blank" rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Website ↗
              </a>
            )}
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-12">
          <OtpGate
            token={token}
            email={typedSession.candidate_email}
            reVerify={typedSession.verified}
            onVerified={() => {
              setIsSessionVerified(true);
              qc.invalidateQueries({ queryKey: ["onboarding", token] });
            }}
          />
        </div>
      </div>
    );
  }

  return <Wizard token={token} session={typedSession} />;
}
