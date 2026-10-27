import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import type { Team } from "@/lib/teams/queries";

export type PlayerProfile = {
  date_naissance: string | null;
  poste: string | null;
  contact_nom: string | null;
  contact_telephone: string | null;
  contact_email: string | null;
};

export type PlayerPresenceEntry = {
  seanceId: string;
  date: string;
  titre: string | null;
  present: boolean;
};

export type PlayerDetail = {
  id: string;
  prenom: string;
  nom: string;
  roles: string[];
  profile: PlayerProfile;
  teams: Team[];
  presenceTotal: number;
  presenceCount: number;
  recentPresences: PlayerPresenceEntry[];
};

async function getPlayerTeamIds(playerId: string): Promise<string[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("team_roster")
    .select("team_id")
    .eq("member_id", playerId);
  return (data ?? []).map((r) => r.team_id as string);
}

export async function isPlayerStaff(playerId: string, staffMemberId: string): Promise<boolean> {
  const teamIds = await getPlayerTeamIds(playerId);
  if (teamIds.length === 0) return false;

  const supabase = getServiceClient();
  const { data } = await supabase
    .from("team_staff")
    .select("team_id")
    .eq("member_id", staffMemberId)
    .in("team_id", teamIds)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

export async function getPlayerDetail(playerId: string): Promise<PlayerDetail | null> {
  const supabase = getServiceClient();

  const { data: member } = await supabase
    .from("members")
    .select("id, prenom, nom, roles")
    .eq("id", playerId)
    .maybeSingle();
  if (!member) return null;

  const [{ data: profileRow }, { data: teamRows }] = await Promise.all([
    supabase
      .from("player_profiles")
      .select("date_naissance, poste, contact_nom, contact_telephone, contact_email")
      .eq("member_id", playerId)
      .maybeSingle(),
    supabase.from("team_roster").select("teams(id, categorie, genre, nom, gymnase)").eq("member_id", playerId),
  ]);

  const teams = (teamRows ?? [])
    .map((r) => r.teams as unknown as Team | null)
    .filter((t): t is Team => Boolean(t));
  const teamIds = teams.map((t) => t.id);

  let presenceTotal = 0;
  let presenceCount = 0;
  let recentPresences: PlayerPresenceEntry[] = [];

  if (teamIds.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: seanceRows } = await supabase
      .from("seances")
      .select("id, date, titre")
      .in("team_id", teamIds)
      .lte("date", today)
      .order("date", { ascending: false });

    const seances = seanceRows ?? [];
    presenceTotal = seances.length;

    if (seances.length > 0) {
      const { data: presenceRows } = await supabase
        .from("seance_presences")
        .select("seance_id")
        .eq("member_id", playerId)
        .in(
          "seance_id",
          seances.map((s) => s.id)
        );
      const presentIds = new Set((presenceRows ?? []).map((r) => r.seance_id as string));
      presenceCount = presentIds.size;

      recentPresences = seances.slice(0, 5).map((s) => ({
        seanceId: s.id,
        date: s.date,
        titre: s.titre,
        present: presentIds.has(s.id),
      }));
    }
  }

  return {
    id: member.id,
    prenom: member.prenom,
    nom: member.nom,
    roles: member.roles,
    profile: {
      date_naissance: profileRow?.date_naissance ?? null,
      poste: profileRow?.poste ?? null,
      contact_nom: profileRow?.contact_nom ?? null,
      contact_telephone: profileRow?.contact_telephone ?? null,
      contact_email: profileRow?.contact_email ?? null,
    },
    teams,
    presenceTotal,
    presenceCount,
    recentPresences,
  };
}
