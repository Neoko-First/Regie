import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { type AuthUser, ErrorCode, type LoginInput, type SessionInfo } from "@regie/shared";
import { AppException } from "../common/errors/app.exception";
import { PrismaService } from "../prisma/prisma.service";
import {
  INVALID_CREDENTIALS_MESSAGE,
  LOGIN_LOCK_DURATION_MS,
  MAX_FAILED_LOGINS,
  REFRESH_REUSE_GRACE_MS,
  REFRESH_TOKEN_TTL_MS,
  SESSION_EXPIRED_MESSAGE,
  SESSION_MAX_TTL_MS,
} from "./auth.constants";
import type { AuthContext, ClientContext, IssuedTokens } from "./auth.types";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";

/** Erreur 401 générique : ne précise jamais pourquoi (compte inconnu, mot de passe, verrouillage). */
function invalidCredentials(): AppException {
  return new AppException(
    HttpStatus.UNAUTHORIZED,
    ErrorCode.UNAUTHENTICATED,
    INVALID_CREDENTIALS_MESSAGE,
  );
}

/** Erreur 401 : session absente, expirée ou révoquée. */
export function sessionExpired(): AppException {
  return new AppException(
    HttpStatus.UNAUTHORIZED,
    ErrorCode.UNAUTHENTICATED,
    SESSION_EXPIRED_MESSAGE,
  );
}

/** Ajoute une durée à une date. */
function addMs(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}

