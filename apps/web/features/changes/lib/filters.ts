import { type ChangeFilters, changeFiltersSchema } from "@regie/shared";
import { CHANGE_VIEWS, type ChangeView } from "../constants";

/** Paramètres d'URL bruts (Server Component : objet ; Client Component : URLSearchParams). */
type RawParams = URLSearchParams | Record<string, string | string[] | undefined>;

/** Lit un paramètre unique, quel que soit le format des paramètres. */
function read(params: RawParams, name: string): string | undefined {
  const value = params instanceof URLSearchParams ? params.get(name) : params[name];
  return (Array.isArray(value) ? value[0] : value) || undefined;
}

/**
 * Lit les filtres de la page Évolutions depuis l'URL. Utilisé côté serveur (préchargement)
 * ET côté client (affichage) : les deux calculent la même clé de cache.
 * Un paramètre invalide est ignoré plutôt que de casser la page.
 *
 * @param params - Paramètres d'URL
 * @returns Les filtres valides et la vue (board par défaut)
 */
export function parseChangeFilters(params: RawParams): {
  filters: ChangeFilters;
  view: ChangeView;
} {
  const parsed = changeFiltersSchema.safeParse({
    space: read(params, "space"),
    status: read(params, "status"),
    assignee: read(params, "assignee"),
  });
  const view = read(params, "view") === CHANGE_VIEWS.list ? CHANGE_VIEWS.list : CHANGE_VIEWS.board;
  return { filters: parsed.success ? parsed.data : {}, view };
}
