"use server";

import { z } from "zod";
import { requireRole, requireAnyRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { getExercises, type Exercise } from "@/lib/exercises/queries";
import { revalidatePath } from "next/cache";

async function requireBvbBookEditor() {
  return requireRole("entraineur");
}

const competenceSchema = z.object({
  nom: z.string().trim().min(1, "Nom requis").max(200),
  domainId: z.string().uuid("Domaine requis"),
  categories: z.array(z.string().trim().min(1).max(20)).max(10),
  description: z.string().trim().max(2000).optional(),
  criteres: z.string().trim().max(2000).optional(),
  exerciseIds: z.array(z.string().uuid()).max(50),
});

export type CompetenceInput = {
  nom: string;
  domainId: string;
  categories: string[];
  description: string;
  criteres: string;
  exerciseIds: string[];
};

async function syncCompetenceExercises(competenceId: string, exerciseIds: string[]) {
  const supabase = getServiceClient();
  await supabase.from("competence_exercises").delete().eq("competence_id", competenceId);
  if (exerciseIds.length > 0) {
    await supabase
      .from("competence_exercises")
      .insert(exerciseIds.map((exerciseId) => ({ competence_id: competenceId, exercise_id: exerciseId })));
  }
}

export async function createCompetence(
  input: CompetenceInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireBvbBookEditor();

  const parsed = competenceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("competences")
    .insert({
      nom: parsed.data.nom,
      domain_id: parsed.data.domainId,
      categories: parsed.data.categories,
      description: parsed.data.description || null,
      criteres: parsed.data.criteres || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createCompetence error", error);
    return { ok: false, error: "Erreur lors de la création." };
  }

  await syncCompetenceExercises(data.id, parsed.data.exerciseIds);

  revalidatePath("/bvb-book");
  return { ok: true, id: data.id };
}

export async function updateCompetence(
  id: string,
  input: CompetenceInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireBvbBookEditor();

  const parsed = competenceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("competences")
    .update({
      nom: parsed.data.nom,
      domain_id: parsed.data.domainId,
      categories: parsed.data.categories,
      description: parsed.data.description || null,
      criteres: parsed.data.criteres || null,
    })
    .eq("id", id);

  if (error) {
    console.error("updateCompetence error", error);
    return { ok: false, error: "Erreur lors de la mise à jour." };
  }

  await syncCompetenceExercises(id, parsed.data.exerciseIds);

  revalidatePath(`/bvb-book/${id}`);
  revalidatePath("/bvb-book");
  return { ok: true };
}

export async function deleteCompetence(id: string): Promise<{ ok: boolean }> {
  await requireBvbBookEditor();

  const supabase = getServiceClient();
  const { error } = await supabase.from("competences").delete().eq("id", id);
  if (error) {
    console.error("deleteCompetence error", error);
    return { ok: false };
  }

  revalidatePath("/bvb-book");
  return { ok: true };
}

const linkSchema = z.string().trim().url().max(500);

export async function setCompetenceLink(
  id: string,
  url: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireBvbBookEditor();

  if (!url.trim()) {
    const supabase = getServiceClient();
    await supabase.from("competences").update({ media_type: null, media_url: null, media_platform: null }).eq("id", id);
    revalidatePath(`/bvb-book/${id}`);
    return { ok: true };
  }

  const parsed = linkSchema.safeParse(url);
  if (!parsed.success) {
    return { ok: false, error: "Lien invalide." };
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("competences")
    .update({ media_type: "lien", media_url: parsed.data, media_platform: null })
    .eq("id", id);

  if (error) {
    console.error("setCompetenceLink error", error);
    return { ok: false, error: "Erreur lors de l'enregistrement." };
  }

  revalidatePath(`/bvb-book/${id}`);
  return { ok: true };
}

export async function searchExercisesForCompetence(query: string): Promise<Exercise[]> {
  await requireAnyRole(["entraineur", "coach"]);
  if (query.trim().length < 2) return [];
  return getExercises({ query });
}
