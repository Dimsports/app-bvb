"use server";

import { requireRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function isValidStatut(statut: string): statut is "a_faire" | "en_cours" | "fait" {
  return statut === "a_faire" || statut === "en_cours" || statut === "fait";
}

export async function createObjectif(
  titre: string,
  description: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole("entraineur");

  const cleanTitre = titre.trim();
  if (!cleanTitre) return { ok: false, error: "Titre requis." };

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("projet_objectifs")
    .insert({ titre: cleanTitre, description: description.trim() || null });
  if (error) return { ok: false, error: "Erreur lors de la création." };

  revalidatePath("/projet");
  return { ok: true };
}

export async function deleteObjectif(objectifId: string): Promise<{ ok: boolean }> {
  await requireRole("entraineur");

  const supabase = getServiceClient();
  const { error } = await supabase.from("projet_objectifs").delete().eq("id", objectifId);
  if (error) return { ok: false };

  revalidatePath("/projet");
  return { ok: true };
}

export async function createAction(
  objectifId: string,
  input: { titre: string; responsableId: string; echeance: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole("entraineur");

  const cleanTitre = input.titre.trim();
  if (!cleanTitre) return { ok: false, error: "Titre requis." };

  const supabase = getServiceClient();
  const { error } = await supabase.from("projet_actions").insert({
    objectif_id: objectifId,
    titre: cleanTitre,
    responsable_id: input.responsableId || null,
    echeance: input.echeance || null,
  });
  if (error) return { ok: false, error: "Erreur lors de l'ajout." };

  revalidatePath("/projet");
  return { ok: true };
}

export async function updateActionStatut(
  actionId: string,
  statut: string
): Promise<{ ok: boolean }> {
  await requireRole("entraineur");
  if (!isValidStatut(statut)) return { ok: false };

  const supabase = getServiceClient();
  const { error } = await supabase.from("projet_actions").update({ statut }).eq("id", actionId);
  if (error) return { ok: false };

  revalidatePath("/projet");
  return { ok: true };
}

export async function deleteAction(actionId: string): Promise<{ ok: boolean }> {
  await requireRole("entraineur");

  const supabase = getServiceClient();
  const { error } = await supabase.from("projet_actions").delete().eq("id", actionId);
  if (error) return { ok: false };

  revalidatePath("/projet");
  return { ok: true };
}
