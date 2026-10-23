import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ApiNoContentResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AUTH_COOKIES, type AuthUser, type SessionInfo } from "@regie/shared";
import type { Request, Response } from "express";
import { AUTH_THROTTLE } from "./auth.constants";
import { AuthCookiesService } from "./auth-cookies.service";
import { AuthService, sessionExpired } from "./auth.service";
import type { AuthContext, ClientContext } from "./auth.types";
import { CurrentAuth } from "./decorators/current-auth.decorator";
import { Public } from "./decorators/public.decorator";
import { LoginDto } from "./dto/login.dto";

/** Longueur maximale conservée du user agent (évite de stocker des en-têtes démesurés). */
const USER_AGENT_MAX_LENGTH = 512;

/** Extrait l'appareil et l'IP de la requête (IP réelle transmise par le proxy BFF). */
function clientContext(req: Request): ClientContext {
  return {
    userAgent: req.headers["user-agent"]?.slice(0, USER_AGENT_MAX_LENGTH) ?? null,
    ip: req.ip ?? null,
  };
}

/** Lit le refresh token dans son cookie. */
function readRefreshToken(req: Request): string | undefined {
  const token: unknown = req.cookies?.[AUTH_COOKIES.refresh];
  return typeof token === "string" ? token : undefined;
}

/**
 * Routes d'authentification. Les jetons ne transitent que par des cookies httpOnly :
 * les réponses ne contiennent jamais de token.
 */
@ApiTags("Authentification")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookiesService,
  ) {}

  /** Connexion par email et mot de passe. Rate limiting renforcé. */
  @Public()
  @Throttle(AUTH_THROTTLE.login)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: "Connecté : cookies de session posés, utilisateur renvoyé." })
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUser> {
    const { tokens, user } = await this.auth.login(body, clientContext(req));
    this.cookies.set(res, tokens);
    return user;
  }

  /**
   * Rotation des jetons. En cas d'échec, les cookies sont supprimés : le front
   * redirige alors vers la connexion sans boucle.
   */
  @Public()
  @Throttle(AUTH_THROTTLE.refresh)
  @Post("refresh")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: "Nouveaux cookies de session posés." })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const token = readRefreshToken(req);
    try {
      if (!token) throw sessionExpired();
      this.cookies.set(res, await this.auth.refresh(token, clientContext(req)));
    } catch (error) {
      this.cookies.clear(res);
      throw error;
    }
  }

  /** Déconnexion de l'appareil courant. Aboutit toujours, même si la session est déjà invalide. */
  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: "Session révoquée et cookies supprimés." })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const token = readRefreshToken(req);
    if (token) await this.auth.logoutByRefreshToken(token);
    this.cookies.clear(res);
  }

  /** Déconnexion de tous les appareils (révocation de toutes les sessions). */
  @Post("logout-all")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: "Toutes les sessions sont révoquées." })
  async logoutAll(
    @CurrentAuth() auth: AuthContext,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logoutAll(auth.userId);
    this.cookies.clear(res);
  }

  /** Utilisateur connecté. */
  @Get("me")
  @ApiOkResponse({ description: "Utilisateur connecté." })
  me(@CurrentAuth() auth: AuthContext): Promise<AuthUser> {
    return this.auth.getMe(auth.userId);
  }

  /** Sessions actives (appareils connectés) de l'utilisateur. */
  @Get("sessions")
  @ApiOkResponse({ description: "Sessions actives, la plus récente en premier." })
  sessions(@CurrentAuth() auth: AuthContext): Promise<SessionInfo[]> {
    return this.auth.listSessions(auth);
  }

  /** Révoque une session de l'utilisateur (un autre appareil). */
  @Delete("sessions/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: "Session révoquée." })
  async revokeSession(
    @CurrentAuth() auth: AuthContext,
    @Param("id", new ParseUUIDPipe()) sessionId: string,
  ): Promise<void> {
    await this.auth.revokeOwnSession(auth.userId, sessionId);
  }
}
