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

export async function updateBenevoleProfile(fields: {
  contact_telephone: string | null;
  contact_email: string | null;
  disponibilites: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireRole("benevole");
  const supabase = getServiceClient();

  const { error } = await supabase.from("benevole_profiles").upsert({
    member_id: session.memberId,
    contact_telephone: fields.contact_telephone?.trim() || null,
    contact_email: fields.contact_email?.trim() || null,
    disponibilites: fields.disponibilites?.trim() || null,
  });
  if (error) return { ok: false, error: "Erreur lors de l'enregistrement." };

  revalidatePath("/missions");
  return { ok: true };
}
