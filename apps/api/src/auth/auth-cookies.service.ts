import { Injectable } from "@nestjs/common";
import { AUTH_COOKIES } from "@regie/shared";
import type { CookieOptions, Response } from "express";
import { AppConfigService } from "../config/app-config.service";
import { ACCESS_TOKEN_TTL_MS } from "./auth.constants";
import type { IssuedTokens } from "./auth.types";

/**
 * Pose et supprime les cookies d'authentification (CLAUDE.md §12.1) :
 * httpOnly (inaccessibles au JavaScript), `secure` en production, `sameSite=lax`.
 * Aucun jeton ne transite jamais par le corps des réponses ni par le localStorage.
 */
@Injectable()
export class AuthCookiesService {
  constructor(private readonly config: AppConfigService) {}

  /** Options communes à tous les cookies d'auth. */
  private get baseOptions(): CookieOptions {
    return { httpOnly: true, secure: this.config.isProduction, sameSite: "lax" };
  }

  /**
   * Le refresh token n'est envoyé que sur les routes d'auth, telles que le navigateur
   * les voit à travers le proxy BFF (ex. `/api/auth`), et pas sur chaque requête.
   */
  private get refreshPath(): string {
    return `${this.config.get("PUBLIC_API_PREFIX")}/auth`;
  }

  /**
   * Pose les cookies après une connexion ou un refresh.
   *
   * @param res - Réponse Express
   * @param tokens - Jetons émis
   */
  set(res: Response, tokens: IssuedTokens): void {
    const refreshMaxAge = tokens.refreshTokenExpiresAt.getTime() - Date.now();
    res.cookie(AUTH_COOKIES.access, tokens.accessToken, {
      ...this.baseOptions,
      path: "/",
      maxAge: ACCESS_TOKEN_TTL_MS,
    });
    res.cookie(AUTH_COOKIES.refresh, tokens.refreshToken, {
      ...this.baseOptions,
      path: this.refreshPath,
      maxAge: refreshMaxAge,
    });
    // Simple indicateur de présence de session, lu par le proxy.ts de Next (aucun secret)
    res.cookie(AUTH_COOKIES.session, "1", {
      ...this.baseOptions,
      path: "/",
      maxAge: refreshMaxAge,
    });
  }

  /**
   * Supprime les cookies (déconnexion, session invalide).
   *
   * @param res - Réponse Express
   */
  clear(res: Response): void {
    res.clearCookie(AUTH_COOKIES.access, { ...this.baseOptions, path: "/" });
    res.clearCookie(AUTH_COOKIES.refresh, { ...this.baseOptions, path: this.refreshPath });
    res.clearCookie(AUTH_COOKIES.session, { ...this.baseOptions, path: "/" });
  }
}
