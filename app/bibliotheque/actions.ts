"use server";

import { z } from "zod";
import { requireAnyRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { PARTIES } from "@/lib/exercises/constants";
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
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
});

export type ExerciseInput = {
  titre: string;
  partie: string;
  dureeDefautMinutes: string;
  consignes: string;
  tags: string[];
};

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
      tags: parsed.data.tags,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createExercise error", error);
    return { ok: false, error: "Erreur lors de la création." };
  }

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
      tags: parsed.data.tags,
    })
    .eq("id", id);

  if (error) {
    console.error("updateExercise error", error);
    return { ok: false, error: "Erreur lors de la mise à jour." };
  }

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

export async function searchTags(query: string): Promise<string[]> {
  await requireAnyRole(["entraineur", "coach"]);
  const supabase = getServiceClient();
  const { data } = await supabase.from("exercises").select("tags");
  const set = new Set<string>();
  for (const row of data ?? []) {
    for (const tag of row.tags ?? []) {
      if (tag.toLowerCase().includes(query.trim().toLowerCase())) set.add(tag);
    }
  }
  return [...set].sort().slice(0, 10);
}
