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

export type Mission = {
  id: string;
  match_id: string;
  titre: string;
  besoin: number;
  inscrits: TeamMember[];
};

export async function getMissionsForMatch(matchId: string): Promise<Mission[]> {
  const supabase = getServiceClient();
  const { data: missions } = await supabase
    .from("match_missions")
    .select("id, match_id, titre, besoin")
    .eq("match_id", matchId);

  if (!missions || missions.length === 0) return [];

  const { data: inscriptions } = await supabase
    .from("match_mission_inscriptions")
    .select("mission_id, members(id, prenom, nom, roles)")
    .in(
      "mission_id",
      missions.map((m) => m.id)
    );

  const inscritsByMission = new Map<string, TeamMember[]>();
  for (const row of inscriptions ?? []) {
    const member = row.members as unknown as TeamMember | null;
    if (!member) continue;
    const list = inscritsByMission.get(row.mission_id) ?? [];
    list.push(member);
    inscritsByMission.set(row.mission_id, list);
  }

  return missions.map((m) => ({ ...m, inscrits: inscritsByMission.get(m.id) ?? [] }));
}

export type MissionFeedEntry = {
  match: Match;
  missions: Array<{ id: string; titre: string; besoin: number; inscritCount: number; estInscrit: boolean }>;
};

export async function getMissionsFeed(memberId: string): Promise<MissionFeedEntry[]> {
  const supabase = getServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: matchRows } = await supabase
    .from("matches")
    .select(
      "id, team_id, ffbb_numero, division, adversaire, domicile, date, heure, salle, score_bvb, score_adversaire, note_coach, teams(id, categorie, genre, nom)"
    )
    .gte("date", today)
    .order("date", { ascending: true });

  if (!matchRows || matchRows.length === 0) return [];

  const matchIds = matchRows.map((m) => m.id);
  const { data: missionRows } = await supabase
    .from("match_missions")
    .select("id, match_id, titre, besoin")
    .in("match_id", matchIds);

  if (!missionRows || missionRows.length === 0) return [];

  const missionIds = missionRows.map((m) => m.id);
  const { data: inscriptionRows } = await supabase
    .from("match_mission_inscriptions")
    .select("mission_id, member_id")
    .in("mission_id", missionIds);

  const countByMission = new Map<string, number>();
  const mineByMission = new Set<string>();
  for (const row of inscriptionRows ?? []) {
    countByMission.set(row.mission_id, (countByMission.get(row.mission_id) ?? 0) + 1);
    if (row.member_id === memberId) mineByMission.add(row.mission_id);
  }

  const missionsByMatch = new Map<string, MissionFeedEntry["missions"]>();
  for (const m of missionRows) {
    const list = missionsByMatch.get(m.match_id) ?? [];
    list.push({
      id: m.id,
      titre: m.titre,
      besoin: m.besoin,
      inscritCount: countByMission.get(m.id) ?? 0,
      estInscrit: mineByMission.has(m.id),
    });
    missionsByMatch.set(m.match_id, list);
  }

  const feed: MissionFeedEntry[] = [];
  for (const row of matchRows) {
    const missions = missionsByMatch.get(row.id);
    if (!missions || missions.length === 0) continue;
    feed.push({
      match: { ...row, team: row.teams as unknown as Match["team"] },
      missions,
    });
  }

  return feed;
}

export type MissionHistoryEntry = {
  match: Match;
  missionTitre: string;
};

export async function getMissionsHistoryForMember(memberId: string): Promise<MissionHistoryEntry[]> {
  const supabase = getServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: inscriptionRows } = await supabase
    .from("match_mission_inscriptions")
    .select("match_missions(id, titre, match_id)")
    .eq("member_id", memberId);

  const missionsById = (inscriptionRows ?? [])
    .map((r) => r.match_missions as unknown as { id: string; titre: string; match_id: string } | null)
    .filter((m): m is { id: string; titre: string; match_id: string } => Boolean(m));

  if (missionsById.length === 0) return [];

  const matchIds = [...new Set(missionsById.map((m) => m.match_id))];
  const { data: matchRows } = await supabase
    .from("matches")
    .select(
      "id, team_id, ffbb_numero, division, adversaire, domicile, date, heure, salle, score_bvb, score_adversaire, note_coach, teams(id, categorie, genre, nom)"
    )
    .in("id", matchIds)
    .lt("date", today)
    .order("date", { ascending: false });

  const matchById = new Map((matchRows ?? []).map((row) => [row.id, { ...row, team: row.teams as unknown as Match["team"] }]));

  const history: MissionHistoryEntry[] = [];
  for (const m of missionsById) {
    const match = matchById.get(m.match_id);
    if (!match) continue;
    history.push({ match, missionTitre: m.titre });
  }

  return history.sort((a, b) => b.match.date.localeCompare(a.match.date));
}
