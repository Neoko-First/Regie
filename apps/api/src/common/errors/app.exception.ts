import { HttpException, HttpStatus } from "@nestjs/common";
import { type ErrorCode } from "@regie/shared";

/**
 * Exception métier de l'API : statut HTTP, code partagé avec le front et message en français.
 * Le filtre global la convertit telle quelle au format `{ statusCode, message, code, fieldErrors? }`.
 *
 * @example
 * throw new AppException(HttpStatus.CONFLICT, ErrorCode.CONFLICT, "Cet espace existe déjà.");
 */
export class AppException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: ErrorCode,
    message: string,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message, status);
  }
}
