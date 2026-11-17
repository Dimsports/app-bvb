import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export type Competence = {
  id: string;
  nom: string;
  domainId: string;
  categories: string[];
  description: string | null;
  criteres: string | null;
  media_type: string | null;
  media_url: string | null;
  media_platform: string | null;
  exerciseIds: string[];
};

export type CompetenceDomainGroup = {
  domainId: string;
  domainNom: string;
  competences: Competence[];
};

const SELECT = `
  id, nom, domain_id, categories, description, criteres,
  media_type, media_url, media_platform,
  competence_exercises(exercise_id)
`;

type CompetenceRow = Omit<Competence, "exerciseIds"> & {
  domain_id: string;
  competence_exercises: { exercise_id: string }[];
};

function mapRow(row: CompetenceRow): Competence {
  return {
    id: row.id,
    nom: row.nom,
    domainId: row.domain_id,
    categories: row.categories,
    description: row.description,
    criteres: row.criteres,
    media_type: row.media_type,
    media_url: row.media_url,
    media_platform: row.media_platform,
    exerciseIds: row.competence_exercises.map((e) => e.exercise_id),
  };
}

export async function getBvbBook(filter: { categorie?: string } = {}): Promise<CompetenceDomainGroup[]> {
  const supabase = getServiceClient();

  let q = supabase.from("competences").select(SELECT).order("nom", { ascending: true });
  if (filter.categorie) q = q.contains("categories", [filter.categorie]);

  const [{ data: families }, { data: competencesData }] = await Promise.all([
    supabase.from("theme_families").select("id, nom, ordre").order("ordre", { ascending: true }),
    q,
  ]);

  const competences = (competencesData ?? []).map((row) => mapRow(row as unknown as CompetenceRow));

  return (families ?? []).map((f) => ({
    domainId: f.id,
    domainNom: f.nom,
    competences: competences.filter((c) => c.domainId === f.id),
  }));
}

export async function getCompetence(id: string): Promise<Competence | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("competences").select(SELECT).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapRow(data as unknown as CompetenceRow);
}
