import { type ApiErrorBody, ErrorCode } from "@regie/shared";
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

async function request<TResponse>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_PATH}${path}`, {
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

  if (!response.ok) throw await toApiError(response);
  if (response.status === HTTP_NO_CONTENT) return undefined as TResponse;
  return (await response.json()) as TResponse;
}

/**
 * Client HTTP typé vers l'API, via le proxy BFF.
 * Le rafraîchissement transparent de session (401 → /auth/refresh) arrive avec l'auth (phase 3).
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
