"use server";

import { z } from "zod";
import { requireAnyRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { PARTIES, ESPACES, INTENSITES, OPPOSITIONS } from "@/lib/exercises/constants";
import { detectPlatform } from "@/lib/exercises/media";
import { revalidatePath } from "next/cache";

const STORAGE_BUCKET = "exercise-media";

async function requireLibraryEditor() {
  return requireAnyRole(["entraineur"]);
}

const exerciseSchema = z.object({
  titre: z.string().trim().min(1, "Titre requis").max(200),
  partie: z.enum(PARTIES),
  dureeDefautMinutes: z.coerce.number().int().min(1).max(180).optional().or(z.literal("")),
  consignes: z.string().trim().max(4000).optional(),
  themeIds: z.array(z.string().uuid()).max(50),
  categories: z.array(z.string().trim().min(1).max(20)).max(10),
  nbJoueursMin: z.coerce.number().int().min(1).max(50).optional().or(z.literal("")),
  nbJoueursMax: z.coerce.number().int().min(1).max(50).optional().or(z.literal("")),
  espace: z.enum(ESPACES).optional().or(z.literal("")),
  materiel: z.array(z.string().trim().min(1).max(40)).max(20),
  intensite: z.enum(INTENSITES).optional().or(z.literal("")),
  opposition: z.enum(OPPOSITIONS).optional().or(z.literal("")),
});

export type ExerciseInput = {
  titre: string;
  partie: string;
  dureeDefautMinutes: string;
  consignes: string;
  themeIds: string[];
  categories: string[];
  nbJoueursMin: string;
  nbJoueursMax: string;
  espace: string;
  materiel: string[];
  intensite: string;
  opposition: string;
};

async function syncExerciseThemes(exerciseId: string, themeIds: string[]) {
  const supabase = getServiceClient();
  await supabase.from("exercise_themes").delete().eq("exercise_id", exerciseId);
  if (themeIds.length > 0) {
    await supabase
      .from("exercise_themes")
      .insert(themeIds.map((themeId) => ({ exercise_id: exerciseId, theme_id: themeId })));
  }
}

export async function createExercise(
  input: ExerciseInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireLibraryEditor();

  const parsed = exerciseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("exercises")
    .insert({
      titre: parsed.data.titre,
      partie: parsed.data.partie,
      duree_defaut_minutes: parsed.data.dureeDefautMinutes || null,
      consignes: parsed.data.consignes || null,
      categories: parsed.data.categories,
      nb_joueurs_min: parsed.data.nbJoueursMin || null,
      nb_joueurs_max: parsed.data.nbJoueursMax || null,
      espace: parsed.data.espace || null,
      materiel: parsed.data.materiel,
      intensite: parsed.data.intensite || null,
      opposition: parsed.data.opposition || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createExercise error", error);
    return { ok: false, error: "Erreur lors de la création." };
  }

  await syncExerciseThemes(data.id, parsed.data.themeIds);

  revalidatePath("/bibliotheque");
  return { ok: true, id: data.id };
}

export async function updateExercise(
  id: string,
  input: ExerciseInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireLibraryEditor();

  const parsed = exerciseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("exercises")
    .update({
      titre: parsed.data.titre,
      partie: parsed.data.partie,
      duree_defaut_minutes: parsed.data.dureeDefautMinutes || null,
      consignes: parsed.data.consignes || null,
      categories: parsed.data.categories,
      nb_joueurs_min: parsed.data.nbJoueursMin || null,
      nb_joueurs_max: parsed.data.nbJoueursMax || null,
      espace: parsed.data.espace || null,
      materiel: parsed.data.materiel,
      intensite: parsed.data.intensite || null,
      opposition: parsed.data.opposition || null,
    })
    .eq("id", id);

  if (error) {
    console.error("updateExercise error", error);
    return { ok: false, error: "Erreur lors de la mise à jour." };
  }

  await syncExerciseThemes(id, parsed.data.themeIds);

  revalidatePath(`/bibliotheque/${id}`);
  revalidatePath("/bibliotheque");
  return { ok: true };
}

export async function deleteExercise(id: string): Promise<{ ok: boolean }> {
  await requireLibraryEditor();

  const supabase = getServiceClient();
  await removeStoredMedia(id);
  const { error } = await supabase.from("exercises").delete().eq("id", id);

  if (error) {
    console.error("deleteExercise error", error);
    return { ok: false };
  }

  revalidatePath("/bibliotheque");
  return { ok: true };
}

const linkSchema = z.string().url().max(500);

export async function setExternalLink(
  id: string,
  url: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireLibraryEditor();

  const parsed = linkSchema.safeParse(url);
  if (!parsed.success) {
    return { ok: false, error: "Lien invalide." };
  }

  const platform = detectPlatform(parsed.data);
  const supabase = getServiceClient();
  await removeStoredMedia(id);
  const { error } = await supabase
    .from("exercises")
    .update({ media_type: "lien", media_url: parsed.data, media_platform: platform })
    .eq("id", id);

  if (error) {
    console.error("setExternalLink error", error);
    return { ok: false, error: "Erreur lors de l'enregistrement du lien." };
  }

  revalidatePath(`/bibliotheque/${id}`);
  return { ok: true };
}

export async function uploadMedia(
  id: string,
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireLibraryEditor();

  const file = formData.get("file");
  const kind = formData.get("kind");
  if (!(file instanceof File) || (kind !== "photo" && kind !== "video")) {
    return { ok: false, error: "Fichier invalide." };
  }

  const supabase = getServiceClient();
  await removeStoredMedia(id);

  const extension = kind === "photo" ? "jpg" : file.name.split(".").pop() || "mp4";
  const path = `${id}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type || (kind === "photo" ? "image/jpeg" : "video/mp4"),
      upsert: true,
    });

  if (uploadError) {
    console.error("uploadMedia error", uploadError);
    return { ok: false, error: "Erreur lors de l'envoi du fichier." };
  }

  const { data: publicUrl } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  const { error } = await supabase
    .from("exercises")
    .update({ media_type: kind, media_url: publicUrl.publicUrl, media_platform: null })
    .eq("id", id);

  if (error) {
    console.error("uploadMedia db error", error);
    return { ok: false, error: "Erreur lors de l'enregistrement." };
  }

  revalidatePath(`/bibliotheque/${id}`);
  return { ok: true, url: publicUrl.publicUrl };
}

export async function removeMedia(id: string): Promise<{ ok: boolean }> {
  await requireLibraryEditor();

  const supabase = getServiceClient();
  await removeStoredMedia(id);
  const { error } = await supabase
    .from("exercises")
    .update({ media_type: null, media_url: null, media_platform: null })
    .eq("id", id);

  if (error) {
    console.error("removeMedia error", error);
    return { ok: false };
  }

  revalidatePath(`/bibliotheque/${id}`);
  return { ok: true };
}

async function removeStoredMedia(exerciseId: string) {
  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from("exercises")
    .select("media_type, media_url")
    .eq("id", exerciseId)
    .maybeSingle();

  if (!existing || existing.media_type === "lien" || !existing.media_url) return;

  const path = existing.media_url.split(`${STORAGE_BUCKET}/`)[1];
  if (path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  }
}

export async function searchMateriel(query: string): Promise<string[]> {
  await requireAnyRole(["entraineur", "coach"]);
  const supabase = getServiceClient();
  const { data } = await supabase.from("exercises").select("materiel");
  const set = new Set<string>();
  for (const row of data ?? []) {
    for (const item of row.materiel ?? []) {
      if (item.toLowerCase().includes(query.trim().toLowerCase())) set.add(item);
    }
  }
  return [...set].sort().slice(0, 10);
}
