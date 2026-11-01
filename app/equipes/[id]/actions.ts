"use server";

import { requireTeamEditor } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCycle(
  teamId: string,
  input: { nom: string; dateDebut: string; dateFin: string; objectif: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireTeamEditor(teamId);

  const nom = input.nom.trim();
  if (!nom) return { ok: false, error: "Nom requis." };
  if (!input.dateDebut || !input.dateFin || input.dateFin < input.dateDebut) {
    return { ok: false, error: "Dates invalides." };
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from("cycles").insert({
    team_id: teamId,
    nom,
    date_debut: input.dateDebut,
    date_fin: input.dateFin,
    objectif: input.objectif.trim() || null,
  });
  if (error) return { ok: false, error: "Erreur lors de la création." };

  revalidatePath(`/equipes/${teamId}`);
  return { ok: true };
}

export async function deleteCycle(teamId: string, cycleId: string): Promise<{ ok: boolean }> {
  await requireTeamEditor(teamId);

  const supabase = getServiceClient();
  const { error } = await supabase.from("cycles").delete().eq("id", cycleId);
  if (error) return { ok: false };

  revalidatePath(`/equipes/${teamId}`);
  return { ok: true };
}
