import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "./session";

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
