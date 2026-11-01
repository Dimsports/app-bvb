import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export type Annonce = {
  id: string;
  titre: string;
  contenu: string;
  created_at: string;
  author: { prenom: string; nom: string } | null;
};

export async function getAnnonces(limit = 30): Promise<Annonce[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("annonces")
    .select("id, titre, contenu, created_at, members(prenom, nom)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    titre: row.titre,
    contenu: row.contenu,
    created_at: row.created_at,
    author: row.members as unknown as Annonce["author"],
  }));
}
