import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export type Exercise = {
  id: string;
  titre: string;
  partie: string;
  duree_defaut_minutes: number | null;
  consignes: string | null;
  tags: string[];
  media_type: string | null;
  media_url: string | null;
  media_platform: string | null;
};

export async function getExercises(filter: {
  partie?: string;
  query?: string;
}): Promise<Exercise[]> {
  const supabase = getServiceClient();
  let q = supabase
    .from("exercises")
    .select("id, titre, partie, duree_defaut_minutes, consignes, tags, media_type, media_url, media_platform")
    .order("titre", { ascending: true });

  if (filter.partie) q = q.eq("partie", filter.partie);
  if (filter.query && filter.query.trim().length >= 2) {
    q = q.ilike("titre", `%${filter.query.trim()}%`);
  }

  const { data, error } = await q;
  if (error) {
    console.error("getExercises error", error);
    return [];
  }
  return data ?? [];
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, titre, partie, duree_defaut_minutes, consignes, tags, media_type, media_url, media_platform")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function getAllTags(): Promise<string[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("exercises").select("tags");
  if (error || !data) return [];
  const set = new Set<string>();
  for (const row of data) {
    for (const tag of row.tags ?? []) set.add(tag);
  }
  return [...set].sort();
}
