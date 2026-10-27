import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export type SeanceSummary = {
  id: string;
  team_id: string;
  date: string;
  heure_debut: string | null;
  heure_fin: string | null;
  titre: string | null;
  team: { id: string; categorie: string; genre: string; nom: string | null } | null;
  blocCount: number;
  totalMinutes: number;
};

export type SeanceBlocExercice = {
  id: string;
  titre: string;
  partie: string;
  consignes: string | null;
  media_type: string | null;
  media_url: string | null;
  media_platform: string | null;
};

export type SeanceBloc = {
  id: string;
  ordre: number;
  duree_minutes: number;
  exercice: SeanceBlocExercice;
};

export type SeanceDetail = {
  id: string;
  team_id: string;
  date: string;
  heure_debut: string | null;
  heure_fin: string | null;
  titre: string | null;
  team: { id: string; categorie: string; genre: string; nom: string | null } | null;
  blocs: SeanceBloc[];
};

export async function getSeancesForMember(
  memberId: string,
  isAdmin: boolean
): Promise<SeanceSummary[]> {
  const supabase = getServiceClient();

  let teamIds: string[] | null = null;
  if (!isAdmin) {
    const { data: staffRows } = await supabase
      .from("team_staff")
      .select("team_id")
      .eq("member_id", memberId);
    teamIds = (staffRows ?? []).map((r) => r.team_id as string);
    if (teamIds.length === 0) return [];
  }

  let q = supabase
    .from("seances")
    .select("id, team_id, date, heure_debut, heure_fin, titre, teams(id, categorie, genre, nom), seance_blocs(duree_minutes)")
    .order("date", { ascending: true });

  if (teamIds) q = q.in("team_id", teamIds);

  const { data, error } = await q;
  if (error || !data) {
    console.error("getSeancesForMember error", error);
    return [];
  }

  return data.map((row) => {
    const blocs = (row.seance_blocs as unknown as { duree_minutes: number }[]) ?? [];
    return {
      id: row.id,
      team_id: row.team_id,
      date: row.date,
      heure_debut: row.heure_debut,
      heure_fin: row.heure_fin,
      titre: row.titre,
      team: row.teams as unknown as SeanceSummary["team"],
      blocCount: blocs.length,
      totalMinutes: blocs.reduce((sum, b) => sum + (b.duree_minutes ?? 0), 0),
    };
  });
}

export async function getSeanceDetail(id: string): Promise<SeanceDetail | null> {
  const supabase = getServiceClient();

  const { data: seance } = await supabase
    .from("seances")
    .select("id, team_id, date, heure_debut, heure_fin, titre, teams(id, categorie, genre, nom)")
    .eq("id", id)
    .maybeSingle();

  if (!seance) return null;

  const { data: blocRows } = await supabase
    .from("seance_blocs")
    .select("id, ordre, duree_minutes, exercises(id, titre, partie, consignes, media_type, media_url, media_platform)")
    .eq("seance_id", id)
    .order("ordre", { ascending: true });

  const blocs: SeanceBloc[] = (blocRows ?? [])
    .map((row) => ({
      id: row.id,
      ordre: row.ordre,
      duree_minutes: row.duree_minutes,
      exercice: row.exercises as unknown as SeanceBloc["exercice"],
    }))
    .filter((b) => Boolean(b.exercice));

  return {
    id: seance.id,
    team_id: seance.team_id,
    date: seance.date,
    heure_debut: seance.heure_debut,
    heure_fin: seance.heure_fin,
    titre: seance.titre,
    team: seance.teams as unknown as SeanceDetail["team"],
    blocs,
  };
}

export async function getSeancePresences(seanceId: string): Promise<Set<string>> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("seance_presences")
    .select("member_id")
    .eq("seance_id", seanceId);
  return new Set((data ?? []).map((r) => r.member_id as string));
}
