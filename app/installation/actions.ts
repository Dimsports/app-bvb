"use server";

import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";
import { generateCode, hashCode } from "@/lib/auth/codes";

const installSchema = z.object({
  token: z.string().min(1),
  prenom: z.string().trim().min(1, "Prénom requis").max(100),
  nom: z.string().trim().min(1, "Nom requis").max(100),
});

export async function installFirstAdmin(input: {
  token: string;
  prenom: string;
  nom: string;
}): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const setupToken = process.env.SETUP_TOKEN;
  if (!setupToken) {
    return { ok: false, error: "Installation non configurée (SETUP_TOKEN manquant)." };
  }

  const parsed = installSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  if (parsed.data.token !== setupToken) {
    return { ok: false, error: "Jeton invalide." };
  }

  const supabase = getServiceClient();
  const { count } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .contains("roles", ["admin"]);

  if (count && count > 0) {
    return { ok: false, error: "Un admin existe déjà." };
  }

  const code = generateCode(6);
  const codeHash = await hashCode(code);
  const { error } = await supabase.from("members").insert({
    prenom: parsed.data.prenom,
    nom: parsed.data.nom,
    roles: ["admin"],
    code_hash: codeHash,
    code_length: 6,
  });

  if (error) {
    console.error("installFirstAdmin error", error);
    return { ok: false, error: "Erreur lors de la création du compte." };
  }

  await supabase.from("club_journal").insert({
    actor_id: null,
    action: "installation",
    details: `Premier compte admin créé : ${parsed.data.prenom} ${parsed.data.nom}`,
  });

  return { ok: true, code };
}
