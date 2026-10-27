"use server";

import { requireRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleMyInscription(
  missionId: string
): Promise<{ ok: true; inscrit: boolean } | { ok: false }> {
  const session = await requireRole("benevole");
  const supabase = getServiceClient();

  const { data: existing } = await supabase
    .from("match_mission_inscriptions")
    .select("member_id")
    .eq("mission_id", missionId)
    .eq("member_id", session.memberId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("match_mission_inscriptions")
      .delete()
      .eq("mission_id", missionId)
      .eq("member_id", session.memberId);
    if (error) return { ok: false };
    revalidatePath("/missions");
    revalidatePath("/accueil");
    return { ok: true, inscrit: false };
  }

  const { error } = await supabase
    .from("match_mission_inscriptions")
    .insert({ mission_id: missionId, member_id: session.memberId });
  if (error) return { ok: false };

  revalidatePath("/missions");
  revalidatePath("/accueil");
  return { ok: true, inscrit: true };
}
