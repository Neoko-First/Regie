import { type ApiErrorBody, ErrorCode } from "@regie/shared";
import { loginUrl } from "@/features/auth/lib/safe-redirect";
import { MESSAGES } from "./messages";

// Client HTTP UNIQUE du navigateur (CLAUDE.md §3 et §5).
// Il appelle toujours le proxy BFF `/api/...`, jamais l'API Nest directement.

/** Préfixe du proxy BFF (app/api/[...path]/route.ts). */
const API_BASE_PATH = "/api";

/** Statut HTTP « pas de contenu » : la réponse n'a pas de corps JSON. */
const HTTP_NO_CONTENT = 204;

/**
 * Erreur normalisée renvoyée par l'API (ou construite en cas de coupure réseau).
 * Le message est toujours en français et affichable tel quel.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly fieldErrors: Record<string, string[]> | undefined;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = body.statusCode;
    this.code = body.code;
    this.fieldErrors = body.fieldErrors;
  }

  /** Vrai pour les erreurs 4xx : la requête est en cause, la rejouer ne sert à rien. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

/**
 * Indique si une valeur est une `ApiError`.
 *
 * @param error - Erreur capturée (type inconnu)
 * @returns `true` si c'est une erreur API normalisée
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Extrait un message lisible d'une erreur quelconque, pour un toast.
 * Une erreur technique brute n'est jamais affichée.
 *
 * @param error - Erreur capturée
 * @returns Le message de l'API s'il existe, sinon un message générique
 */
export function getErrorMessage(error: unknown): string {
  return isApiError(error) ? error.message : MESSAGES.errors.generic;
}

/** Vérifie qu'un corps JSON ressemble au format d'erreur de l'API. */
function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    "code" in value &&
    typeof value.message === "string"
  );
}

/** Construit une `ApiError` à partir d'une réponse HTTP en échec. */
async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  if (isApiErrorBody(body)) {
    return new ApiError({ ...body, statusCode: response.status });
  }
  return new ApiError({
    statusCode: response.status,
    code: ErrorCode.INTERNAL,
    message: MESSAGES.errors.generic,
  });
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Statut HTTP « non authentifié » : access token absent ou expiré. */
const HTTP_UNAUTHORIZED = 401;

/** Routes d'auth pour lesquelles un 401 ne déclenche PAS de refresh (sinon boucle). */
const NO_REFRESH_PATHS = new Set(["/auth/login", "/auth/refresh", "/auth/logout"]);

/** Refresh en cours, partagé par toutes les requêtes qui reçoivent un 401 en même temps. */
let pendingRefresh: Promise<boolean> | null = null;

/**
 * Renouvelle la session (rotation du refresh token). Un seul appel à la fois :
 * les requêtes concurrentes attendent le même résultat au lieu de lancer chacune un refresh.
 *
 * @returns `true` si la session a été renouvelée
 */
function refreshSession(): Promise<boolean> {
  pendingRefresh ??= fetch(`${API_BASE_PATH}/auth/refresh`, {
    method: "POST",
    credentials: "same-origin",
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      pendingRefresh = null;
    });
  return pendingRefresh;
}

/** Session définitivement perdue : retour à la connexion, puis à la page courante. */
function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  // Navigation complète : le cache des données de l'ancienne session est vidé
  window.location.assign(loginUrl(`${pathname}${search}`));
}

/** Envoie la requête au BFF ; une coupure réseau devient une `ApiError` normalisée. */
async function send(method: HttpMethod, path: string, body?: unknown): Promise<Response> {
  try {
    return await fetch(`${API_BASE_PATH}${path}`, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      // Les cookies de session (httpOnly) partent automatiquement vers le BFF (même origine)
      credentials: "same-origin",
    });
  } catch {
    // fetch ne rejette qu'en cas de coupure réseau : on normalise pour les toasts
    throw new ApiError({
      statusCode: 0,
      code: ErrorCode.SERVICE_UNAVAILABLE,
      message: MESSAGES.errors.network,
    });
  }
}

async function request<TResponse>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<TResponse> {
  let response = await send(method, path, body);

  // Access token expiré : refresh transparent puis une seule nouvelle tentative (CLAUDE.md §12.1)
  if (response.status === HTTP_UNAUTHORIZED && !NO_REFRESH_PATHS.has(path)) {
    if (await refreshSession()) {
      response = await send(method, path, body);
    } else {
      redirectToLogin();
    }
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === HTTP_NO_CONTENT) return undefined as TResponse;
  return (await response.json()) as TResponse;
}

/**
 * Client HTTP typé vers l'API, via le proxy BFF. Gère le rafraîchissement transparent
 * de la session : un 401 déclenche un refresh unique, puis la requête est rejouée.
 *
 * @example
 * const changes = await apiClient.get<Change[]>("/changes");
 * await apiClient.patch(`/changes/${id}`, { title });
 */
export const apiClient = {
  get: <TResponse>(path: string) => request<TResponse>("GET", path),
  post: <TResponse>(path: string, body?: unknown) => request<TResponse>("POST", path, body),
  put: <TResponse>(path: string, body?: unknown) => request<TResponse>("PUT", path, body),
  patch: <TResponse>(path: string, body?: unknown) => request<TResponse>("PATCH", path, body),
  delete: <TResponse = void>(path: string) => request<TResponse>("DELETE", path),
};
