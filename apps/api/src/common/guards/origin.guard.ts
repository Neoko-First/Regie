import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from "@nestjs/common";
import { ErrorCode } from "@regie/shared";
import type { Request } from "express";
import { AppConfigService } from "../../config/app-config.service";
import { AppException } from "../errors/app.exception";

/** Méthodes qui modifient des données : seules concernées par la protection CSRF. */
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Protection CSRF (CLAUDE.md §12.4), en complément des cookies `sameSite=lax` :
 * une requête mutante authentifiée par cookie doit provenir du front (en-tête `Origin`).
 * Le proxy BFF transmet l'en-tête `Origin` du navigateur.
 * Les requêtes sans cookie (ex. futurs clients MCP par jeton) ne sont pas concernées.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!MUTATING_METHODS.has(request.method)) return true;
    if (!request.headers.cookie) return true;

    if (request.headers.origin !== this.config.get("WEB_ORIGIN")) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        "Requête refusée : origine non autorisée.",
      );
    }
    return true;
  }
}
