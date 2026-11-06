"use server";

import { requireRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/journal/log";
import { revalidatePath } from "next/cache";

export async function updateClubSettings(input: {
  nom: string;
  logoUrl: string;
  saisonDebut: string;
  saisonFin: string;
  gymnases: string;
  categories: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireRole("admin");

  const nom = input.nom.trim();
  if (!nom) return { ok: false, error: "Nom requis." };

  const gymnases = input.gymnases
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  const categories = input.categories
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("club_settings")
    .update({
      nom,
      logo_url: input.logoUrl.trim() || null,
      saison_debut: input.saisonDebut || null,
      saison_fin: input.saisonFin || null,
      gymnases,
      categories,
    })
    .eq("id", 1);

  if (error) return { ok: false, error: "Erreur lors de l'enregistrement." };

  await logAction(session.memberId, "reglages_modifies", nom);

  revalidatePath("/administration/reglages");
  return { ok: true };
}
