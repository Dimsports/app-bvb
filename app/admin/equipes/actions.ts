"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { CATEGORIES, GENRES } from "@/lib/teams/constants";
import { revalidatePath } from "next/cache";

function teamPath(teamId: string) {
  return `/admin/equipes/${teamId}`;
}

const createTeamSchema = z.object({
  categorie: z.enum(CATEGORIES),
  genre: z.enum(GENRES),
  nom: z.string().trim().max(100).optional(),
  gymnase: z.string().trim().max(200).optional(),
});

export async function createTeam(input: {
  categorie: string;
  genre: string;
  nom: string;
  gymnase: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireRole("admin");

  const parsed = createTeamSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("teams")
    .insert({
      categorie: parsed.data.categorie,
      genre: parsed.data.genre,
      nom: parsed.data.nom || null,
      gymnase: parsed.data.gymnase || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createTeam error", error);
    return { ok: false, error: "Erreur lors de la création de l'équipe." };
  }

  revalidatePath("/admin/equipes");
  return { ok: true, id: data.id };
}

const updateTeamSchema = createTeamSchema;

export async function updateTeam(
  teamId: string,
  input: { categorie: string; genre: string; nom: string; gymnase: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole("admin");

  const parsed = updateTeamSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("teams")
    .update({
      categorie: parsed.data.categorie,
      genre: parsed.data.genre,
      nom: parsed.data.nom || null,
      gymnase: parsed.data.gymnase || null,
    })
    .eq("id", teamId);

  if (error) {
    console.error("updateTeam error", error);
    return { ok: false, error: "Erreur lors de la mise à jour." };
  }

  revalidatePath(teamPath(teamId));
  revalidatePath("/admin/equipes");
  return { ok: true };
}

export async function deleteTeam(teamId: string): Promise<{ ok: boolean }> {
  await requireRole("admin");

  const supabase = getServiceClient();
  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) {
    console.error("deleteTeam error", error);
    return { ok: false };
  }

  revalidatePath("/admin/equipes");
  return { ok: true };
}

const creneauSchema = z.object({
  jour: z.coerce.number().int().min(1).max(7),
  heure_debut: z.string().regex(/^\d{2}:\d{2}$/),
  heure_fin: z.string().regex(/^\d{2}:\d{2}$/),
  lieu: z.string().trim().max(200).optional(),
});

export async function addCreneau(
  teamId: string,
  input: { jour: number; heure_debut: string; heure_fin: string; lieu: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole("admin");

  const parsed = creneauSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Créneau invalide." };
  }
  if (parsed.data.heure_fin <= parsed.data.heure_debut) {
    return { ok: false, error: "L'heure de fin doit être après l'heure de début." };
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from("team_creneaux").insert({
    team_id: teamId,
    jour: parsed.data.jour,
    heure_debut: parsed.data.heure_debut,
    heure_fin: parsed.data.heure_fin,
    lieu: parsed.data.lieu || null,
  });

  if (error) {
    console.error("addCreneau error", error);
    return { ok: false, error: "Erreur lors de l'ajout du créneau." };
  }

  revalidatePath(teamPath(teamId));
  return { ok: true };
}

export async function removeCreneau(teamId: string, creneauId: string): Promise<{ ok: boolean }> {
  await requireRole("admin");

  const supabase = getServiceClient();
  const { error } = await supabase.from("team_creneaux").delete().eq("id", creneauId);

  if (error) {
    console.error("removeCreneau error", error);
    return { ok: false };
  }

  revalidatePath(teamPath(teamId));
  return { ok: true };
}

export type CandidateResult = { id: string; prenom: string; nom: string };

export async function searchStaffCandidates(
  teamId: string,
  query: string
): Promise<CandidateResult[]> {
  await requireRole("admin");
  return searchCandidates(teamId, query, ["entraineur", "coach"], "team_staff");
}

export async function searchRosterCandidates(
  teamId: string,
  query: string
): Promise<CandidateResult[]> {
  await requireRole("admin");
  return searchCandidates(teamId, query, ["joueur"], "team_roster");
}

async function searchCandidates(
  teamId: string,
  query: string,
  roles: string[],
  table: "team_staff" | "team_roster"
): Promise<CandidateResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = getServiceClient();
  const { data: assigned } = await supabase.from(table).select("member_id").eq("team_id", teamId);
  const assignedIds = new Set((assigned ?? []).map((r) => r.member_id as string));

  const { data, error } = await supabase
    .from("members")
    .select("id, prenom, nom, roles")
    .overlaps("roles", roles)
    .or(`nom.ilike.%${trimmed}%,prenom.ilike.%${trimmed}%`)
    .order("nom", { ascending: true })
    .limit(15);

  if (error) {
    console.error("searchCandidates error", error);
    return [];
  }

  return (data ?? []).filter((m) => !assignedIds.has(m.id));
}

export async function addStaff(teamId: string, memberId: string): Promise<{ ok: boolean }> {
  await requireRole("admin");
  const supabase = getServiceClient();
  const { error } = await supabase.from("team_staff").insert({ team_id: teamId, member_id: memberId });
  if (error) {
    console.error("addStaff error", error);
    return { ok: false };
  }
  revalidatePath(teamPath(teamId));
  return { ok: true };
}

export async function removeStaff(teamId: string, memberId: string): Promise<{ ok: boolean }> {
  await requireRole("admin");
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("team_staff")
    .delete()
    .eq("team_id", teamId)
    .eq("member_id", memberId);
  if (error) {
    console.error("removeStaff error", error);
    return { ok: false };
  }
  revalidatePath(teamPath(teamId));
  return { ok: true };
}

export async function addRosterMember(teamId: string, memberId: string): Promise<{ ok: boolean }> {
  await requireRole("admin");
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("team_roster")
    .insert({ team_id: teamId, member_id: memberId });
  if (error) {
    console.error("addRosterMember error", error);
    return { ok: false };
  }
  revalidatePath(teamPath(teamId));
  return { ok: true };
}

export async function removeRosterMember(teamId: string, memberId: string): Promise<{ ok: boolean }> {
  await requireRole("admin");
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("team_roster")
    .delete()
    .eq("team_id", teamId)
    .eq("member_id", memberId);
  if (error) {
    console.error("removeRosterMember error", error);
    return { ok: false };
  }
  revalidatePath(teamPath(teamId));
  return { ok: true };
}
