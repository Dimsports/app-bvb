import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value
  );

  if (!session) {
    const url = new URL("/connexion", request.url);
    return NextResponse.redirect(url);
  }

  if (
    (pathname.startsWith("/admin") || pathname.startsWith("/administration")) &&
    !session.roles.includes("admin")
  ) {
    return NextResponse.redirect(new URL("/accueil", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!connexion|installation|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|logo-bvb.jpeg).*)",
  ],
};
