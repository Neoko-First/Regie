import type { AuthContext } from "../auth/auth.types";

/**
 * Données à ajouter à une entrée d'historique pour tracer la délégation (D-014) :
 * l'action d'un agent s'affiche « Helix, pour le compte d'Alexandre ».
 *
 * @param auth - Contexte de l'auteur de l'action
 * @returns `{ agent: "<nom>" }` pour un agent, un objet vide pour un humain
 */
export function delegationData(auth: AuthContext): { agent?: string } {
  return auth.isAgent && auth.agentName ? { agent: auth.agentName } : {};
}
