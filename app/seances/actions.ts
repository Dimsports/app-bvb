"use server";

import { z } from "zod";
import { requireTeamEditor, requireAnyRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { getExercises, type Exercise } from "@/lib/exercises/queries";
import type { SeanceBloc } from "@/lib/seances/queries";
import { revalidatePath } from "next/cache";

async function getSeanceTeamId(seanceId: string): Promise<string | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("seances")
    .select("team_id")
    .eq("id", seanceId)
    .maybeSingle();
  return data?.team_id ?? null;
}

const createSchema = z.object({
  teamId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heureDebut: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  heureFin: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  titre: z.string().trim().max(200).optional(),
  cycleId: z.string().uuid().optional().or(z.literal("")),
});

export async function createSeance(input: {
  teamId: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  titre: string;
  cycleId?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Formulaire invalide." };
  }
  await requireTeamEditor(parsed.data.teamId);

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("seances")
    .insert({
      team_id: parsed.data.teamId,
      date: parsed.data.date,
      heure_debut: parsed.data.heureDebut || null,
      heure_fin: parsed.data.heureFin || null,
      titre: parsed.data.titre || null,
      cycle_id: parsed.data.cycleId || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createSeance error", error);
    return { ok: false, error: "Erreur lors de la création." };
  }

  revalidatePath("/seances");
  return { ok: true, id: data.id };
}

export async function updateSeanceInfo(
  seanceId: string,
  input: { date: string; heureDebut: string; heureFin: string; titre: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const teamId = await getSeanceTeamId(seanceId);
  if (!teamId) return { ok: false, error: "Séance introuvable." };
  await requireTeamEditor(teamId);

  const parsed = createSchema.omit({ teamId: true }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Formulaire invalide." };
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("seances")
    .update({
      date: parsed.data.date,
      heure_debut: parsed.data.heureDebut || null,
      heure_fin: parsed.data.heureFin || null,
      titre: parsed.data.titre || null,
    })
    .eq("id", seanceId);

  if (error) {
    console.error("updateSeanceInfo error", error);
    return { ok: false, error: "Erreur lors de la mise à jour." };
  }

  revalidatePath(`/seances/${seanceId}`);
  revalidatePath("/seances");
  return { ok: true };
}

export async function deleteSeance(seanceId: string): Promise<{ ok: boolean }> {
  const teamId = await getSeanceTeamId(seanceId);
  if (!teamId) return { ok: false };
  await requireTeamEditor(teamId);

  const supabase = getServiceClient();
  const { error } = await supabase.from("seances").delete().eq("id", seanceId);
  if (error) {
    console.error("deleteSeance error", error);
    return { ok: false };
  }

  revalidatePath("/seances");
  return { ok: true };
}

export async function addBloc(
  seanceId: string,
  exerciceId: string
): Promise<{ ok: true; bloc: SeanceBloc } | { ok: false; error: string }> {
  const teamId = await getSeanceTeamId(seanceId);
  if (!teamId) return { ok: false, error: "Séance introuvable." };
  await requireTeamEditor(teamId);

  const supabase = getServiceClient();

  const [{ data: existing }, { data: exercise }] = await Promise.all([
    supabase.from("seance_blocs").select("ordre").eq("seance_id", seanceId).order("ordre", { ascending: false }).limit(1),
    supabase
      .from("exercises")
      .select("titre, partie, consignes, duree_defaut_minutes, media_type, media_url, media_platform")
      .eq("id", exerciceId)
      .maybeSingle(),
  ]);

  if (!exercise) return { ok: false, error: "Exercice introuvable." };

  const nextOrdre = (existing?.[0]?.ordre ?? 0) + 1;
  const duree = exercise.duree_defaut_minutes ?? 10;

  const { data, error } = await supabase
    .from("seance_blocs")
    .insert({
      seance_id: seanceId,
      exercice_id: exerciceId,
      ordre: nextOrdre,
      duree_minutes: duree,
      titre: exercise.titre,
      partie: exercise.partie,
      consignes: exercise.consignes,
      media_type: exercise.media_type,
      media_url: exercise.media_url,
      media_platform: exercise.media_platform,
    })
    .select("id, ordre, duree_minutes, titre, partie, consignes, media_type, media_url, media_platform")
    .single();

  if (error || !data) {
    console.error("addBloc error", error);
    return { ok: false, error: "Erreur lors de l'ajout." };
  }

  revalidatePath(`/seances/${seanceId}`);
  return {
    ok: true,
    bloc: {
      id: data.id,
      ordre: data.ordre,
      duree_minutes: data.duree_minutes,
      exercice: {
        id: exerciceId,
        titre: data.titre,
        partie: data.partie,
        consignes: data.consignes,
        media_type: data.media_type,
        media_url: data.media_url,
        media_platform: data.media_platform,
      },
    },
  };
}

export async function removeBloc(seanceId: string, blocId: string): Promise<{ ok: boolean }> {
  const teamId = await getSeanceTeamId(seanceId);
  if (!teamId) return { ok: false };
  await requireTeamEditor(teamId);

  const supabase = getServiceClient();
  const { error } = await supabase.from("seance_blocs").delete().eq("id", blocId);
  if (error) {
    console.error("removeBloc error", error);
    return { ok: false };
  }

  revalidatePath(`/seances/${seanceId}`);
  return { ok: true };
}

export async function updateBlocDuration(
  seanceId: string,
  blocId: string,
  minutes: number
): Promise<{ ok: boolean }> {
  const teamId = await getSeanceTeamId(seanceId);
  if (!teamId) return { ok: false };
  await requireTeamEditor(teamId);

  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) return { ok: false };

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("seance_blocs")
    .update({ duree_minutes: minutes })
    .eq("id", blocId);

  if (error) {
    console.error("updateBlocDuration error", error);
    return { ok: false };
  }

  revalidatePath(`/seances/${seanceId}`);
  return { ok: true };
}

export async function updateBlocConsignes(
  seanceId: string,
  blocId: string,
  consignes: string
): Promise<{ ok: boolean }> {
  const teamId = await getSeanceTeamId(seanceId);
  if (!teamId) return { ok: false };
  await requireTeamEditor(teamId);

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("seance_blocs")
    .update({ consignes: consignes.trim() || null })
    .eq("id", blocId);

  if (error) {
    console.error("updateBlocConsignes error", error);
    return { ok: false };
  }

  revalidatePath(`/seances/${seanceId}`);
  return { ok: true };
}

export async function reorderBlocs(
  seanceId: string,
  orderedBlocIds: string[]
): Promise<{ ok: boolean }> {
  const teamId = await getSeanceTeamId(seanceId);
  if (!teamId) return { ok: false };
  await requireTeamEditor(teamId);

  const supabase = getServiceClient();
  const results = await Promise.all(
    orderedBlocIds.map((blocId, index) =>
      supabase.from("seance_blocs").update({ ordre: index + 1 }).eq("id", blocId)
    )
  );

  if (results.some((r) => r.error)) {
    console.error("reorderBlocs error", results.find((r) => r.error)?.error);
    return { ok: false };
  }

  revalidatePath(`/seances/${seanceId}`);
  return { ok: true };
}

export async function searchExercisesForSeance(query: string): Promise<Exercise[]> {
  await requireAnyRole(["entraineur", "coach"]);
  if (query.trim().length < 2) return [];
  return getExercises({ query });
}
