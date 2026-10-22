/** Contexte d'authentification attaché à la requête par `AccessTokenGuard`. */
export interface AuthContext {
  userId: string;
  sessionId: string;
}

/** Contenu (claims) de l'access token JWT. */
export interface AccessTokenPayload {
  /** Identifiant de l'utilisateur */
  sub: string;
  /** Identifiant de la session : permet de vérifier qu'elle n'a pas été révoquée */
  sid: string;
}

/** Informations sur l'appareil qui se connecte, conservées dans la session. */
export interface ClientContext {
  userAgent: string | null;
  ip: string | null;
}

/** Jetons émis à la connexion ou au refresh. */
export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

declare module "express" {
  interface Request {
    /** Renseigné par `AccessTokenGuard` sur les routes protégées */
    auth?: AuthContext;
  }
}
