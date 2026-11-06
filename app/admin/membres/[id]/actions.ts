"use server";

import { requireRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { getMemberById } from "@/lib/members/get-member";
import { isModule } from "@/lib/features/queries";
import { logAction } from "@/lib/journal/log";
import { revalidatePath } from "next/cache";

export async function setMemberOverride(
  memberId: string,
  module: string,
  granted: boolean | null
): Promise<{ ok: boolean }> {
  const session = await requireRole("admin");
  if (!isModule(module)) return { ok: false };

  const member = await getMemberById(memberId);
  if (!member) return { ok: false };

  const supabase = getServiceClient();

  if (granted === null) {
    const { error } = await supabase
      .from("member_feature_overrides")
      .delete()
      .eq("member_id", memberId)
      .eq("module", module);
    if (error) return { ok: false };
  } else {
    const { error } = await supabase
      .from("member_feature_overrides")
      .upsert({ member_id: memberId, module, granted });
    if (error) return { ok: false };
  }

  const statusLabel = granted === null ? "par défaut (rôle)" : granted ? "toujours autorisé" : "toujours bloqué";
  await logAction(
    session.memberId,
    "acces_membre_modifie",
    `${member.prenom} ${member.nom} — ${module} : ${statusLabel}`
  );

  revalidatePath(`/admin/membres/${memberId}`);
  return { ok: true };
}
