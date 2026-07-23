import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, FileText, Upload, Info, LayoutList } from "lucide-react";
import { toast } from "sonner";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { getOnboardingTemplate, saveOnboardingTemplate } from "@/lib/onboarding.functions";
import { AgreementEditor, DocumentsEditor, CustomFieldsEditor } from "@/components/onboarding/editors";
import type { AgreementItem, DocumentItem, CustomFieldsConfig } from "@/routes/welcome/$token";

export const Route = createFileRoute("/_authenticated/settings/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding Settings · HireFlow" }] }),
  component: OnboardingSettings,
});

type Tab = "documents" | "agreements" | "fields";

function OnboardingSettings() {
  const { data: org } = useCurrentOrg();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("fields");

  const { data: template, isLoading } = useQuery({
    queryKey: ["onboarding-template", org?.id],
    queryFn: () => getOnboardingTemplate({ data: { orgId: org!.id } }),
    enabled: !!org?.id,
    staleTime: 30_000,
  });

  const t = template as {
    documentsConfig?: DocumentItem[];
    agreementsConfig?: AgreementItem[];
    customFieldsConfig?: CustomFieldsConfig;
  } | undefined;

  const saveDocs = useMutation({
    mutationFn: (items: DocumentItem[]) =>
      saveOnboardingTemplate({ data: { orgId: org!.id, documentsConfig: items } }),
    onSuccess: () => {
      toast.success("Document checklist saved");
      qc.invalidateQueries({ queryKey: ["onboarding-template", org?.id] });
    },
    onError: e => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const saveAgreements = useMutation({
    mutationFn: (items: AgreementItem[]) =>
      saveOnboardingTemplate({ data: { orgId: org!.id, agreementsConfig: items } }),
    onSuccess: () => {
      toast.success("Agreements template saved");
      qc.invalidateQueries({ queryKey: ["onboarding-template", org?.id] });
    },
    onError: e => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const saveFields = useMutation({
    mutationFn: (cfg: CustomFieldsConfig) =>
      saveOnboardingTemplate({ data: { orgId: org!.id, customFieldsConfig: cfg } }),
    onSuccess: () => {
      toast.success("Form fields saved");
      qc.invalidateQueries({ queryKey: ["onboarding-template", org?.id] });
    },
    onError: e => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  if (!org) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Onboarding Template</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure the form fields, document checklist, and consent agreements applied to every new onboarding session.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          Changes here apply to <strong>new sessions only</strong>. Existing sessions keep their own configuration, which you can edit per-session from the session detail page.
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {([
          { key: "fields",      label: "Form Fields",          icon: LayoutList },
          { key: "documents",   label: "Document Checklist",   icon: Upload },
          { key: "agreements",  label: "Agreements & Consent", icon: FileText },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {tab === "fields" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Add extra fields to each section of the onboarding form. Candidates will see these alongside the built-in fields.
              </p>
              <CustomFieldsEditor
                initial={t?.customFieldsConfig ?? {}}
                onSave={cfg => saveFields.mutate(cfg)}
              />
            </div>
          )}

          {tab === "documents" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Define which documents candidates must upload during onboarding. Set each as required or optional, and control accepted file types and maximum size.
              </p>
              <DocumentsEditor
                initial={t?.documentsConfig ?? []}
                onSave={items => saveDocs.mutate(items)}
              />
            </div>
          )}

          {tab === "agreements" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Define the agreements candidates must consent to. You can attach PDFs per-session from the session detail page after creating a session.
              </p>
              <AgreementEditor
                initial={t?.agreementsConfig ?? []}
                onSave={items => saveAgreements.mutate(items)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
