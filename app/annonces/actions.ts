"use server";

import { requireRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { sendPushToAll } from "@/lib/push/send";
import { revalidatePath } from "next/cache";

export async function createAnnonce(
  titre: string,
  contenu: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireRole("entraineur");

  const cleanTitre = titre.trim();
  const cleanContenu = contenu.trim();
  if (!cleanTitre || !cleanContenu) return { ok: false, error: "Titre et message requis." };

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("annonces")
    .insert({ titre: cleanTitre, contenu: cleanContenu, author_id: session.memberId });
  if (error) return { ok: false, error: "Erreur lors de la publication." };

  revalidatePath("/annonces");
  revalidatePath("/accueil");

  try {
    await sendPushToAll({
      title: cleanTitre,
      body: cleanContenu.length > 120 ? `${cleanContenu.slice(0, 117)}…` : cleanContenu,
      url: "/annonces",
    });
  } catch (err) {
    console.error("sendPushToAll error", err);
  }

  return { ok: true };
}

export async function deleteAnnonce(annonceId: string): Promise<{ ok: boolean }> {
  await requireRole("entraineur");

  const supabase = getServiceClient();
  const { error } = await supabase.from("annonces").delete().eq("id", annonceId);
  if (error) return { ok: false };

  revalidatePath("/annonces");
  revalidatePath("/accueil");
  return { ok: true };
}
