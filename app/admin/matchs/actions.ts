"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { parseFfbbWorkbook, type ParsedMatchRow } from "@/lib/matches/parse";
import { revalidatePath } from "next/cache";

export type PreviewResult =
  | { ok: true; rows: ParsedMatchRow[]; skipped: number }
  | { ok: false; error: string };

export async function previewImport(formData: FormData): Promise<PreviewResult> {
  await requireRole("admin");

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Fichier manquant." };
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    return { ok: false, error: "Impossible de lire le fichier." };
  }

  const { rows, skipped } = parseFfbbWorkbook(buffer);
  if (rows.length === 0) {
    return {
      ok: false,
      error: "Aucune rencontre reconnue dans ce fichier (format inattendu ou aucun match du club).",
    };
  }

  return { ok: true, rows, skipped };
}

const confirmRowSchema = z.object({
  numero: z.string().min(1),
  division: z.string().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heure: z.string().nullable(),
  salle: z.string().nullable(),
  adversaire: z.string().min(1),
  domicile: z.boolean(),
  teamId: z.string().uuid(),
});

export async function confirmImport(
  rows: Array<z.infer<typeof confirmRowSchema>>
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  await requireRole("admin");

  const parsed = z.array(confirmRowSchema).safeParse(rows);
  if (!parsed.success) {
    return { ok: false, error: "Données d'import invalides." };
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("matches")
    .upsert(
      parsed.data.map((r) => ({
        team_id: r.teamId,
        ffbb_numero: r.numero,
        division: r.division,
        adversaire: r.adversaire,
        domicile: r.domicile,
        date: r.date,
        heure: r.heure,
        salle: r.salle,
      })),
      { onConflict: "ffbb_numero" }
    );

  if (error) {
    console.error("confirmImport error", error);
    return { ok: false, error: "Erreur lors de l'import." };
  }

  revalidatePath("/admin/matchs");
  return { ok: true, count: parsed.data.length };
}

export async function deleteMatch(id: string): Promise<{ ok: boolean }> {
  await requireRole("admin");
  const supabase = getServiceClient();
  const { error } = await supabase.from("matches").delete().eq("id", id);
  if (error) {
    console.error("deleteMatch error", error);
    return { ok: false };
  }
  revalidatePath("/admin/matchs");
  return { ok: true };
}
