/**
 * Construit une query string à partir d'un objet, en ignorant les valeurs vides.
 *
 * @param params - Paramètres (les valeurs `undefined`, `null` et `""` sont ignorées)
 * @returns La query string avec son `?`, ou une chaîne vide
 * @example toQueryString({ space: "SOC", status: undefined }) // "?space=SOC"
 */
export function toQueryString(params: Record<string, string | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
