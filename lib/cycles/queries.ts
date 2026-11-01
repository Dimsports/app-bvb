import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export type Cycle = {
  id: string;
  team_id: string;
  nom: string;
  date_debut: string;
  date_fin: string;
  objectif: string | null;
  seances: { id: string; date: string; titre: string | null }[];
};

export type CycleOption = {
  id: string;
  team_id: string;
  nom: string;
};

export async function getCyclesForTeam(teamId: string): Promise<Cycle[]> {
  const supabase = getServiceClient();
  const [{ data: cycleRows }, { data: seanceRows }] = await Promise.all([
    supabase
      .from("cycles")
      .select("id, team_id, nom, date_debut, date_fin, objectif")
      .eq("team_id", teamId)
      .order("date_debut", { ascending: false }),
    supabase.from("seances").select("id, date, titre, cycle_id").eq("team_id", teamId).not("cycle_id", "is", null),
  ]);

  const seancesByCycle = new Map<string, Cycle["seances"]>();
  for (const row of seanceRows ?? []) {
    const cycleId = row.cycle_id as string;
    const list = seancesByCycle.get(cycleId) ?? [];
    list.push({ id: row.id, date: row.date, titre: row.titre });
    seancesByCycle.set(cycleId, list);
  }

  return (cycleRows ?? []).map((c) => ({
    ...c,
    seances: (seancesByCycle.get(c.id) ?? []).sort((a, b) => a.date.localeCompare(b.date)),
  }));
}

export async function getCycleOptionsForTeams(teamIds: string[]): Promise<CycleOption[]> {
  if (teamIds.length === 0) return [];
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("cycles")
    .select("id, team_id, nom")
    .in("team_id", teamIds)
    .order("date_debut", { ascending: false });
  return data ?? [];
}
