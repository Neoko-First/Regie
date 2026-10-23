import { AUTH_COOKIES } from "@regie/shared";
import { type NextRequest, NextResponse } from "next/server";
import { LOGIN_PATH, NEXT_PARAM } from "@/features/auth/lib/safe-redirect";

// Redirections d'auth (CLAUDE.md §5 et §12.4) : sans session, toute page de l'application
// renvoie vers la connexion. Simple confort de navigation : la vraie sécurité est dans l'API,
// qui vérifie le jeton et la session à chaque requête.

/** Pages accessibles sans session. */
const PUBLIC_PATHS = new Set([LOGIN_PATH]);

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  // Cookie indicateur posé par l'API, qui vit aussi longtemps que le refresh token
  if (request.cookies.has(AUTH_COOKIES.session)) return NextResponse.next();

  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set(NEXT_PARAM, `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Ni le proxy BFF (/api), ni les fichiers statiques et métadonnées
  matcher: [
    "/((?!api|_next/static|_next/image|icon.svg|manifest.webmanifest|robots.txt|sitemap.xml).*)",
  ],
};
