import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Building2, Globe, Plus, ArrowRight, Layers, ExternalLink, LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg, useSwitchOrg } from "@/hooks/use-current-org";
import { CreateWorkspaceDialog } from "@/components/app-sidebar";

export const Route = createFileRoute("/_authenticated/organization")({
  head: () => ({ meta: [{ title: "Organisation · HireFlow" }] }),
  component: OrganisationPage,
});

type OrgRow = {
  id: string;
  company_name: string;
  logo_url: string | null;
  slug: string;
  industry: string | null;
  website: string | null;
  parent_org_id: string | null;
  role: string;
};

async function fetchOrgHierarchy(): Promise<{ org: OrgRow | null; workspaces: OrgRow[] }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { org: null, workspaces: [] };

  // Try with parent_org_id (post-migration), fall back without it
  let rawRoles: unknown[] | null = null;
  let hasParentCol = true;

  const res1 = await supabase
    .from("user_roles")
    .select("role, organizations(id, company_name, logo_url, slug, industry, website, parent_org_id)")
    .eq("user_id", session.user.id)
    .eq("status", "active");

  if (res1.error) {
    hasParentCol = false;
    const res2 = await supabase
      .from("user_roles")
      .select("role, organizations(id, company_name, logo_url, slug, industry, website)")
      .eq("user_id", session.user.id)
      .eq("status", "active");
    rawRoles = res2.data;
  } else {
    rawRoles = res1.data;
  }

  if (!rawRoles || rawRoles.length === 0) return { org: null, workspaces: [] };

  const rows = (rawRoles as unknown[]).map((r) => {
    const row = r as { role: string; organizations: Omit<OrgRow, "role"> | null };
    if (!row.organizations) return null;
    return { ...row.organizations, parent_org_id: (row.organizations as OrgRow).parent_org_id ?? null, role: row.role };
  }).filter((x): x is OrgRow => x !== null);

  // If the migration hasn't run yet, show all orgs as workspaces
  if (!hasParentCol) return { org: null, workspaces: rows };

  const org = rows.find(r => r.parent_org_id === null) ?? null;
  const workspaces = rows.filter(r => r.parent_org_id !== null);

  // Backward compat: legacy accounts with no hierarchy yet
  if (!org && workspaces.length === 0) return { org: null, workspaces: rows };

  return { org, workspaces };
}

function OrganisationPage() {
  const { data: activeOrg } = useCurrentOrg();
  const switchOrg = useSwitchOrg();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["org-hierarchy"],
    queryFn: fetchOrgHierarchy,
    staleTime: 1000 * 60 * 5,
  });

  const org = data?.org ?? null;
  const workspaces = data?.workspaces ?? [];

  function onDialogClose() {
    setCreateOpen(false);
    qc.invalidateQueries({ queryKey: ["org-hierarchy"] });
    qc.invalidateQueries({ queryKey: ["all-orgs"] });
    qc.invalidateQueries({ queryKey: ["current-org"] });
  }

  function enterWorkspace(ws: OrgRow) {
    switchOrg(ws.id);
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* ── Organisation header ── */}
      <div className="border rounded-xl p-6 bg-card">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-muted border flex items-center justify-center overflow-hidden shrink-0">
              {org?.logo_url ? (
                <img src={org.logo_url} alt={org.company_name} className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Organisation</p>
              <h1 className="text-xl font-semibold">
                {isLoading ? "Loading…" : org?.company_name ?? "Your Organisation"}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-1">
                {org?.industry && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Layers className="h-3 w-3" />{org.industry}
                  </span>
                )}
                {org?.website && (
                  <a href={org.website} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Globe className="h-3 w-3" />
                    {org.website.replace(/^https?:\/\//, "")}
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm shrink-0">
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums">
                {isLoading ? "—" : workspaces.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {workspaces.length === 1 ? "Workspace" : "Workspaces"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Workspaces ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Workspaces</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Brands or divisions under your organisation — each with its own careers page and pipeline.
            </p>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New workspace
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />)}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-center">
            <LayoutGrid className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-sm">No workspaces yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-5 max-w-xs">
              Create a workspace for each brand, product, or division you hire under.
            </p>
            <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Create workspace
            </Button>
          </div>
        ) : (
          <div className="divide-y border rounded-xl overflow-hidden bg-card">
            {workspaces.map(ws => (
              <WorkspaceRow
                key={ws.id}
                workspace={ws}
                isActive={ws.id === activeOrg?.id}
                onEnter={() => enterWorkspace(ws)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateWorkspaceDialog open={createOpen} onClose={onDialogClose} />
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner", admin: "Admin", recruiter: "Recruiter", viewer: "Viewer",
};

function WorkspaceRow({ workspace, isActive, onEnter }: {
  workspace: OrgRow;
  isActive: boolean;
  onEnter: () => void;
}) {
  const initials = workspace.company_name.slice(0, 2).toUpperCase();

  return (
    <div className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/20 ${isActive ? "bg-muted/20" : ""}`}>
      <div className="h-10 w-10 shrink-0 rounded-lg bg-muted border flex items-center justify-center text-sm font-semibold overflow-hidden">
        {workspace.logo_url
          ? <img src={workspace.logo_url} alt={workspace.company_name} className="h-full w-full object-contain" />
          : initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{workspace.company_name}</p>
          {isActive && (
            <span className="text-[10px] font-semibold bg-foreground text-background rounded-full px-2 py-0.5">
              Active
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{workspace.slug}</p>
      </div>

      <span className="hidden sm:block text-xs text-muted-foreground border border-border rounded-full px-3 py-1 shrink-0">
        {ROLE_LABEL[workspace.role] ?? workspace.role}
      </span>

      {workspace.industry && (
        <span className="hidden lg:block text-xs text-muted-foreground shrink-0">{workspace.industry}</span>
      )}

      <Button
        variant={isActive ? "outline" : "ghost"}
        size="sm"
        className="shrink-0 gap-1.5 text-xs h-8"
        onClick={onEnter}
        disabled={isActive}
      >
        {isActive ? "Current" : <><span>Enter</span><ArrowRight className="h-3 w-3" /></>}
      </Button>
    </div>
  );
}
