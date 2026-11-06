"use server";

import { requireRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { isModule } from "@/lib/features/queries";
import { ROLES } from "@/lib/members/roles";
import { logAction } from "@/lib/journal/log";
import { revalidatePath } from "next/cache";

export async function updateFeature(
  module: string,
  input: { enabled: boolean; roles: string[] }
): Promise<{ ok: boolean }> {
  const session = await requireRole("admin");
  if (!isModule(module)) return { ok: false };

  const roles = input.roles.filter((r) => (ROLES as readonly string[]).includes(r));

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("club_features")
    .update({ enabled: input.enabled, roles })
    .eq("module", module);

  if (error) return { ok: false };

  await logAction(session.memberId, "fonctionnalite_modifiee", `${module} : ${input.enabled ? "activé" : "désactivé"} (${roles.join(", ") || "aucun rôle"})`);

  revalidatePath("/administration/fonctionnalites");
  return { ok: true };
}
