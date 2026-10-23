import { HttpStatus } from "@nestjs/common";
import { ErrorCode } from "@regie/shared";
import { AppException } from "./app.exception";

// Fabriques d'erreurs métier récurrentes, pour des messages homogènes dans toute l'API.

/**
 * 404 : ressource introuvable. Utilisé aussi quand l'utilisateur n'est pas membre de l'espace,
 * pour ne pas révéler l'existence d'une ressource qu'il ne peut pas voir.
 *
 * @param message - Message lisible (ex. « Évolution introuvable. »)
 */
export function notFound(message: string): AppException {
  return new AppException(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, message);
}

/**
 * 403 : l'utilisateur voit la ressource mais n'a pas le droit d'effectuer l'action.
 *
 * @param message - Motif lisible
 */
export function forbidden(
  message = "Vous n'avez pas les droits pour effectuer cette action.",
): AppException {
  return new AppException(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, message);
}

/**
 * 409 : l'action entre en conflit avec l'état actuel (statut changé entre-temps, doublon…).
 *
 * @param message - Motif lisible
 */
export function conflict(message: string): AppException {
  return new AppException(HttpStatus.CONFLICT, ErrorCode.CONFLICT, message);
}

/**
 * 400 lié à un champ précis : remonté dans le formulaire via `form.setError()`.
 *
 * @param field - Nom du champ en faute
 * @param message - Message affiché sous le champ
 */
export function invalidField(field: string, message: string): AppException {
  return new AppException(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED, message, {
    [field]: [message],
  });
}

/**
 * 400 sans champ précis : demande inutilisable (lien expiré ou déjà utilisé…).
 *
 * @param message - Motif lisible
 */
export function badRequest(message: string): AppException {
  return new AppException(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED, message);
}
