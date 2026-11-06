import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "./session";
import { isTeamStaff } from "@/lib/teams/queries";
import { isPlayerStaff } from "@/lib/players/queries";
import { isModuleAllowedForMember, type Module } from "@/lib/features/queries";

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/connexion");
  }
  return session;
}

export async function requireRole(role: string): Promise<SessionPayload> {
  const session = await requireSession();
  if (!session.roles.includes(role) && !session.roles.includes("admin")) {
    redirect("/accueil");
  }
  return session;
}

export async function requireAnyRole(roles: string[]): Promise<SessionPayload> {
  const session = await requireSession();
  const allowed = session.roles.includes("admin") || roles.some((r) => session.roles.includes(r));
  if (!allowed) {
    redirect("/accueil");
  }
  return session;
}

/**
 * Entraineur/coach : accès limité aux équipes où ils sont staff.
 * Admin : accès à toutes les équipes.
 */
export async function requireTeamStaff(teamId: string): Promise<SessionPayload> {
  const session = await requireAnyRole(["entraineur", "coach"]);
  if (!session.roles.includes("admin") && !(await isTeamStaff(teamId, session.memberId))) {
    redirect("/seances");
  }
  return session;
}

/**
 * Création/édition de séance : réservé aux entraineurs (pas les coachs,
 * qui ne font que consulter) rattachés à l'équipe, ou à l'admin.
 */
export async function requireTeamEditor(teamId: string): Promise<SessionPayload> {
  const session = await requireRole("entraineur");
  if (!session.roles.includes("admin") && !(await isTeamStaff(teamId, session.memberId))) {
    redirect("/seances");
  }
  return session;
}

/**
 * Fiche joueur (lecture) : entraineur/coach rattachés à une équipe du
 * joueur, ou admin.
 */
export async function requirePlayerAccess(playerId: string): Promise<SessionPayload> {
  const session = await requireAnyRole(["entraineur", "coach"]);
  if (!session.roles.includes("admin") && !(await isPlayerStaff(playerId, session.memberId))) {
    redirect("/equipes");
  }
  return session;
}

/**
 * Fiche joueur (édition) : entraineur rattaché (pas coach), ou admin.
 */
export async function requirePlayerEditor(playerId: string): Promise<SessionPayload> {
  const session = await requireRole("entraineur");
  if (!session.roles.includes("admin") && !(await isPlayerStaff(playerId, session.memberId))) {
    redirect("/equipes");
  }
  return session;
}

/**
 * Module activé pour le club (club_features) ET rôle autorisé pour ce
 * module, sauf accès personnalisé pour ce membre (member_feature_overrides)
 * qui prend le dessus. L'admin n'est jamais bloqué, pour éviter un
 * verrouillage accidentel depuis l'espace Administration lui-même.
 */
export async function requireFeature(module: Module): Promise<SessionPayload> {
  const session = await requireSession();
  if (!(await isModuleAllowedForMember(module, session.memberId, session.roles))) {
    redirect("/accueil");
  }
  return session;
}
