import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { categorieFromBirthdate } from "@/lib/teams/constants";
import { getBvbBook, type Competence } from "@/lib/competences/queries";

export type RosterPlayer = {
  id: string;
  prenom: string;
  nom: string;
  categorie: string | null;
};

export async function getRosterWithCategories(teamId: string): Promise<RosterPlayer[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("team_roster")
    .select("members(id, prenom, nom, player_profiles(date_naissance))")
    .eq("team_id", teamId);

  return (data ?? [])
    .map((r) => r.members as unknown as {
      id: string;
      prenom: string;
      nom: string;
      player_profiles: { date_naissance: string | null } | { date_naissance: string | null }[] | null;
    } | null)
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .map((m) => {
      const profile = Array.isArray(m.player_profiles) ? m.player_profiles[0] : m.player_profiles;
      const dateNaissance = profile?.date_naissance ?? null;
      return {
        id: m.id,
        prenom: m.prenom,
        nom: m.nom,
        categorie: dateNaissance ? categorieFromBirthdate(dateNaissance) : null,
      };
    });
}

export type EvaluationItem = {
  competenceId: string;
  competenceNom: string;
  domainNom: string;
  niveau: string;
  commentaire: string | null;
};

export type Evaluation = {
  id: string;
  playerId: string;
  teamId: string;
  periode: string;
  date: string;
  auteur: { prenom: string; nom: string } | null;
  commentaireGeneral: string | null;
  items: EvaluationItem[];
};

type EvaluationRow = {
  id: string;
  player_id: string;
  team_id: string;
  periode: string;
  date: string;
  commentaire_general: string | null;
  members: { prenom: string; nom: string } | null;
  evaluation_items: {
    competence_id: string;
    niveau: string;
    commentaire: string | null;
    competences: { nom: string; theme_families: { nom: string } | null } | null;
  }[];
};

export async function getEvaluationsForPlayer(playerId: string): Promise<Evaluation[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("evaluations")
    .select(
      `id, player_id, team_id, periode, date, commentaire_general,
       members!evaluations_auteur_id_fkey(prenom, nom),
       evaluation_items(competence_id, niveau, commentaire, competences(nom, theme_families(nom)))`
    )
    .eq("player_id", playerId)
    .order("date", { ascending: false });

  return ((data ?? []) as unknown as EvaluationRow[]).map((row) => ({
    id: row.id,
    playerId: row.player_id,
    teamId: row.team_id,
    periode: row.periode,
    date: row.date,
    auteur: row.members,
    commentaireGeneral: row.commentaire_general,
    items: row.evaluation_items.map((it) => ({
      competenceId: it.competence_id,
      competenceNom: it.competences?.nom ?? "",
      domainNom: it.competences?.theme_families?.nom ?? "",
      niveau: it.niveau,
      commentaire: it.commentaire,
    })),
  }));
}

export type TeamEvaluationMatrix = {
  players: { id: string; prenom: string; nom: string }[];
  domains: { domainId: string; domainNom: string; competences: Competence[] }[];
  cells: Record<string, string>;
};

export async function getTeamEvaluationMatrix(
  teamId: string,
  categorie: string | null
): Promise<TeamEvaluationMatrix> {
  const supabase = getServiceClient();

  const [{ data: rosterRows }, domains] = await Promise.all([
    supabase.from("team_roster").select("members(id, prenom, nom)").eq("team_id", teamId),
    getBvbBook(categorie ? { categorie } : {}),
  ]);

  const players = (rosterRows ?? [])
    .map((r) => r.members as unknown as { id: string; prenom: string; nom: string } | null)
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const competences = domains.flatMap((d) => d.competences);
  const cells: Record<string, string> = {};

  if (players.length > 0 && competences.length > 0) {
    const { data: evalRows } = await supabase
      .from("evaluations")
      .select("player_id, date, evaluation_items(competence_id, niveau)")
      .eq("team_id", teamId)
      .in(
        "player_id",
        players.map((p) => p.id)
      )
      .order("date", { ascending: false });

    const seen = new Set<string>();
    for (const ev of evalRows ?? []) {
      for (const item of ev.evaluation_items as unknown as { competence_id: string; niveau: string }[]) {
        const key = `${ev.player_id}:${item.competence_id}`;
        if (!seen.has(key)) {
          seen.add(key);
          cells[key] = item.niveau;
        }
      }
    }
  }

  return { players, domains, cells };
}
