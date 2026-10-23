import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from "@nestjs/common";
import { ErrorCode } from "@regie/shared";
import type { Request } from "express";
import { AppException } from "../common/errors/app.exception";
import { AgentTokensService } from "./agent-tokens.service";

/** Schéma d'authentification attendu dans l'en-tête Authorization. */
const BEARER_PREFIX = "Bearer ";

/**
 * Authentifie un agent IA par son jeton (`Authorization: Bearer regie_pat_…`).
 * Utilisé sur le serveur MCP, déclaré `@Public()` pour échapper au guard des sessions
 * navigateur : c'est CE guard qui protège la route.
 */
@Injectable()
export class AgentTokenGuard implements CanActivate {
  constructor(private readonly agentTokens: AgentTokensService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    const auth = header?.startsWith(BEARER_PREFIX)
      ? await this.agentTokens.authenticate(header.slice(BEARER_PREFIX.length).trim())
      : null;
    if (!auth) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHENTICATED,
        "Jeton d'agent absent, invalide, expiré ou révoqué.",
      );
    }
    request.authContext = auth;
    return true;
  }
}
