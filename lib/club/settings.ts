import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export type ClubSettings = {
  nom: string;
  logo_url: string | null;
  saison_debut: string | null;
  saison_fin: string | null;
  gymnases: string[];
  categories: string[];
};

export async function getClubSettings(): Promise<ClubSettings> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("club_settings")
    .select("nom, logo_url, saison_debut, saison_fin, gymnases, categories")
    .eq("id", 1)
    .maybeSingle();

  return (
    data ?? {
      nom: "BVB Le Poiré - Les Lucs",
      logo_url: null,
      saison_debut: null,
      saison_fin: null,
      gymnases: [],
      categories: ["U9", "U11", "U13", "U15", "U17", "U18"],
    }
  );
}
