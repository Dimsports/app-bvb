"use server";

import { requireTeamStaff } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function togglePresence(
  seanceId: string,
  memberId: string
): Promise<{ ok: true; present: boolean } | { ok: false }> {
  const supabase = getServiceClient();

  const { data: seance } = await supabase
    .from("seances")
    .select("team_id")
    .eq("id", seanceId)
    .maybeSingle();
  if (!seance) return { ok: false };

  await requireTeamStaff(seance.team_id);

  const { data: existing } = await supabase
    .from("seance_presences")
    .select("member_id")
    .eq("seance_id", seanceId)
    .eq("member_id", memberId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("seance_presences")
      .delete()
      .eq("seance_id", seanceId)
      .eq("member_id", memberId);
    if (error) return { ok: false };
    revalidatePath(`/seances/${seanceId}/appel`);
    return { ok: true, present: false };
  }

  const { error } = await supabase
    .from("seance_presences")
    .insert({ seance_id: seanceId, member_id: memberId });
  if (error) return { ok: false };

  revalidatePath(`/seances/${seanceId}/appel`);
  return { ok: true, present: true };
}
