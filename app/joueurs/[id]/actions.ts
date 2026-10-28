"use server";

import { requirePlayerAccess, requirePlayerEditor } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePlayerProfile(
  playerId: string,
  profile: {
    date_naissance: string | null;
    poste: string | null;
    contact_nom: string | null;
    contact_telephone: string | null;
    contact_email: string | null;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requirePlayerEditor(playerId);

  const supabase = getServiceClient();
  const { error } = await supabase.from("player_profiles").upsert({
    member_id: playerId,
    date_naissance: profile.date_naissance || null,
    poste: profile.poste?.trim() || null,
    contact_nom: profile.contact_nom?.trim() || null,
    contact_telephone: profile.contact_telephone?.trim() || null,
    contact_email: profile.contact_email?.trim() || null,
  });
  if (error) return { ok: false, error: "Erreur lors de l'enregistrement." };

  revalidatePath(`/joueurs/${playerId}`);
  return { ok: true };
}

export async function addPlayerNote(
  playerId: string,
  contenu: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requirePlayerAccess(playerId);

  const cleanContenu = contenu.trim();
  if (!cleanContenu) return { ok: false, error: "Note vide." };

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("player_notes")
    .insert({ member_id: playerId, author_id: session.memberId, contenu: cleanContenu });
  if (error) return { ok: false, error: "Erreur lors de l'enregistrement." };

  revalidatePath(`/joueurs/${playerId}`);
  return { ok: true };
}

export async function deletePlayerNote(
  playerId: string,
  noteId: string
): Promise<{ ok: boolean }> {
  const session = await requirePlayerAccess(playerId);

  const supabase = getServiceClient();
  const { data: note } = await supabase
    .from("player_notes")
    .select("author_id")
    .eq("id", noteId)
    .maybeSingle();
  if (!note) return { ok: false };

  const canDelete =
    note.author_id === session.memberId ||
    session.roles.includes("admin") ||
    session.roles.includes("entraineur");
  if (!canDelete) return { ok: false };

  const { error } = await supabase.from("player_notes").delete().eq("id", noteId);
  if (error) return { ok: false };

  revalidatePath(`/joueurs/${playerId}`);
  return { ok: true };
}
