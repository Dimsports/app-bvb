"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { generateCode, hashCode, codeLengthForRoles } from "@/lib/auth/codes";
import { ROLES } from "@/lib/members/roles";
import { revalidatePath } from "next/cache";

const createMemberSchema = z.object({
  prenom: z.string().trim().min(1, "Prénom requis").max(100),
  nom: z.string().trim().min(1, "Nom requis").max(100),
  roles: z.array(z.enum(ROLES)).min(1, "Choisissez au moins un rôle"),
});

export type CreateMemberResult =
  | { ok: true; code: string; codeLength: number }
  | { ok: false; error: string };

export async function createMember(input: {
  prenom: string;
  nom: string;
  roles: string[];
}): Promise<CreateMemberResult> {
  await requireRole("admin");

  const parsed = createMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { prenom, nom, roles } = parsed.data;
  const codeLength = codeLengthForRoles(roles);
  const code = generateCode(codeLength);
  const codeHash = await hashCode(code);

  const supabase = getServiceClient();
  const { error } = await supabase.from("members").insert({
    prenom,
    nom,
    roles,
    code_hash: codeHash,
    code_length: codeLength,
  });

  if (error) {
    console.error("createMember error", error);
    return { ok: false, error: "Erreur lors de la création du membre." };
  }

  revalidatePath("/admin/membres");
  return { ok: true, code, codeLength };
}

export type ResetCodeResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

export async function resetMemberCode(memberId: string): Promise<ResetCodeResult> {
  await requireRole("admin");

  const supabase = getServiceClient();
  const { data: member, error: fetchError } = await supabase
    .from("members")
    .select("id, roles")
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

  revalidatePath("/admin/membres");
  return { ok: true, code };
}

export async function deleteMember(memberId: string): Promise<{ ok: boolean }> {
  await requireRole("admin");

  const supabase = getServiceClient();
  const { error } = await supabase.from("members").delete().eq("id", memberId);

  if (error) {
    console.error("deleteMember error", error);
    return { ok: false };
  }

  revalidatePath("/admin/membres");
  return { ok: true };
}
