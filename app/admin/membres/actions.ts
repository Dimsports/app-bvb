"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { generateCode, hashCode, codeLengthForRoles } from "@/lib/auth/codes";
import { ROLES } from "@/lib/members/roles";
import { logAction } from "@/lib/journal/log";
import { revalidatePath } from "next/cache";

const staffTeamSchema = z.object({
  teamId: z.string().uuid(),
  role: z.enum(["entraineur", "coach"]),
});

const createMemberSchema = z.object({
  prenom: z.string().trim().min(1, "Prénom requis").max(100),
  nom: z.string().trim().min(1, "Nom requis").max(100),
  roles: z.array(z.enum(ROLES)).min(1, "Choisissez au moins un rôle"),
  dateNaissance: z.string().trim().min(1).optional().nullable(),
  teamId: z.string().uuid().optional().nullable(),
  staffTeams: z.array(staffTeamSchema).optional(),
});

export type CreateMemberResult =
  | { ok: true; id: string; code: string; codeLength: number }
  | { ok: false; error: string };

export async function createMember(input: {
  prenom: string;
  nom: string;
  roles: string[];
  dateNaissance?: string | null;
  teamId?: string | null;
  staffTeams?: { teamId: string; role: string }[];
}): Promise<CreateMemberResult> {
  const session = await requireRole("admin");

  const parsed = createMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { prenom, nom, roles, dateNaissance, teamId, staffTeams } = parsed.data;
  const codeLength = codeLengthForRoles(roles);
  const code = generateCode(codeLength);
  const codeHash = await hashCode(code);

  const supabase = getServiceClient();
  const { data: member, error } = await supabase
    .from("members")
    .insert({
      prenom,
      nom,
      roles,
      code_hash: codeHash,
      code_length: codeLength,
    })
    .select("id")
    .single();

  if (error || !member) {
    console.error("createMember error", error);
    return { ok: false, error: "Erreur lors de la création du membre." };
  }

  const touchedTeamIds = new Set<string>();

  if (roles.includes("joueur")) {
    if (dateNaissance) {
      await supabase
        .from("player_profiles")
        .insert({ member_id: member.id, date_naissance: dateNaissance });
    }
    if (teamId) {
      const { error: rosterError } = await supabase
        .from("team_roster")
        .insert({ team_id: teamId, member_id: member.id });
      if (rosterError) console.error("createMember addRosterMember error", rosterError);
      else touchedTeamIds.add(teamId);
    }
  }

  if ((roles.includes("entraineur") || roles.includes("coach")) && staffTeams?.length) {
    for (const { teamId: staffTeamId, role } of staffTeams) {
      const { error: staffError } = await supabase
        .from("team_staff")
        .insert({ team_id: staffTeamId, member_id: member.id, role });
      if (staffError) console.error("createMember addStaff error", staffError);
      else touchedTeamIds.add(staffTeamId);
    }
  }

  await logAction(
    session.memberId,
    "membre_cree",
    `${prenom} ${nom} (${roles.join(", ")})${touchedTeamIds.size ? ` — ${touchedTeamIds.size} équipe(s)` : ""}`
  );

  revalidatePath("/admin/membres");
  for (const id of touchedTeamIds) {
    revalidatePath(`/admin/equipes/${id}`);
  }

  return { ok: true, id: member.id, code, codeLength };
}

export type ResetCodeResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

export async function resetMemberCode(memberId: string): Promise<ResetCodeResult> {
  const session = await requireRole("admin");

  const supabase = getServiceClient();
  const { data: member, error: fetchError } = await supabase
    .from("members")
    .select("id, prenom, nom, roles")
    .eq("id", memberId)
    .maybeSingle();

  if (fetchError || !member) {
    return { ok: false, error: "Membre introuvable." };
  }

  const codeLength = codeLengthForRoles(member.roles);
  const code = generateCode(codeLength);
  const codeHash = await hashCode(code);

  const { error } = await supabase
    .from("members")
    .update({
      code_hash: codeHash,
      code_length: codeLength,
      failed_attempts: 0,
      locked_until: null,
      must_change_code: true,
    })
    .eq("id", memberId);

  if (error) {
    console.error("resetMemberCode error", error);
    return { ok: false, error: "Erreur lors de la réinitialisation." };
  }

  await logAction(session.memberId, "code_reinitialise", `${member.prenom} ${member.nom}`);

  revalidatePath("/admin/membres");
  return { ok: true, code };
}

export async function deleteMember(memberId: string): Promise<{ ok: boolean }> {
  const session = await requireRole("admin");

  const supabase = getServiceClient();
  const { data: member } = await supabase
    .from("members")
    .select("prenom, nom")
    .eq("id", memberId)
    .maybeSingle();

  const { error } = await supabase.from("members").delete().eq("id", memberId);

  if (error) {
    console.error("deleteMember error", error);
    return { ok: false };
  }

  if (member) {
    await logAction(session.memberId, "membre_supprime", `${member.prenom} ${member.nom}`);
  }

  revalidatePath("/admin/membres");
  return { ok: true };
}
