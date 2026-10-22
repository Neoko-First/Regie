import { type ApiErrorBody, ErrorCode } from "@regie/shared";
import { getServerEnv } from "@/lib/env";
import { MESSAGES } from "@/lib/messages";

// BFF (CLAUDE.md §5) : relaie les appels du navigateur vers l'API Nest.
// L'URL réelle du backend reste côté serveur : elle n'apparaît jamais dans l'onglet Réseau.

/** Au-delà de ce délai, l'API est considérée comme indisponible. */
const UPSTREAM_TIMEOUT_MS = 30_000;

/** En-têtes de la requête navigateur transmis à l'API ; tout le reste est filtré. */
const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "content-type",
  "cookie", // session (access / refresh tokens httpOnly)
  "origin", // vérifié par l'API sur les requêtes mutantes (protection CSRF)
  "user-agent", // affiché dans la liste des sessions
] as const;

/** En-têtes de la réponse de l'API renvoyés au navigateur (pas d'en-têtes internes). */
const FORWARDED_RESPONSE_HEADERS = ["content-type", "content-disposition", "retry-after"] as const;

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

/** Construit les en-têtes envoyés à l'API à partir de la requête navigateur. */
function buildUpstreamHeaders(req: Request): Headers {
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  // IP du client, pour le rate limiting et la liste des sessions côté API
  const clientIp = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip");
  if (clientIp) headers.set("x-forwarded-for", clientIp);
  return headers;
}

/** Construit les en-têtes renvoyés au navigateur à partir de la réponse de l'API. */
function buildClientHeaders(upstream: Response): Headers {
  const headers = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Les cookies d'auth posés par Nest doivent arriver au navigateur
  for (const cookie of upstream.headers.getSetCookie()) headers.append("set-cookie", cookie);
  return headers;
}

/** Réponse renvoyée quand l'API ne répond pas, au format d'erreur standard. */
function serviceUnavailable(): Response {
  const body: ApiErrorBody = {
    statusCode: 503,
    code: ErrorCode.SERVICE_UNAVAILABLE,
    message: MESSAGES.errors.network,
  };
  return Response.json(body, { status: body.statusCode });
}

async function forward(req: Request, ctx: RouteContext<"/api/[...path]">): Promise<Response> {
  const { path } = await ctx.params;
  const { search } = new URL(req.url);
  const target = `${getServerEnv().API_URL}/${path.map(encodeURIComponent).join("/")}${search}`;

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: buildUpstreamHeaders(req),
      body: METHODS_WITHOUT_BODY.has(req.method) ? undefined : await req.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: buildClientHeaders(upstream),
    });
  } catch (error) {
    // API arrêtée, injoignable ou trop lente : pas de détail technique côté client
    console.error("[BFF] API injoignable", { target: `/${path.join("/")}`, error });
    return serviceUnavailable();
  }
}

export { forward as DELETE, forward as GET, forward as PATCH, forward as POST, forward as PUT };
