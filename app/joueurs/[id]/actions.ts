"use server";

import { requirePlayerEditor } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePlayerProfile(
  playerId: string,
  profile: {
    date_naissance: string | null;
    poste: string | null;
    contact_nom: string | null;
    contact_telephone: string | null;
    contact_email: string | null;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requirePlayerEditor(playerId);

  const supabase = getServiceClient();
  const { error } = await supabase.from("player_profiles").upsert({
    member_id: playerId,
    date_naissance: profile.date_naissance || null,
    poste: profile.poste?.trim() || null,
    contact_nom: profile.contact_nom?.trim() || null,
    contact_telephone: profile.contact_telephone?.trim() || null,
    contact_email: profile.contact_email?.trim() || null,
  });
  if (error) return { ok: false, error: "Erreur lors de l'enregistrement." };

  revalidatePath(`/joueurs/${playerId}`);
  return { ok: true };
}