/**
 * Cœur de l'authentification : connexion, rotation des refresh tokens, sessions.
 * Modèle de jetons OAuth2 (access court + refresh avec rotation), CLAUDE.md §12.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  /**
   * Connecte un utilisateur et ouvre une session.
   * Après `MAX_FAILED_LOGINS` échecs consécutifs, le compte est verrouillé temporairement.
   * Le message d'erreur est toujours le même, que le compte existe ou non.
   *
   * @param input - Email et mot de passe
   * @param client - Appareil (user agent, IP)
   * @returns Les jetons à poser en cookies et l'utilisateur connecté
   * @throws AppException 401 si les identifiants sont refusés
   */
  async login(
    input: LoginInput,
    client: ClientContext,
  ): Promise<{ tokens: IssuedTokens; user: AuthUser }> {
    const now = new Date();
    const user = await this.prisma.user.findFirst({
      where: { email: input.email, deletedAt: null },
    });

    // Compte inconnu ou verrouillé : on vérifie quand même un hash (temps de réponse constant)
    if (!user || (user.lockedUntil && user.lockedUntil > now)) {
      await this.passwords.verify(null, input.password);
      throw invalidCredentials();
    }

    if (!(await this.passwords.verify(user.passwordHash, input.password))) {
      await this.recordFailedLogin(user.id, user.failedLoginCount, now);
      throw invalidCredentials();
    }

    // Succès : remise à zéro des échecs, et mise à niveau du hash si ses paramètres ont changé
    const passwordHash = this.passwords.needsRehash(user.passwordHash)
      ? await this.passwords.hash(input.password)
      : undefined;
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, ...(passwordHash ? { passwordHash } : {}) },
    });
    return this.openSession(user, client, now);
  }

  /**
   * Ouvre une session pour un utilisateur déjà authentifié (connexion, acceptation d'invitation).
   *
   * @param user - Utilisateur
   * @param client - Appareil (user agent, IP)
   * @param now - Instant de référence
   * @returns Les jetons à poser en cookies et l'utilisateur connecté
   */
  async openSession(
    user: { id: string; email: string; name: string; isPlatformAdmin: boolean },
    client: ClientContext,
    now = new Date(),
  ): Promise<{ tokens: IssuedTokens; user: AuthUser }> {
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        userAgent: client.userAgent,
        ip: client.ip,
        expiresAt: addMs(now, SESSION_MAX_TTL_MS),
      },
    });
    const tokens = await this.issueTokens(user.id, session.id, session.expiresAt, now);
    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isPlatformAdmin: user.isPlatformAdmin,
      },
    };
  }

  /**
   * Échange un refresh token contre une nouvelle paire de jetons (rotation).
   * Un token déjà consommé, présenté après le délai de grâce, signale un vol :
   * toute la session est révoquée.
   *
   * @param rawToken - Refresh token lu dans le cookie
   * @param client - Appareil (mise à jour de la dernière activité)
   * @returns Les nouveaux jetons
   * @throws AppException 401 si le token est inconnu, expiré, réutilisé ou la session révoquée
   */
  async refresh(rawToken: string, client: ClientContext): Promise<IssuedTokens> {
    const now = new Date();
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.tokens.hashOpaqueToken(rawToken) },
      include: { session: { include: { user: true } } },
    });
    if (!stored) throw sessionExpired();

    const { session } = stored;
    const sessionUsable = !session.revokedAt && session.expiresAt > now && !session.user.deletedAt;
    if (!sessionUsable || stored.expiresAt <= now) throw sessionExpired();

    if (stored.usedAt && now.getTime() - stored.usedAt.getTime() > REFRESH_REUSE_GRACE_MS) {
      // Réutilisation d'un token déjà consommé : vol présumé, on coupe la session entière
      await this.revokeSessions({ id: session.id });
      this.logger.warn(`Réutilisation d'un refresh token : session ${session.id} révoquée`);
      throw sessionExpired();
    }

    await this.prisma.$transaction([
      // Marque le token comme consommé (no-op s'il l'a déjà été dans le délai de grâce)
      this.prisma.refreshToken.updateMany({
        where: { id: stored.id, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.session.update({
        where: { id: session.id },
        data: { lastUsedAt: now, userAgent: client.userAgent, ip: client.ip },
      }),
    ]);
    return this.issueTokens(session.userId, session.id, session.expiresAt, now);
  }

  /**
   * Vérifie qu'une session est toujours active (appelé à chaque requête authentifiée) :
   * une session révoquée est refusée immédiatement, sans attendre l'expiration du JWT.
   *
   * @param userId - Utilisateur issu de l'access token
   * @param sessionId - Session issue de l'access token
   * @returns `true` si la session est active et l'utilisateur non supprimé
   */
  async isSessionActive(userId: string, sessionId: string): Promise<boolean> {
    const count = await this.prisma.session.count({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { deletedAt: null },
      },
    });
    return count > 0;
  }

  /**
   * Révoque la session associée à un refresh token (déconnexion). Silencieux si le token
   * est inconnu : la déconnexion doit toujours aboutir côté client.
   *
   * @param rawToken - Refresh token lu dans le cookie
   */
  async logoutByRefreshToken(rawToken: string): Promise<void> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.tokens.hashOpaqueToken(rawToken) },
      select: { sessionId: true },
    });
    if (stored) await this.revokeSessions({ id: stored.sessionId });
  }

  /**
   * Révoque une session précise.
   *
   * @param sessionId - Session à révoquer
   */
  async logoutSession(sessionId: string): Promise<void> {
    await this.revokeSessions({ id: sessionId });
  }

  /**
   * Révoque toutes les sessions d'un utilisateur (« se déconnecter de tous les appareils »).
   *
   * @param userId - Utilisateur concerné
   */
  async logoutAll(userId: string): Promise<void> {
    await this.revokeSessions({ userId });
  }

  /**
   * Renvoie l'utilisateur connecté.
   *
   * @param userId - Identifiant issu de l'access token
   * @returns Les informations publiques de l'utilisateur
   * @throws AppException 401 si l'utilisateur n'existe plus
   */
  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, email: true, name: true, isPlatformAdmin: true },
    });
    if (!user) throw sessionExpired();
    return user;
  }

  /**
   * Liste les sessions actives d'un utilisateur, la plus récemment utilisée en premier.
   *
   * @param auth - Utilisateur et session courante
   * @returns Les sessions, la session courante étant signalée
   */
  async listSessions(auth: AuthContext): Promise<SessionInfo[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId: auth.userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: "desc" },
    });
    return sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      ip: session.ip,
      createdAt: session.createdAt.toISOString(),
      lastUsedAt: session.lastUsedAt.toISOString(),
      current: session.id === auth.sessionId,
    }));
  }

  /**
   * Révoque une session de l'utilisateur (gestion des appareils).
   * Vérifie que la session lui appartient : on ne révoque pas la session d'un autre.
   *
   * @param userId - Propriétaire attendu
   * @param sessionId - Session à révoquer
   * @throws AppException 404 si la session n'existe pas ou n'appartient pas à l'utilisateur
   */
  async revokeOwnSession(userId: string, sessionId: string): Promise<void> {
    const { count } = await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) {
      throw new AppException(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, "Session introuvable.");
    }
  }

  /**
   * Révoque toutes les sessions d'un utilisateur sauf une (changement de mot de passe :
   * l'appareil courant reste connecté, les autres sont déconnectés).
   *
   * @param userId - Utilisateur concerné
   * @param keepSessionId - Session à conserver
   */
  async revokeOtherSessions(userId: string, keepSessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, id: { not: keepSessionId }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Révoque les sessions correspondant au filtre (une session ou toutes celles d'un utilisateur). */
  private async revokeSessions(where: { id: string } | { userId: string }): Promise<void> {
    await this.prisma.session.updateMany({
      where: { ...where, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Enregistre un échec de connexion et verrouille le compte au-delà du seuil. */
  private async recordFailedLogin(
    userId: string,
    previousFailures: number,
    now: Date,
  ): Promise<void> {
    const failures = previousFailures + 1;
    const locked = failures >= MAX_FAILED_LOGINS;
    await this.prisma.user.update({
      where: { id: userId },
      data: locked
        ? { failedLoginCount: 0, lockedUntil: addMs(now, LOGIN_LOCK_DURATION_MS) }
        : { failedLoginCount: failures },
    });
    if (locked) this.logger.warn(`Compte ${userId} verrouillé après ${failures} échecs`);
  }

  /**
   * Émet un access token et un nouveau refresh token pour une session.
   * Le refresh token expire après `REFRESH_TOKEN_TTL_MS`, sans dépasser la fin de la session.
   */
  private async issueTokens(
    userId: string,
    sessionId: string,
    sessionExpiresAt: Date,
    now: Date,
  ): Promise<IssuedTokens> {
    const refresh = this.tokens.generateOpaqueToken();
    const slidingExpiry = addMs(now, REFRESH_TOKEN_TTL_MS);
    const refreshTokenExpiresAt =
      slidingExpiry < sessionExpiresAt ? slidingExpiry : sessionExpiresAt;

    await this.prisma.refreshToken.create({
      data: { sessionId, tokenHash: refresh.hash, expiresAt: refreshTokenExpiresAt },
    });
    const accessToken = await this.tokens.signAccessToken({ sub: userId, sid: sessionId });
    return { accessToken, refreshToken: refresh.token, refreshTokenExpiresAt };
  }
}
