"use server";

import { requireRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function isValidScale(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

export async function submitWellbeing(fields: {
  sommeil: number;
  forme: number;
  courbatures: number;
  moral: number;
  commentaire: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireRole("joueur");

  if (
    !isValidScale(fields.sommeil) ||
    !isValidScale(fields.forme) ||
    !isValidScale(fields.courbatures) ||
    !isValidScale(fields.moral)
  ) {
    return { ok: false, error: "Réponses invalides." };
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from("wellbeing_entries").upsert(
    {
      member_id: session.memberId,
      date: new Date().toISOString().slice(0, 10),
      sommeil: fields.sommeil,
      forme: fields.forme,
      courbatures: fields.courbatures,
      moral: fields.moral,
      commentaire: fields.commentaire.trim() || null,
    },
    { onConflict: "member_id,date" }
  );
  if (error) return { ok: false, error: "Erreur lors de l'enregistrement." };

  revalidatePath("/bien-etre");
  revalidatePath("/accueil");
  return { ok: true };
}
