import { useSyncExternalStore } from "react";

function subscribe(): () => void {
  return () => {};
}

/**
 * Indique si le composant est rendu dans le navigateur, après l'hydratation.
 * À utiliser pour afficher une valeur connue seulement côté client (thème stocké…)
 * sans provoquer d'erreur d'hydratation : le premier rendu client reproduit le rendu serveur.
 *
 * @returns `false` au rendu serveur et à l'hydratation, `true` ensuite
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
