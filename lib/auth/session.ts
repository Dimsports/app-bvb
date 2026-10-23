import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "bvb_session";
const SESSION_DURATION_SECONDS = 60 * 24 * 60 * 60; // 60 jours

// Mémorise simplement "qui a utilisé cet appareil en dernier" pour proposer
// un accès rapide (photo de profil + code) sans ressaisir le nom à chaque
// fois. Ne contient qu'un id, aucune donnée sensible ; survit à la
// déconnexion (comportement "appareil partagé mais qui se souvient").
const LAST_MEMBER_COOKIE = "bvb_last_member";
const LAST_MEMBER_DURATION_SECONDS = 180 * 24 * 60 * 60; // 180 jours

export type SessionPayload = {
  memberId: string;
  roles: string[];
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET doit être défini (>= 32 caractères) dans .env.local."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ roles: payload.roles })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.memberId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function verifySessionToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub !== "string" || !Array.isArray(payload.roles)) {
      return null;
    }
    return { memberId: payload.sub, roles: payload.roles as string[] };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function rememberMember(memberId: string) {
  const cookieStore = await cookies();
  cookieStore.set(LAST_MEMBER_COOKIE, memberId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: LAST_MEMBER_DURATION_SECONDS,
  });
}

export async function getRememberedMemberId(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LAST_MEMBER_COOKIE)?.value;
  return value && UUID_RE.test(value) ? value : null;
}
