"use server";

import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";
import { verifyCode } from "@/lib/auth/codes";
import { createSession, rememberMember } from "@/lib/auth/session";
import { redirect } from "next/navigation";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export type MemberSearchResult = {
  id: string;
  prenom: string;
  nom: string;
};

export async function searchMembers(query: string): Promise<MemberSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("members")
    .select("id, prenom, nom")
    .or(`nom.ilike.%${trimmed}%,prenom.ilike.%${trimmed}%`)
    .order("nom", { ascending: true })
    .limit(10);

  if (error) {
    console.error("searchMembers error", error);
    return [];
  }

  return data ?? [];
}

export async function getMemberLoginInfo(id: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("members")
    .select("id, prenom, nom, roles, code_length, locked_until")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const locked = Boolean(
    data.locked_until && new Date(data.locked_until).getTime() > Date.now()
  );

  return { ...data, locked };
}

const verifySchema = z.object({
  memberId: z.string().uuid(),
  code: z.string().regex(/^\d{4}(\d{2})?$/, "Code invalide"),
});

export type VerifyResult =
  | { ok: true }
  | { ok: false; error: string };

export async function verifyMemberCode(input: {
  memberId: string;
  code: string;
}): Promise<VerifyResult> {
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Code invalide." };
  }
  const { memberId, code } = parsed.data;

  const supabase = getServiceClient();
  const { data: member, error } = await supabase
    .from("members")
    .select("id, roles, code_hash, failed_attempts, locked_until")
    .eq("id", memberId)
    .maybeSingle();

  if (error || !member) {
    return { ok: false, error: "Membre introuvable." };
  }

  if (member.locked_until && new Date(member.locked_until).getTime() > Date.now()) {
    const minutes = Math.ceil(
      (new Date(member.locked_until).getTime() - Date.now()) / 60000
    );
    return {
      ok: false,
      error: `Compte bloqué suite à trop d'essais. Réessayez dans ${minutes} min, ou demandez à l'admin de réinitialiser le code.`,
    };
  }

  const matches = await verifyCode(code, member.code_hash);

  if (!matches) {
    const nextAttempts = member.failed_attempts + 1;
    const locked = nextAttempts >= MAX_FAILED_ATTEMPTS;

    await supabase
      .from("members")
      .update({
        failed_attempts: locked ? 0 : nextAttempts,
        locked_until: locked
          ? new Date(Date.now() + LOCK_DURATION_MS).toISOString()
          : null,
      })
      .eq("id", memberId);

    if (locked) {
      return {
        ok: false,
        error: "Trop d'essais. Compte bloqué 15 minutes.",
      };
    }
    const remaining = MAX_FAILED_ATTEMPTS - nextAttempts;
    return { ok: false, error: `Code incorrect (${remaining} essai(s) restant(s)).` };
  }

  await supabase
    .from("members")
    .update({ failed_attempts: 0, locked_until: null })
    .eq("id", memberId);

  await createSession({ memberId: member.id, roles: member.roles });
  await rememberMember(member.id);

  redirect("/accueil");
}
