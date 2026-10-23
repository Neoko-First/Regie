// Paramètres de sécurité de l'authentification (CLAUDE.md §12). Valeurs nommées, jamais
// de « magic numbers » dans le code.

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** Durée de vie d'un access token (JWT) : courte, la révocation reste rapide. */
export const ACCESS_TOKEN_TTL_MS = 15 * MINUTE_MS;

/**
 * Durée de vie d'un refresh token : sans activité pendant ce délai, la session expire
 * (expiration glissante, chaque refresh émet un token neuf).
 */
export const REFRESH_TOKEN_TTL_MS = 14 * DAY_MS;

/** Durée de vie maximale d'une session, quelle que soit l'activité (reconnexion obligatoire). */
export const SESSION_MAX_TTL_MS = 30 * DAY_MS;

/**
 * Délai pendant lequel un refresh token déjà consommé est encore accepté : couvre les
 * requêtes concurrentes de plusieurs onglets. Au-delà, sa réutilisation signale un vol.
 */
export const REFRESH_REUSE_GRACE_MS = 10 * SECOND_MS;

/** Validité d'un lien de réinitialisation du mot de passe (CLAUDE.md §12.3 : ≈ 30 min). */
export const PASSWORD_RESET_TTL_MS = 30 * MINUTE_MS;

/** Nombre d'échecs de connexion consécutifs avant verrouillage temporaire du compte. */
export const MAX_FAILED_LOGINS = 5;

/** Durée du verrouillage temporaire. */
export const LOGIN_LOCK_DURATION_MS = 15 * MINUTE_MS;

/** Nombre d'octets aléatoires d'un jeton opaque : refresh token, jeton d'agent (256 bits). */
export const OPAQUE_TOKEN_BYTES = 32;

/** Rate limiting renforcé des routes d'auth (par IP). */
export const AUTH_THROTTLE = {
  login: { default: { limit: 10, ttl: MINUTE_MS } },
  refresh: { default: { limit: 60, ttl: MINUTE_MS } },
  forgotPassword: { default: { limit: 5, ttl: MINUTE_MS } },
  resetPassword: { default: { limit: 10, ttl: MINUTE_MS } },
  invitation: { default: { limit: 10, ttl: MINUTE_MS } },
} as const;

/** Message unique en cas d'échec de connexion : ne révèle pas si le compte existe. */
export const INVALID_CREDENTIALS_MESSAGE = "Identifiants incorrects.";

/** Message renvoyé quand la session est absente, expirée ou révoquée. */
export const SESSION_EXPIRED_MESSAGE = "Votre session a expiré. Reconnectez-vous.";
