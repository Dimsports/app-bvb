import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { isModule, type ClubFeature, type Module } from "./constants";

export { MODULES, MODULE_LABELS, isModule, type Module, type ClubFeature } from "./constants";

export async function getClubFeatures(): Promise<ClubFeature[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("club_features")
    .select("module, enabled, roles")
    .order("module", { ascending: true });

  return (data ?? []).filter((row): row is ClubFeature => isModule(row.module));
}

export async function isModuleAllowedForMember(
  module: ClubFeature["module"],
  memberId: string,
  roles: string[]
): Promise<boolean> {
  if (roles.includes("admin")) return true;

  const supabase = getServiceClient();

  const { data: override } = await supabase
    .from("member_feature_overrides")
    .select("granted")
    .eq("member_id", memberId)
    .eq("module", module)
    .maybeSingle();

  if (override) return override.granted;

  const { data } = await supabase
    .from("club_features")
    .select("enabled, roles")
    .eq("module", module)
    .maybeSingle();

  if (!data || !data.enabled) return false;
  return roles.some((r) => data.roles.includes(r));
}

export type MemberOverride = { module: Module; granted: boolean };

export async function getMemberOverrides(memberId: string): Promise<MemberOverride[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("member_feature_overrides")
    .select("module, granted")
    .eq("member_id", memberId);

  return (data ?? []).filter((row): row is MemberOverride => isModule(row.module));
}
