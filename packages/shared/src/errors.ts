/**
 * Codes d'erreur métier partagés entre l'API et le front.
 *
 * L'API les renvoie dans le champ `code` de ses réponses d'erreur
 * (`{ statusCode, message, code, fieldErrors? }`) ; le front s'en sert pour
 * adapter son comportement sans dépendre du texte du message.
 */
export const ErrorCode = {
  /** Erreur inattendue côté serveur */
  INTERNAL: "INTERNAL",
  /** Données invalides (validation Zod) */
  VALIDATION_FAILED: "VALIDATION_FAILED",
  /** Utilisateur non authentifié ou session expirée */
  UNAUTHENTICATED: "UNAUTHENTICATED",
  /** Utilisateur authentifié mais sans droit sur la ressource */
  FORBIDDEN: "FORBIDDEN",
  /** Ressource introuvable */
  NOT_FOUND: "NOT_FOUND",
  /** Conflit avec l'état actuel (doublon, version obsolète…) */
  CONFLICT: "CONFLICT",
  /** Trop de requêtes (rate limiting) */
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Format uniforme des réponses d'erreur de l'API.
 */
export interface ApiErrorBody {
  statusCode: number;
  /** Message lisible, en français, affichable tel quel à l'utilisateur */
  message: string;
  code: ErrorCode;
  /** Erreurs par champ de formulaire, remontées via `form.setError()` côté front */
  fieldErrors?: Record<string, string[]>;
}
