"use server";

import { z } from "zod";
import { requireTeamStaff } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { NIVEAUX } from "@/lib/competences/constants";
import { revalidatePath } from "next/cache";

const itemSchema = z.object({
  competenceId: z.string().uuid(),
  niveau: z.enum(NIVEAUX),
  commentaire: z.string().trim().max(1000).optional(),
});

const createEvaluationSchema = z.object({
  playerId: z.string().uuid(),
  periode: z.string().trim().min(1).max(100),
  items: z.array(itemSchema).min(1),
  commentaireGeneral: z.string().trim().max(2000).optional(),
});

export async function createEvaluation(
  teamId: string,
  input: {
    playerId: string;
    periode: string;
    items: { competenceId: string; niveau: string; commentaire: string }[];
    commentaireGeneral: string;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireTeamStaff(teamId);

  const parsed = createEvaluationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = getServiceClient();
  const { data: evaluation, error } = await supabase
    .from("evaluations")
    .insert({
      player_id: parsed.data.playerId,
      team_id: teamId,
      periode: parsed.data.periode,
      auteur_id: session.memberId,
      commentaire_general: parsed.data.commentaireGeneral || null,
    })
    .select("id")
    .single();

  if (error || !evaluation) {
    console.error("createEvaluation error", error);
    return { ok: false, error: "Erreur lors de l'enregistrement." };
  }

  const { error: itemsError } = await supabase.from("evaluation_items").insert(
    parsed.data.items.map((it) => ({
      evaluation_id: evaluation.id,
      competence_id: it.competenceId,
      niveau: it.niveau,
      commentaire: it.commentaire || null,
    }))
  );

  if (itemsError) {
    console.error("createEvaluation items error", itemsError);
    return { ok: false, error: "Erreur lors de l'enregistrement des compétences." };
  }

  revalidatePath(`/joueurs/${parsed.data.playerId}`);
  revalidatePath(`/equipes/${teamId}`);
  return { ok: true };
}
