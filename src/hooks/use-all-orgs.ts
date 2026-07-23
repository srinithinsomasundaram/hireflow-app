import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OrgEntry = {
  id: string;
  company_name: string;
  slug: string;
  logo_url: string | null;
  parent_org_id: string | null;
  role: string;
};

export function useAllOrgs() {
  return useQuery<OrgEntry[]>({
    queryKey: ["all-orgs"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      // Try with parent_org_id (post-migration), fall back without it
      let roles: unknown[] | null = null;
      let hasParentCol = true;

      const res1 = await supabase
        .from("user_roles")
        .select("organization_id, role, organizations(id, company_name, slug, logo_url, parent_org_id)")
        .eq("user_id", session.user.id)
        .eq("status", "active");

      if (res1.error) {
        hasParentCol = false;
        const res2 = await supabase
          .from("user_roles")
          .select("organization_id, role, organizations(id, company_name, slug, logo_url)")
          .eq("user_id", session.user.id)
          .eq("status", "active");
        roles = res2.data;
      } else {
        roles = res1.data;
      }

      if (!roles || roles.length === 0) return [];

      const all = (roles as unknown[])
        .map((r) => {
          const row = r as { role: string; organizations: { id: string; company_name: string; slug: string; logo_url: string | null; parent_org_id?: string | null } | null };
          if (!row.organizations) return null;
          return { ...row.organizations, parent_org_id: row.organizations.parent_org_id ?? null, role: row.role };
        })
        .filter((x): x is OrgEntry => x !== null);

      if (!hasParentCol) return all;

      // Show only workspaces (orgs with a parent) in the sidebar switcher.
      // Fall back to all orgs for legacy accounts that predate the hierarchy.
      const workspaces = all.filter(o => o.parent_org_id !== null);
      return workspaces.length > 0 ? workspaces : all;
    },
    staleTime: 1000 * 60 * 30,
  });
}
