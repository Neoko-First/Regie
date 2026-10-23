import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { sessionExpired } from "../auth.service";
import type { AuthContext } from "../auth.types";

/**
 * Injecte le contexte d'authentification (utilisateur et session) dans un handler.
 * Utilisable uniquement sur une route protégée (non `@Public()`).
 *
 * @example @Get("me") me(@CurrentAuth() auth: AuthContext) {}
 */
export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext => {
    const { auth } = context.switchToHttp().getRequest<Request>();
    // Ne devrait jamais arriver : le guard global garantit sa présence hors routes publiques
    if (!auth) throw sessionExpired();
    return auth;
  },
);
