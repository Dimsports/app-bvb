"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { parseImportFile } from "@/lib/members/import-parse";
import { generateCode, hashCode, codeLengthForRoles } from "@/lib/auth/codes";
import { ROLES } from "@/lib/members/roles";
import { logAction } from "@/lib/journal/log";
import { revalidatePath } from "next/cache";

export async function previewImportFile(
  formData: FormData
): Promise<{ ok: true; headers: string[]; rows: string[][] } | { ok: false; error: string }> {
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

  const isCsv = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
  const { headers, rows } = parseImportFile(buffer, isCsv);
  if (headers.length === 0 || rows.length === 0) {
    return { ok: false, error: "Aucune ligne reconnue dans ce fichier." };
  }

  return { ok: true, headers, rows };
}

const importableRoles = ROLES.filter((r) => r !== "admin") as [string, ...string[]];

const importRowSchema = z.object({
  nom: z.string().trim().min(1),
  prenom: z.string().trim().min(1),
  roles: z.array(z.enum(importableRoles)).min(1),
  dateNaissance: z.string().nullable(),
  teamId: z.string().uuid().nullable(),
  compteParent: z.boolean(),
  telephoneParent: z.string(),
});

export type ImportRowInput = z.infer<typeof importRowSchema>;

export type ImportResultRow = {
  prenom: string;
  nom: string;
  roles: string[];
  code: string;
  codeLength: number;
};

export async function confirmImportRows(
  rows: ImportRowInput[]
): Promise<{ ok: true; created: ImportResultRow[] } | { ok: false; error: string }> {
  const session = await requireRole("admin");

  const parsed = z.array(importRowSchema).min(1).max(1000).safeParse(rows);
  if (!parsed.success) {
    return { ok: false, error: "Données d'import invalides." };
  }

  const supabase = getServiceClient();

  const prepared = await Promise.all(
    parsed.data.map(async (r) => {
      const codeLength = codeLengthForRoles(r.roles);
      const code = generateCode(codeLength);
      const codeHash = await hashCode(code);
      return { ...r, code, codeLength, codeHash };
    })
  );

  const { data: inserted, error } = await supabase
    .from("members")
    .insert(
      prepared.map((r) => ({
        prenom: r.prenom,
        nom: r.nom,
        roles: r.roles,
        code_hash: r.codeHash,
        code_length: r.codeLength,
        must_change_code: true,
      }))
    )
    .select("id, prenom, nom");

  if (error || !inserted || inserted.length !== prepared.length) {
    console.error("confirmImportRows members insert error", error);
    return { ok: false, error: "Erreur lors de la création des membres." };
  }

  const playerProfileRows: {
    member_id: string;
    date_naissance: string | null;
    contact_telephone: string | null;
    compte_tenu_par_parent: boolean;
  }[] = [];
  const teamRosterRows: { team_id: string; member_id: string }[] = [];
  const teamStaffRows: { team_id: string; member_id: string; role: string }[] = [];

  inserted.forEach((member, i) => {
    const r = prepared[i];
    if (r.roles.includes("joueur")) {
      playerProfileRows.push({
        member_id: member.id,
        date_naissance: r.dateNaissance,
        contact_telephone: r.telephoneParent || null,
        compte_tenu_par_parent: r.compteParent,
      });
      if (r.teamId) teamRosterRows.push({ team_id: r.teamId, member_id: member.id });
    }
    if (r.teamId) {
      for (const role of r.roles.filter((x): x is "entraineur" | "coach" => x === "entraineur" || x === "coach")) {
        teamStaffRows.push({ team_id: r.teamId, member_id: member.id, role });
      }
    }
  });

  if (playerProfileRows.length) await supabase.from("player_profiles").insert(playerProfileRows);
  if (teamRosterRows.length) await supabase.from("team_roster").insert(teamRosterRows);
  if (teamStaffRows.length) await supabase.from("team_staff").insert(teamStaffRows);

  await logAction(session.memberId, "import_licencies", `${inserted.length} membre(s) importé(s)`);

  revalidatePath("/admin/membres");
  revalidatePath("/admin/equipes");

  const created: ImportResultRow[] = inserted.map((member, i) => ({
    prenom: member.prenom,
    nom: member.nom,
    roles: prepared[i].roles,
    code: prepared[i].code,
    codeLength: prepared[i].codeLength,
  }));

  return { ok: true, created };
}
