"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/journal/log";
import { revalidatePath } from "next/cache";

const nomSchema = z.string().trim().min(1, "Nom requis").max(100);

export async function addTheme(familyId: string, nom: string): Promise<{ ok: boolean }> {
  const session = await requireRole("admin");

  const parsed = nomSchema.safeParse(nom);
  if (!parsed.success) return { ok: false };

  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from("themes")
    .select("ordre")
    .eq("family_id", familyId)
    .order("ordre", { ascending: false })
    .limit(1);

  const ordre = (existing?.[0]?.ordre ?? 0) + 1;

  const { error } = await supabase.from("themes").insert({ family_id: familyId, nom: parsed.data, ordre });
  if (error) {
    console.error("addTheme error", error);
    return { ok: false };
  }

  await logAction(session.memberId, "thematique_ajoutee", parsed.data);
  revalidatePath("/administration/thematiques");
  return { ok: true };
}

export async function renameTheme(themeId: string, nom: string): Promise<{ ok: boolean }> {
  const session = await requireRole("admin");

  const parsed = nomSchema.safeParse(nom);
  if (!parsed.success) return { ok: false };

  const supabase = getServiceClient();
  const { error } = await supabase.from("themes").update({ nom: parsed.data }).eq("id", themeId);
  if (error) {
    console.error("renameTheme error", error);
    return { ok: false };
  }

  await logAction(session.memberId, "thematique_renommee", parsed.data);
  revalidatePath("/administration/thematiques");
  return { ok: true };
}

export async function deleteTheme(themeId: string): Promise<{ ok: boolean }> {
  const session = await requireRole("admin");

  const supabase = getServiceClient();
  const { data: theme } = await supabase.from("themes").select("nom").eq("id", themeId).maybeSingle();
  const { error } = await supabase.from("themes").delete().eq("id", themeId);
  if (error) {
    console.error("deleteTheme error", error);
    return { ok: false };
  }

  await logAction(session.memberId, "thematique_supprimee", theme?.nom);
  revalidatePath("/administration/thematiques");
  return { ok: true };
}
