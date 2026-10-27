import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import type { TeamMember } from "@/lib/teams/queries";

export type Match = {
  id: string;
  team_id: string;
  ffbb_numero: string;
  division: string | null;
  adversaire: string;
  domicile: boolean;
  date: string;
  heure: string | null;
  salle: string | null;
  score_bvb: number | null;
  score_adversaire: number | null;
  note_coach: string | null;
  team: { id: string; categorie: string; genre: string; nom: string | null } | null;
};

export async function getAllMatches(): Promise<Match[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("matches")
    .select(
      "id, team_id, ffbb_numero, division, adversaire, domicile, date, heure, salle, score_bvb, score_adversaire, note_coach, teams(id, categorie, genre, nom)"
    )
    .order("date", { ascending: true });

  return (data ?? []).map((row) => ({
    ...row,
    team: row.teams as unknown as Match["team"],
  }));
}

export async function getMatchesForMember(memberId: string, isAdmin: boolean): Promise<Match[]> {
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
    .from("matches")
    .select(
      "id, team_id, ffbb_numero, division, adversaire, domicile, date, heure, salle, score_bvb, score_adversaire, note_coach, teams(id, categorie, genre, nom)"
    )
    .order("date", { ascending: true });

  if (teamIds) q = q.in("team_id", teamIds);

  const { data } = await q;
  return (data ?? []).map((row) => ({
    ...row,
    team: row.teams as unknown as Match["team"],
  }));
}

export async function getMatchDetail(id: string): Promise<Match | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("matches")
    .select(
      "id, team_id, ffbb_numero, division, adversaire, domicile, date, heure, salle, score_bvb, score_adversaire, note_coach, teams(id, categorie, genre, nom)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  return { ...data, team: data.teams as unknown as Match["team"] };
}

export type ConvocationRow = {
  member: TeamMember;
  statut: string | null;
};

export async function getConvocationsForMatch(
  matchId: string,
  teamId: string
): Promise<ConvocationRow[]> {
  const supabase = getServiceClient();
  const [{ data: rosterRows }, { data: convRows }] = await Promise.all([
    supabase.from("team_roster").select("members(id, prenom, nom, roles)").eq("team_id", teamId),
    supabase.from("match_convocations").select("member_id, statut").eq("match_id", matchId),
  ]);

  const statutByMember = new Map((convRows ?? []).map((r) => [r.member_id, r.statut as string]));
  const roster = (rosterRows ?? [])
    .map((r) => r.members as unknown as TeamMember | null)
    .filter((m): m is TeamMember => Boolean(m));

  return roster
    .map((member) => ({ member, statut: statutByMember.get(member.id) ?? null }))
    .sort((a, b) => a.member.nom.localeCompare(b.member.nom));
}

export type PlayerConvocation = {
  statut: string;
  match: Match;
};

export async function getConvocationsForPlayer(memberId: string): Promise<PlayerConvocation[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("match_convocations")
    .select(
      "statut, matches(id, team_id, ffbb_numero, division, adversaire, domicile, date, heure, salle, score_bvb, score_adversaire, note_coach, teams(id, categorie, genre, nom))"
    )
    .eq("member_id", memberId);

  const rows: PlayerConvocation[] = [];
  for (const row of data ?? []) {
    const raw = row.matches as unknown as
      | (Omit<Match, "team"> & { teams: Match["team"] })
      | null;
    if (!raw) continue;
    const { teams, ...rest } = raw;
    rows.push({ statut: row.statut as string, match: { ...rest, team: teams } });
  }

  return rows.sort((a, b) => a.match.date.localeCompare(b.match.date));
}
