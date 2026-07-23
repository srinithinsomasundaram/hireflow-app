import { useState, useCallback } from "react";
import {
  Loader2, Upload, Settings2, Trash2, Plus, Save, FileDown, GripVertical, Info,
} from "lucide-react";
import { toast } from "sonner";
import { uploadAgreementFile } from "@/lib/onboarding.functions";
import type { AgreementItem, CustomField, CustomFieldsConfig, DocumentItem } from "@/routes/welcome/$token";
import { DEFAULT_DOCUMENT_ITEMS, DEFAULT_ADDITIONAL_FIELDS } from "@/routes/welcome/$token";

// ─── Shared constants ────────────────────────────────────────────────────────

export const DEFAULT_AGREEMENTS: AgreementItem[] = [
  { id: "offer_letter",         name: "Offer Letter",             description: "I confirm I have read and accept the terms of the offer letter.", file_url: null, required: true },
  { id: "employment_agreement", name: "Employment Agreement",     description: "I agree to comply with all terms of employment.", file_url: null, required: true },
  { id: "nda",                  name: "Non-Disclosure Agreement", description: "I agree to keep all proprietary information strictly confidential.", file_url: null, required: true },
  { id: "code_of_conduct",      name: "Code of Conduct",          description: "I acknowledge and commit to upholding the company's standards.", file_url: null, required: true },
];

export const SECTION_LABELS: Record<string, string> = {
  personal:    "Personal Information",
  employment:  "Employment Details",
  banking:     "Banking Details",
  tax:         "Tax Information",
  documents:   "Document Upload",
  agreements:  "Digital Agreements",
  additional:  "Additional Information",
};

export const CONFIGURABLE_SECTIONS = Object.keys(SECTION_LABELS).filter(s => s !== "employment");

export const ACCEPT_PRESETS: { label: string; value: string }[] = [
  { label: "PDF & Images",       value: ".pdf,.jpg,.jpeg,.png" },
  { label: "PDF only",           value: ".pdf" },
  { label: "Images only",        value: ".jpg,.jpeg,.png" },
  { label: "PDF, Images & Word", value: ".pdf,.jpg,.jpeg,.png,.doc,.docx" },
  { label: "Any file type",      value: "*" },
];

export const FIELD_TYPES: { value: CustomField["type"]; label: string }[] = [
  { value: "text",     label: "Text" },
  { value: "number",   label: "Number" },
  { value: "date",     label: "Date" },
  { value: "select",   label: "Dropdown" },
  { value: "textarea", label: "Long Text" },
];

export function nanoid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ─── Agreement Editor ─────────────────────────────────────────────────────────
// sessionId is optional — when omitted (e.g. settings template), PDF upload is hidden.

