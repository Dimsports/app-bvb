import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export type ActionStatut = "a_faire" | "en_cours" | "fait";

export type ProjetAction = {
  id: string;
  objectif_id: string;
  titre: string;
  echeance: string | null;
  statut: ActionStatut;
  responsable: { id: string; prenom: string; nom: string } | null;
};

export type ProjetObjectif = {
  id: string;
  titre: string;
  description: string | null;
  actions: ProjetAction[];
};

export async function getObjectifs(): Promise<ProjetObjectif[]> {
  const supabase = getServiceClient();

  const [{ data: objectifRows }, { data: actionRows }] = await Promise.all([
    supabase
      .from("projet_objectifs")
      .select("id, titre, description")
      .order("created_at", { ascending: true }),
    supabase
      .from("projet_actions")
      .select("id, objectif_id, titre, echeance, statut, members(id, prenom, nom)")
      .order("echeance", { ascending: true, nullsFirst: false }),
  ]);

  const actionsByObjectif = new Map<string, ProjetAction[]>();
  for (const row of actionRows ?? []) {
    const list = actionsByObjectif.get(row.objectif_id) ?? [];
    list.push({
      id: row.id,
      objectif_id: row.objectif_id,
      titre: row.titre,
      echeance: row.echeance,
      statut: row.statut as ActionStatut,
      responsable: row.members as unknown as ProjetAction["responsable"],
    });
    actionsByObjectif.set(row.objectif_id, list);
  }

  return (objectifRows ?? []).map((o) => ({
    ...o,
    actions: actionsByObjectif.get(o.id) ?? [],
  }));
}

export async function getAllMembersForAssignment(): Promise<
  { id: string; prenom: string; nom: string }[]
> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("members")
    .select("id, prenom, nom")
    .order("nom", { ascending: true });
  return data ?? [];
}
