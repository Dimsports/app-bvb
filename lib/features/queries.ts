import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { isModule, type ClubFeature } from "./constants";

export { MODULES, MODULE_LABELS, isModule, type Module, type ClubFeature } from "./constants";

export async function getClubFeatures(): Promise<ClubFeature[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("club_features")
    .select("module, enabled, roles")
    .order("module", { ascending: true });

  return (data ?? []).filter((row): row is ClubFeature => isModule(row.module));
}

export async function isModuleAllowedForRoles(
  module: ClubFeature["module"],
  roles: string[]
): Promise<boolean> {
  if (roles.includes("admin")) return true;

  const supabase = getServiceClient();
  const { data } = await supabase
    .from("club_features")
    .select("enabled, roles")
    .eq("module", module)
    .maybeSingle();

  if (!data || !data.enabled) return false;
  return roles.some((r) => data.roles.includes(r));
}
