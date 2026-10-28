import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export type PlayerNote = {
  id: string;
  contenu: string;
  created_at: string;
  author_id: string;
  author: { prenom: string; nom: string } | null;
};

export async function getNotesForPlayer(playerId: string): Promise<PlayerNote[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("player_notes")
    .select("id, contenu, created_at, author_id, members!player_notes_author_id_fkey(prenom, nom)")
    .eq("member_id", playerId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    contenu: row.contenu,
    created_at: row.created_at,
    author_id: row.author_id,
    author: row.members as unknown as PlayerNote["author"],
  }));
}
