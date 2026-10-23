/** Page de connexion. */
export const LOGIN_PATH = "/login";

/** Paramètre d'URL portant la page à rouvrir après connexion. */
export const NEXT_PARAM = "next";

/**
 * Construit l'URL de connexion qui ramènera ensuite à la page indiquée.
 *
 * @param returnTo - Chemin à rouvrir après connexion
 * @returns L'URL de la page de connexion
 * @example loginUrl("/changes") // "/login?next=%2Fchanges"
 */
export function loginUrl(returnTo: string): string {
  return `${LOGIN_PATH}?${new URLSearchParams({ [NEXT_PARAM]: returnTo }).toString()}`;
}

/** Page ouverte après connexion quand aucune destination valide n'est fournie. */
export const DEFAULT_AFTER_LOGIN = "/inbox";

/**
 * Valide la destination de retour après connexion (paramètre `next`).
 * Seuls les chemins internes sont acceptés : on évite qu'un lien piégé
 * (`/login?next=https://site-malveillant`) redirige l'utilisateur hors de Régie.
 *
 * @param next - Valeur brute du paramètre `next`
 * @returns Un chemin interne sûr
 * @example getSafeRedirect("//evil.com") // "/inbox"
 */
export function getSafeRedirect(next: string | null | undefined): string {
  if (!next || !next.startsWith("/")) return DEFAULT_AFTER_LOGIN;
  // « //hote » et « /\hote » sont interprétés comme des URL absolues par les navigateurs
  if (next.startsWith("//") || next.startsWith("/\\")) return DEFAULT_AFTER_LOGIN;
  if (next.startsWith(LOGIN_PATH)) return DEFAULT_AFTER_LOGIN;
  return next;
}
