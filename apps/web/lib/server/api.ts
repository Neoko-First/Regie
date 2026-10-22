import "server-only";
import { type ApiErrorBody, ErrorCode } from "@regie/shared";
import { cookies, headers } from "next/headers";
import { ApiError } from "@/lib/api-client";
import { getServerEnv } from "@/lib/env";
import { MESSAGES } from "@/lib/messages";

// Appels à l'API depuis les Server Components (préchargement du cache TanStack, CLAUDE.md §4).
// Lit les cookies de la requête : à n'utiliser que sous un <Suspense> (Cache Components).

/**
 * Exécute un GET sur l'API Nest avec la session de l'utilisateur.
 * Ne tente pas de refresh : un Server Component ne peut pas reposer de cookies.
 * En cas de 401, le préchargement échoue silencieusement et le navigateur prend le relais
 * (refresh transparent dans `api-client`).
 *
 * @param path - Chemin de l'API, ex. `/auth/sessions`
 * @returns La réponse JSON typée
 * @throws ApiError si l'API répond en erreur ou est injoignable
 */
export async function serverApiGet<TResponse>(path: string): Promise<TResponse> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  let response: Response;
  try {
    response = await fetch(`${getServerEnv().API_URL}${path}`, {
      headers: {
        cookie: cookieStore.toString(),
        "user-agent": headerStore.get("user-agent") ?? "",
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError({
      statusCode: 503,
      code: ErrorCode.SERVICE_UNAVAILABLE,
      message: MESSAGES.errors.unavailable,
    });
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      body ?? {
        statusCode: response.status,
        code: ErrorCode.INTERNAL,
        message: MESSAGES.errors.generic,
      },
    );
  }
  return (await response.json()) as TResponse;
}
