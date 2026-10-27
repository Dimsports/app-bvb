import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export type Team = {
  id: string;
  categorie: string;
  genre: string;
  nom: string | null;
  gymnase: string | null;
};

export type Creneau = {
  id: string;
  team_id: string;
  jour: number;
  heure_debut: string;
  heure_fin: string;
  lieu: string | null;
};

export type TeamMember = {
  id: string;
  prenom: string;
  nom: string;
  roles: string[];
};

export type TeamDetail = Team & {
  creneaux: Creneau[];
  staff: TeamMember[];
  roster: TeamMember[];
};

export async function getAllTeams(): Promise<Team[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("teams")
    .select("id, categorie, genre, nom, gymnase")
    .order("categorie", { ascending: true });
  return data ?? [];
}

export async function getTeamsForMember(memberId: string): Promise<Team[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("team_staff")
    .select("teams(id, categorie, genre, nom, gymnase)")
    .eq("member_id", memberId);

  return (data ?? [])
    .map((row) => row.teams as unknown as Team | null)
    .filter((t): t is Team => Boolean(t));
}

export async function getTeamDetail(teamId: string): Promise<TeamDetail | null> {
  const supabase = getServiceClient();

  const [{ data: team }, { data: creneaux }, { data: staffRows }, { data: rosterRows }] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, categorie, genre, nom, gymnase")
        .eq("id", teamId)
        .maybeSingle(),
      supabase
        .from("team_creneaux")
        .select("id, team_id, jour, heure_debut, heure_fin, lieu")
        .eq("team_id", teamId)
        .order("jour", { ascending: true }),
      supabase
        .from("team_staff")
        .select("members(id, prenom, nom, roles)")
        .eq("team_id", teamId),
      supabase
        .from("team_roster")
        .select("members(id, prenom, nom, roles)")
        .eq("team_id", teamId),
    ]);

  if (!team) return null;

  const staff = (staffRows ?? [])
    .map((r) => r.members as unknown as TeamMember | null)
    .filter((m): m is TeamMember => Boolean(m));
  const roster = (rosterRows ?? [])
    .map((r) => r.members as unknown as TeamMember | null)
    .filter((m): m is TeamMember => Boolean(m));

  return {
    ...team,
    creneaux: creneaux ?? [],
    staff: staff.sort((a, b) => a.nom.localeCompare(b.nom)),
    roster: roster.sort((a, b) => a.nom.localeCompare(b.nom)),
  };
}

export async function getTeamRoster(teamId: string): Promise<TeamMember[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("team_roster")
    .select("members(id, prenom, nom, roles)")
    .eq("team_id", teamId);

  const roster = (data ?? [])
    .map((r) => r.members as unknown as TeamMember | null)
    .filter((m): m is TeamMember => Boolean(m));

  return roster.sort((a, b) => a.nom.localeCompare(b.nom));
}

export async function isTeamStaff(teamId: string, memberId: string): Promise<boolean> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("team_staff")
    .select("team_id")
    .eq("team_id", teamId)
    .eq("member_id", memberId)
    .maybeSingle();
  return Boolean(data);
}
