"use server";

import { requireTeamEditor, requireTeamStaff, requireSession } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { isConvocationStatut } from "@/lib/matches/constants";
import { revalidatePath } from "next/cache";

async function getMatchTeamId(matchId: string): Promise<string | null> {
  const supabase = getServiceClient();
  const { data } = await supabase.from("matches").select("team_id").eq("id", matchId).maybeSingle();
  return data?.team_id ?? null;
}

export async function toggleConvocation(
  matchId: string,
  memberId: string
): Promise<{ ok: true; convoked: boolean } | { ok: false }> {
  const teamId = await getMatchTeamId(matchId);
  if (!teamId) return { ok: false };
  await requireTeamEditor(teamId);

  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from("match_convocations")
    .select("member_id")
    .eq("match_id", matchId)
    .eq("member_id", memberId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("match_convocations")
      .delete()
      .eq("match_id", matchId)
      .eq("member_id", memberId);
    if (error) return { ok: false };
    revalidatePath(`/matchs/${matchId}`);
    return { ok: true, convoked: false };
  }

  const { error } = await supabase
    .from("match_convocations")
    .insert({ match_id: matchId, member_id: memberId, statut: "en_attente" });
  if (error) return { ok: false };

  revalidatePath(`/matchs/${matchId}`);
  return { ok: true, convoked: true };
}

export async function respondConvocation(
  matchId: string,
  statut: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireSession();

  if (!isConvocationStatut(statut) || statut === "en_attente") {
    return { ok: false, error: "Réponse invalide." };
  }

  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from("match_convocations")
    .select("member_id")
    .eq("match_id", matchId)
    .eq("member_id", session.memberId)
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: "Convocation introuvable." };
  }

  const { error } = await supabase
    .from("match_convocations")
    .update({ statut, reponse_at: new Date().toISOString() })
    .eq("match_id", matchId)
    .eq("member_id", session.memberId);

  if (error) {
    return { ok: false, error: "Erreur lors de l'enregistrement." };
  }

  revalidatePath("/accueil");
  revalidatePath(`/matchs/${matchId}`);
  return { ok: true };
}

export async function addMission(
  matchId: string,
  titre: string,
  besoin: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const teamId = await getMatchTeamId(matchId);
  if (!teamId) return { ok: false, error: "Match introuvable." };
  await requireTeamEditor(teamId);

  const cleanTitre = titre.trim();
  if (!cleanTitre) return { ok: false, error: "Titre requis." };
  if (!Number.isInteger(besoin) || besoin < 1 || besoin > 20) {
    return { ok: false, error: "Nombre de bénévoles invalide." };
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("match_missions")
    .insert({ match_id: matchId, titre: cleanTitre, besoin });
  if (error) return { ok: false, error: "Erreur lors de l'ajout." };

  revalidatePath(`/matchs/${matchId}`);
  return { ok: true };
}

export async function removeMission(matchId: string, missionId: string): Promise<{ ok: boolean }> {
  const teamId = await getMatchTeamId(matchId);
  if (!teamId) return { ok: false };
  await requireTeamEditor(teamId);

  const supabase = getServiceClient();
  const { error } = await supabase.from("match_missions").delete().eq("id", missionId);
  if (error) return { ok: false };

  revalidatePath(`/matchs/${matchId}`);
  return { ok: true };
}

export async function updateMatchResult(
  matchId: string,
  scoreBvb: number | null,
  scoreAdversaire: number | null,
  noteCoach: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const teamId = await getMatchTeamId(matchId);
  if (!teamId) return { ok: false, error: "Match introuvable." };
  await requireTeamStaff(teamId);

  for (const score of [scoreBvb, scoreAdversaire]) {
    if (score !== null && (!Number.isInteger(score) || score < 0 || score > 999)) {
      return { ok: false, error: "Score invalide." };
    }
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("matches")
    .update({
      score_bvb: scoreBvb,
      score_adversaire: scoreAdversaire,
      note_coach: noteCoach.trim() || null,
    })
    .eq("id", matchId);
  if (error) return { ok: false, error: "Erreur lors de l'enregistrement." };

  revalidatePath(`/matchs/${matchId}`);
  revalidatePath("/matchs");
  return { ok: true };
}
