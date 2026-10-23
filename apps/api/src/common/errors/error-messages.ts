import { HttpStatus } from "@nestjs/common";
import { ErrorCode } from "@regie/shared";

/** Code d'erreur et message par défaut associés à un statut HTTP. */
interface DefaultError {
  code: ErrorCode;
  message: string;
}

/**
 * Codes et messages par défaut (français) utilisés quand une exception ne précise rien
 * de plus lisible. Aucun détail technique n'est jamais renvoyé au client.
 */
const DEFAULT_ERRORS: Partial<Record<HttpStatus, DefaultError>> = {
  [HttpStatus.BAD_REQUEST]: {
    code: ErrorCode.VALIDATION_FAILED,
    message: "Les données envoyées sont invalides.",
  },
  [HttpStatus.UNAUTHORIZED]: {
    code: ErrorCode.UNAUTHENTICATED,
    message: "Authentification requise.",
  },
  [HttpStatus.FORBIDDEN]: {
    code: ErrorCode.FORBIDDEN,
    message: "Vous n'avez pas les droits pour effectuer cette action.",
  },
  [HttpStatus.NOT_FOUND]: {
    code: ErrorCode.NOT_FOUND,
    message: "L'élément demandé est introuvable.",
  },
  [HttpStatus.CONFLICT]: {
    code: ErrorCode.CONFLICT,
    message: "Cette action entre en conflit avec l'état actuel des données.",
  },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    code: ErrorCode.TOO_MANY_REQUESTS,
    message: "Trop de requêtes. Réessayez dans quelques instants.",
  },
};

/** Erreur renvoyée pour tout statut 5xx ou inconnu. */
export const INTERNAL_ERROR: DefaultError = {
  code: ErrorCode.INTERNAL,
  message: "Une erreur interne est survenue. Réessayez dans un instant.",
};

/**
 * Renvoie le code et le message par défaut d'un statut HTTP.
 *
 * @param status - Statut HTTP de l'erreur
 * @returns Le code partagé et le message français correspondants
 */
export function getDefaultError(status: number): DefaultError {
  return DEFAULT_ERRORS[status as HttpStatus] ?? INTERNAL_ERROR;
}