export function AgreementEditor({ sessionId, initial, onSave }: {
  sessionId?: string;
  initial: AgreementItem[];
  onSave: (items: AgreementItem[]) => void;
}) {
  const [items, setItems]       = useState<AgreementItem[]>(initial.length > 0 ? initial : DEFAULT_AGREEMENTS);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addForm, setAddForm]    = useState<{ name: string; description: string; required: boolean } | null>(null);

  const readFile = useCallback((file: File): Promise<string> => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = () => rej(new Error("Read failed"));
    reader.readAsDataURL(file);
  }), []);

  async function handleUpload(id: string, file: File) {
    if (!sessionId) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("File must be under 20 MB"); return; }
    setUploading(u => ({ ...u, [id]: true }));
    try {
      const base64 = await readFile(file);
      const { url } = await uploadAgreementFile({ data: { sessionId, fileName: file.name, fileBase64: base64, mimeType: file.type } });
      setItems(prev => prev.map(a => a.id === id ? { ...a, file_url: url } : a));
      toast.success("Document uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(u => ({ ...u, [id]: false }));
    }
  }

  function addAgreement() {
    if (!addForm || !addForm.name.trim()) return;
    setItems(prev => [...prev, {
      id: nanoid(), name: addForm.name.trim(),
      description: addForm.description.trim(), file_url: null, required: addForm.required,
    }]);
    setAddForm(null);
  }

  return (
    <div className="space-y-3">
      {!sessionId && (
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          PDFs can be attached per-session after creating an onboarding session for a candidate.
        </div>
      )}

      {items.map((a, idx) => (
        <div key={a.id} className={`rounded-xl border p-4 space-y-3 ${a.required ? "border-primary/20 bg-primary/[0.02]" : ""}`}>
          {editingId === a.id ? (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Name</label>
                  <input value={a.name}
                    onChange={e => setItems(prev => prev.map(x => x.id === a.id ? { ...x, name: e.target.value } : x))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Required</label>
                  <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" id={`req-${a.id}`} checked={a.required}
                      onChange={e => setItems(prev => prev.map(x => x.id === a.id ? { ...x, required: e.target.checked } : x))}
                      className="h-4 w-4 rounded" />
                    <label htmlFor={`req-${a.id}`} className="text-sm">Required</label>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Consent text (shown to candidate)</label>
                <textarea value={a.description} rows={3}
                  onChange={e => setItems(prev => prev.map(x => x.id === a.id ? { ...x, description: e.target.value } : x))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
              <button onClick={() => setEditingId(null)} className="text-xs font-medium text-primary hover:underline">Done editing</button>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold truncate">{a.name}</p>
                  {a.required
                    ? <span className="shrink-0 text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">Required</span>
                    : <span className="shrink-0 text-[10px] rounded-full bg-gray-100 text-gray-500 px-2 py-0.5">Optional</span>
                  }
                  {a.file_url && (
                    <span className="shrink-0 text-[10px] rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 flex items-center gap-1">
                      <FileDown className="h-2.5 w-2.5" /> PDF attached
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {sessionId && (
                  <label title="Attach PDF" className="cursor-pointer grid h-7 w-7 place-items-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    {uploading[a.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    <input type="file" className="sr-only" accept=".pdf"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(a.id, f); e.target.value = ""; }} />
                  </label>
                )}
                <button onClick={() => setEditingId(a.id)} title="Edit"
                  className="grid h-7 w-7 place-items-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Settings2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} title="Remove"
                  className="grid h-7 w-7 place-items-center rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {addForm ? (
        <div className="rounded-xl border-2 border-dashed border-primary/30 p-4 space-y-3">
          <p className="text-sm font-semibold">New Agreement</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Name <span className="text-red-500">*</span></label>
              <input value={addForm.name} onChange={e => setAddForm(f => f && ({ ...f, name: e.target.value }))} placeholder="e.g. BYOD Policy"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Required</label>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" checked={addForm.required} onChange={e => setAddForm(f => f && ({ ...f, required: e.target.checked }))} className="h-4 w-4 rounded" />
                <span className="text-sm">Required</span>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Consent text shown to candidate</label>
            <textarea value={addForm.description} rows={2}
              onChange={e => setAddForm(f => f && ({ ...f, description: e.target.value }))} placeholder="I agree to…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAddForm(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={addAgreement} className="text-xs font-semibold text-primary hover:underline">Add Agreement</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAddForm({ name: "", description: "", required: true })}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/20 py-3 text-sm text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors">
          <Plus className="h-4 w-4" /> Add Agreement
        </button>
      )}

      <div className="pt-2">
        <button onClick={() => onSave(items)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          <Save className="h-4 w-4" /> Save Agreements
        </button>
      </div>
    </div>
  );
}

// ─── Documents Editor ─────────────────────────────────────────────────────────

export function DocumentsEditor({ initial, onSave }: {
  initial: DocumentItem[];
  onSave: (items: DocumentItem[]) => void;
}) {
  const [items, setItems]      = useState<DocumentItem[]>(initial.length > 0 ? initial : DEFAULT_DOCUMENT_ITEMS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addForm, setAddForm]  = useState<{
    label: string; hint: string; required: boolean; accept: string; maxSizeMb: number;
  } | null>(null);

  function removeItem(id: string) {
    setItems(prev => prev.filter(d => d.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function updateItem(id: string, patch: Partial<DocumentItem>) {
    setItems(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  }

  function addItem() {
    if (!addForm || !addForm.label.trim()) return;
    const slug = addForm.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 32);
    const uid  = slug + "_" + Date.now().toString(36);
    setItems(prev => [...prev, {
      id: uid, key: uid,
      label:     addForm.label.trim(),
      hint:      addForm.hint.trim(),
      required:  addForm.required,
      accept:    addForm.accept,
      maxSizeMb: addForm.maxSizeMb,
    }]);
    setAddForm(null);
  }

  return (
    <div className="space-y-3">
      {items.map(d => (
        <div key={d.id} className={`rounded-xl border p-4 space-y-3 ${d.required ? "border-primary/20 bg-primary/[0.02]" : ""}`}>
          {editingId === d.id ? (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Label <span className="text-red-500">*</span></label>
                  <input value={d.label} onChange={e => updateItem(d.id, { label: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Required</label>
                  <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" id={`req-${d.id}`} checked={d.required}
                      onChange={e => updateItem(d.id, { required: e.target.checked })} className="h-4 w-4 rounded" />
                    <label htmlFor={`req-${d.id}`} className="text-sm">Required</label>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Description / hint for candidate</label>
                <input value={d.hint} onChange={e => updateItem(d.id, { hint: e.target.value })} placeholder="e.g. Passport, Driving Licence, Voter ID"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Accepted file types</label>
                  <select value={d.accept} onChange={e => updateItem(d.id, { accept: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white">
                    {ACCEPT_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Max file size (MB)</label>
                  <input type="number" min={1} max={100} value={d.maxSizeMb}
                    onChange={e => updateItem(d.id, { maxSizeMb: Math.max(1, Number(e.target.value)) })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <button onClick={() => setEditingId(null)} className="text-xs font-medium text-primary hover:underline">Done editing</button>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold truncate">{d.label}</p>
                  {d.required
                    ? <span className="shrink-0 text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">Required</span>
                    : <span className="shrink-0 text-[10px] rounded-full bg-gray-100 text-gray-500 px-2 py-0.5">Optional</span>
                  }
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{d.hint || <span className="italic">No hint set</span>}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {ACCEPT_PRESETS.find(p => p.value === d.accept)?.label ?? d.accept} · Max {d.maxSizeMb} MB
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setEditingId(d.id)} title="Edit"
                  className="grid h-7 w-7 place-items-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Settings2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => removeItem(d.id)} title="Remove"
                  className="grid h-7 w-7 place-items-center rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {addForm ? (
        <div className="rounded-xl border-2 border-dashed border-primary/30 p-4 space-y-3">
          <p className="text-sm font-semibold">New Document</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Label <span className="text-red-500">*</span></label>
              <input value={addForm.label} onChange={e => setAddForm(f => f && ({ ...f, label: e.target.value }))} placeholder="e.g. PAN Card"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Required</label>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="req-new-doc" checked={addForm.required}
                  onChange={e => setAddForm(f => f && ({ ...f, required: e.target.checked }))} className="h-4 w-4 rounded" />
                <label htmlFor="req-new-doc" className="text-sm">Required</label>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Description / hint for candidate</label>
            <input value={addForm.hint} onChange={e => setAddForm(f => f && ({ ...f, hint: e.target.value }))} placeholder="e.g. Front and back of PAN card"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Accepted file types</label>
              <select value={addForm.accept} onChange={e => setAddForm(f => f && ({ ...f, accept: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white">
                {ACCEPT_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Max file size (MB)</label>
              <input type="number" min={1} max={100} value={addForm.maxSizeMb}
                onChange={e => setAddForm(f => f && ({ ...f, maxSizeMb: Math.max(1, Number(e.target.value)) }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAddForm(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={addItem} className="text-xs font-semibold text-primary hover:underline">Add Document</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAddForm({ label: "", hint: "", required: true, accept: ".pdf,.jpg,.jpeg,.png", maxSizeMb: 10 })}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/20 py-3 text-sm text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors">
          <Plus className="h-4 w-4" /> Add Document
        </button>
      )}

      <div className="pt-2">
        <button onClick={() => onSave(items)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          <Save className="h-4 w-4" /> Save Documents
        </button>
      </div>
    </div>
  );
}

// ─── Custom Fields Editor ─────────────────────────────────────────────────────

export function CustomFieldsEditor({ initial, onSave }: {
  initial: CustomFieldsConfig;
  onSave: (cfg: CustomFieldsConfig) => void;
}) {
  // Seed the "additional" section with the portal defaults when no config exists yet
  const seeded: CustomFieldsConfig = {
    ...initial,
    additional: (initial.additional && initial.additional.length > 0)
      ? initial.additional
      : DEFAULT_ADDITIONAL_FIELDS,
  };
  const [cfg, setCfg] = useState<CustomFieldsConfig>(seeded);
  const [selectedSection, setSelectedSection] = useState(CONFIGURABLE_SECTIONS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    label: string; type: CustomField["type"]; required: boolean; placeholder: string; options: string;
  } | null>(null);
  const [addForm, setAddForm] = useState<{
    label: string; type: CustomField["type"]; required: boolean; placeholder: string; options: string;
  } | null>(null);

  const fields = cfg[selectedSection] ?? [];

  function removeField(id: string) {
    setCfg(prev => ({ ...prev, [selectedSection]: (prev[selectedSection] ?? []).filter(f => f.id !== id) }));
    if (editingId === id) { setEditingId(null); setEditForm(null); }
  }

  function startEdit(f: CustomField) {
    setEditingId(f.id);
    setEditForm({
      label: f.label, type: f.type, required: f.required,
      placeholder: f.placeholder ?? "", options: (f.options ?? []).join(", "),
    });
    setAddForm(null);
  }

  function saveEdit(id: string) {
    if (!editForm || !editForm.label.trim()) return;
    setCfg(prev => ({
      ...prev,
      [selectedSection]: (prev[selectedSection] ?? []).map(f =>
        f.id === id ? {
          ...f,
          label: editForm.label.trim(),
          type: editForm.type,
          required: editForm.required,
          placeholder: editForm.placeholder.trim() || undefined,
          options: editForm.type === "select" ? editForm.options.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        } : f
      ),
    }));
    setEditingId(null);
    setEditForm(null);
  }

  function addField() {
    if (!addForm || !addForm.label.trim()) return;
    const newField: CustomField = {
      id: nanoid(), label: addForm.label.trim(), type: addForm.type,
      required: addForm.required, placeholder: addForm.placeholder.trim() || undefined,
      options: addForm.type === "select" ? addForm.options.split(",").map(s => s.trim()).filter(Boolean) : undefined,
    };
    setCfg(prev => ({ ...prev, [selectedSection]: [...(prev[selectedSection] ?? []), newField] }));
    setAddForm(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {CONFIGURABLE_SECTIONS.map(s => (
          <button key={s} onClick={() => { setSelectedSection(s); setAddForm(null); setEditingId(null); setEditForm(null); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedSection === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}>
            {SECTION_LABELS[s]}
            {(cfg[s] ?? []).length > 0 && (
              <span className="ml-1.5 rounded-full bg-white/30 text-[10px] px-1.5 py-0.5">{(cfg[s] ?? []).length}</span>
            )}
          </button>
        ))}
      </div>

      {fields.length === 0 && !addForm ? (
        <p className="text-sm text-muted-foreground text-center py-4 border rounded-xl">
          No custom fields for {SECTION_LABELS[selectedSection]} yet.
        </p>
      ) : (
        <div className="space-y-2">
          {fields.map(f => (
            <div key={f.id} className="rounded-xl border p-4 space-y-3">
              {editingId === f.id && editForm ? (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Label <span className="text-red-500">*</span></label>
                      <input value={editForm.label} onChange={e => setEditForm(ef => ef && ({ ...ef, label: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Type</label>
                      <select value={editForm.type} onChange={e => setEditForm(ef => ef && ({ ...ef, type: e.target.value as CustomField["type"] }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white">
                        {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Placeholder</label>
                      <input value={editForm.placeholder} onChange={e => setEditForm(ef => ef && ({ ...ef, placeholder: e.target.value }))} placeholder="Optional hint…"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    </div>
                    {editForm.type === "select" && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Options (comma-separated)</label>
                        <input value={editForm.options} onChange={e => setEditForm(ef => ef && ({ ...ef, options: e.target.value }))} placeholder="Option A, Option B"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id={`req-edit-${f.id}`} checked={editForm.required}
                      onChange={e => setEditForm(ef => ef && ({ ...ef, required: e.target.checked }))} className="h-4 w-4 rounded" />
                    <label htmlFor={`req-edit-${f.id}`} className="text-sm">Required field</label>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => saveEdit(f.id)} className="text-xs font-medium text-primary hover:underline">Done editing</button>
                    <button onClick={() => { setEditingId(null); setEditForm(null); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{f.label}</span>
                      <span className="text-[10px] rounded-full bg-muted text-muted-foreground px-2 py-0.5 shrink-0">
                        {FIELD_TYPES.find(t => t.value === f.type)?.label ?? f.type}
                      </span>
                      {f.required && <span className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 shrink-0">required</span>}
                    </div>
                    {f.placeholder && <p className="text-xs text-muted-foreground mt-0.5">Placeholder: {f.placeholder}</p>}
                    {f.options && <p className="text-xs text-muted-foreground mt-0.5">Options: {f.options.join(", ")}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(f)} title="Edit"
                      className="grid h-7 w-7 place-items-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <Settings2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => removeField(f.id)} title="Remove"
                      className="grid h-7 w-7 place-items-center rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {addForm ? (
        <div className="rounded-xl border-2 border-dashed border-primary/30 p-4 space-y-3">
          <p className="text-sm font-semibold">New Field — {SECTION_LABELS[selectedSection]}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Label <span className="text-red-500">*</span></label>
              <input value={addForm.label} onChange={e => setAddForm(f => f && ({ ...f, label: e.target.value }))} placeholder="e.g. Employee ID"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Type</label>
              <select value={addForm.type} onChange={e => setAddForm(f => f && ({ ...f, type: e.target.value as CustomField["type"] }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white">
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Placeholder</label>
              <input value={addForm.placeholder} onChange={e => setAddForm(f => f && ({ ...f, placeholder: e.target.value }))} placeholder="Optional hint…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            {addForm.type === "select" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Options (comma-separated)</label>
                <input value={addForm.options} onChange={e => setAddForm(f => f && ({ ...f, options: e.target.value }))} placeholder="Option A, Option B"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="req-new" checked={addForm.required}
              onChange={e => setAddForm(f => f && ({ ...f, required: e.target.checked }))} className="h-4 w-4 rounded" />
            <label htmlFor="req-new" className="text-sm">Required field</label>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAddForm(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={addField} className="text-xs font-semibold text-primary hover:underline">Add Field</button>
          </div>
        </div>
      ) : (
        <button onClick={() => { setAddForm({ label: "", type: "text", required: false, placeholder: "", options: "" }); setEditingId(null); setEditForm(null); }}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/20 py-3 text-sm text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors">
          <Plus className="h-4 w-4" /> Add Field to {SECTION_LABELS[selectedSection]}
        </button>
      )}

      <div className="pt-2">
        <button onClick={() => onSave(cfg)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          <Save className="h-4 w-4" /> Save Form Fields
        </button>
      </div>
    </div>
  );
}
