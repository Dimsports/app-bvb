import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export type ExerciseTheme = {
  id: string;
  nom: string;
  family_id: string;
  family_nom: string;
};

export type ExerciseAuthor = {
  id: string;
  prenom: string;
  nom: string;
};

export type Exercise = {
  id: string;
  titre: string;
  partie: string;
  duree_defaut_minutes: number | null;
  consignes: string | null;
  categories: string[];
  nb_joueurs_min: number | null;
  nb_joueurs_max: number | null;
  espace: string | null;
  materiel: string[];
  intensite: string | null;
  opposition: string | null;
  media_type: string | null;
  media_url: string | null;
  media_platform: string | null;
  author_id: string | null;
  created_at: string;
  themes: ExerciseTheme[];
  author: ExerciseAuthor | null;
};

const SELECT = `
  id, titre, partie, duree_defaut_minutes, consignes, categories,
  nb_joueurs_min, nb_joueurs_max, espace, materiel, intensite, opposition,
  media_type, media_url, media_platform, author_id, created_at,
  exercise_themes(themes(id, nom, family_id, theme_families(nom))),
  members(id, prenom, nom)
`;

type ExerciseRow = Omit<Exercise, "themes" | "author"> & {
  exercise_themes: {
    themes: { id: string; nom: string; family_id: string; theme_families: { nom: string } | null } | null;
  }[];
  members: ExerciseAuthor | null;
};

function mapRow(row: ExerciseRow): Exercise {
  const { exercise_themes, members, ...rest } = row;
  return {
    ...rest,
    author: members,
    themes: exercise_themes
      .map((et) => et.themes)
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .map((t) => ({
        id: t.id,
        nom: t.nom,
        family_id: t.family_id,
        family_nom: t.theme_families?.nom ?? "",
      })),
  };
}

export async function getExercises(filter: {
  partie?: string;
  query?: string;
  themeId?: string;
  competenceId?: string;
  categorie?: string;
  espace?: string;
  intensite?: string;
  opposition?: string;
  nbJoueurs?: number;
}): Promise<Exercise[]> {
  const supabase = getServiceClient();
  let q = supabase.from("exercises").select(SELECT).order("titre", { ascending: true });

  if (filter.partie) q = q.eq("partie", filter.partie);
  if (filter.query && filter.query.trim().length >= 2) {
    q = q.ilike("titre", `%${filter.query.trim()}%`);
  }
  if (filter.categorie) q = q.contains("categories", [filter.categorie]);
  if (filter.espace) q = q.eq("espace", filter.espace);
  if (filter.intensite) q = q.eq("intensite", filter.intensite);
  if (filter.opposition) q = q.eq("opposition", filter.opposition);
  if (typeof filter.nbJoueurs === "number") {
    q = q
      .or(`nb_joueurs_min.is.null,nb_joueurs_min.lte.${filter.nbJoueurs}`)
      .or(`nb_joueurs_max.is.null,nb_joueurs_max.gte.${filter.nbJoueurs}`);
  }
  if (filter.themeId) {
    const { data: links } = await supabase
      .from("exercise_themes")
      .select("exercise_id")
      .eq("theme_id", filter.themeId);
    const ids = (links ?? []).map((l) => l.exercise_id);
    if (ids.length === 0) return [];
    q = q.in("id", ids);
  }
  if (filter.competenceId) {
    const { data: links } = await supabase
      .from("competence_exercises")
      .select("exercise_id")
      .eq("competence_id", filter.competenceId);
    const ids = (links ?? []).map((l) => l.exercise_id);
    if (ids.length === 0) return [];
    q = q.in("id", ids);
  }

  const { data, error } = await q;
  if (error) {
    console.error("getExercises error", error);
    return [];
  }
  return (data ?? []).map((row) => mapRow(row as unknown as ExerciseRow));
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("exercises").select(SELECT).eq("id", id).maybeSingle();

  if (error || !data) return null;
  return mapRow(data as unknown as ExerciseRow);
}

export async function getExerciseTitles(ids: string[]): Promise<{ id: string; titre: string }[]> {
  if (ids.length === 0) return [];
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("exercises").select("id, titre").in("id", ids);
  if (error) return [];
  return data ?? [];
}

export async function getAllMateriel(): Promise<string[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("exercises").select("materiel");
  if (error || !data) return [];
  const set = new Set<string>();
  for (const row of data) {
    for (const item of row.materiel ?? []) set.add(item);
  }
  return [...set].sort();
}
