import { type CanActivate, type ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AUTH_COOKIES } from "@regie/shared";
import type { Request } from "express";
import { AuthService, sessionExpired } from "../auth.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { TokenService } from "../token.service";

/**
 * Guard global : toute route exige un access token valide ET une session active,
 * sauf celles marquées `@Public()`. La vérification de la session en base rend
 * la révocation (déconnexion, vol de token) effective immédiatement.
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token: unknown = request.cookies?.[AUTH_COOKIES.access];
    if (typeof token !== "string") throw sessionExpired();

    const payload = await this.tokens.verifyAccessToken(token);
    if (!payload) throw sessionExpired();

    // Session navigateur d'un humain (les jetons d'agent arriveront avec le MCP)
    const auth = { userId: payload.sub, sessionId: payload.sid, isAgent: false };
    if (!(await this.auth.isSessionActive(auth))) throw sessionExpired();

    request.auth = auth;
    return true;
  }
}
