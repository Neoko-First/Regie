import { type MutationCache, type QueryCache, QueryClient } from "@tanstack/react-query";
import { isApiError } from "./api-client";

// Configuration globale de TanStack Query, définie une seule fois (CLAUDE.md §6.2).
// Ce module ne dépend d'aucune API navigateur : il sert aussi au préchargement côté serveur.
// La gestion d'erreur globale par toast est branchée côté navigateur (QueryProvider).

/** Les données en cache sont considérées fraîches pendant 60 s : affichage instantané, sans requête. */
const STALE_TIME_MS = 60_000;

/** Durée de conservation en mémoire des données qui ne sont plus affichées. */
const GC_TIME_MS = 5 * 60_000;

/** Nombre maximal de nouvelles tentatives pour une erreur réseau ou serveur. */
const MAX_QUERY_RETRIES = 2;

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /** Désactive le toast d'erreur global (la mutation gère déjà son propre toast). */
      skipGlobalErrorToast?: boolean;
    };
  }
}

/**
 * Décide si une requête en échec doit être rejouée : jamais pour une erreur 4xx
 * (requête invalide, droits…), au plus `MAX_QUERY_RETRIES` fois sinon.
 *
 * @param failureCount - Nombre d'échecs déjà constatés
 * @param error - Dernière erreur
 * @returns `true` pour rejouer la requête
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && error.isClientError) return false;
  return failureCount < MAX_QUERY_RETRIES;
}

/**
 * Crée un `QueryClient` avec la configuration standard de Régie.
 *
 * @param caches - Caches personnalisés (côté navigateur : gestion d'erreur globale par toast)
 * @returns Un nouveau `QueryClient`
 */
export function makeQueryClient(caches?: {
  queryCache?: QueryCache;
  mutationCache?: MutationCache;
}): QueryClient {
  return new QueryClient({
    ...caches,
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        // Stale-while-revalidate : au retour sur l'onglet ou à la reconnexion,
        // le cache reste affiché pendant que les données sont rechargées en arrière-plan.
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: shouldRetryQuery,
      },
      mutations: {
        // Une mutation n'est jamais rejouée automatiquement (risque de double écriture)
        retry: false,
      },
    },
  });
}
