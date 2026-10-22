/** Nom de l'application, utilisé dans les titres, emails et métadonnées. */
export const APP_NAME = "Régie";

/** Fuseau horaire d'affichage : les dates sont stockées en UTC et affichées dans ce fuseau. */
export const APP_TIMEZONE = "Europe/Paris";

/** Locale unique de l'application (pas d'i18n). */
export const APP_LOCALE = "fr-FR";

/**
 * Noms des cookies d'authentification, partagés entre l'API (qui les pose)
 * et le front (dont le `proxy.ts` vérifie la présence d'une session).
 */
export const AUTH_COOKIES = {
  /** Access token JWT (httpOnly, courte durée) */
  access: "regie_at",
  /** Refresh token opaque (httpOnly, limité aux routes /auth) */
  refresh: "regie_rt",
  /**
   * Indicateur « une session existe » (httpOnly, sans valeur secrète). Il vit aussi longtemps
   * que le refresh token et permet au front de rediriger vers la connexion sans appeler l'API.
   */
  session: "regie_session",
} as const;
