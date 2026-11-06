import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export type Theme = {
  id: string;
  nom: string;
};

export type ThemeFamily = {
  id: string;
  nom: string;
  themes: Theme[];
};

export async function getThemeFamilies(): Promise<ThemeFamily[]> {
  const supabase = getServiceClient();
  const [{ data: families }, { data: themes }] = await Promise.all([
    supabase.from("theme_families").select("id, nom, ordre").order("ordre", { ascending: true }),
    supabase.from("themes").select("id, nom, ordre, family_id").order("ordre", { ascending: true }),
  ]);

  return (families ?? []).map((f) => ({
    id: f.id,
    nom: f.nom,
    themes: (themes ?? [])
      .filter((t) => t.family_id === f.id)
      .map((t) => ({ id: t.id, nom: t.nom })),
  }));
}
