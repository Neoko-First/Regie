import "server-only";
import { dehydrate, HydrationBoundary, type QueryKey } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { makeQueryClient } from "@/lib/query-client";
import { serverApiGet } from "./api";

/**
 * Requête à précharger : options du domaine (seule la clé, partagée avec le client, est utile)
 * et chemin de l'API à appeler côté serveur.
 */
export interface ServerPrefetch {
  query: { queryKey: QueryKey };
  path: string;
}

/**
 * Précharge des données côté serveur dans un cache TanStack puis l'hydrate côté client :
 * la page s'affiche directement avec ses données (CLAUDE.md §4). À rendre sous un <Suspense>.
 * Une requête en échec (ex. 401) n'est pas transmise : le client la refera lui-même.
 *
 * @example
 * <Suspense fallback={<SessionsSkeleton />}>
 *   <Prefetch requests={[{ query: sessionsQuery(), path: "/auth/sessions" }]}>
 *     <SessionsList />
 *   </Prefetch>
 * </Suspense>
 */
export async function Prefetch({
  requests,
  children,
}: {
  requests: ServerPrefetch[];
  children: ReactNode;
}) {
  const queryClient = makeQueryClient();
  await Promise.all(
    requests.map(({ query, path }) =>
      // prefetchQuery ne lève jamais : un échec laisse simplement la requête au client
      // Pas de nouvelle tentative côté serveur : on ne retarde pas l'affichage de la page
      queryClient.prefetchQuery({
        queryKey: query.queryKey,
        queryFn: () => serverApiGet(path),
        retry: false,
      }),
    ),
  );
  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
