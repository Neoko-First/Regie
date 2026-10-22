"use client";

import { MutationCache, QueryCache, type QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-client";
import { MESSAGES } from "@/lib/messages";
import { makeQueryClient } from "@/lib/query-client";

let browserQueryClient: QueryClient | undefined;

/** Crée le client navigateur, avec la gestion d'erreur globale par toast (CLAUDE.md §6.2). */
function makeBrowserQueryClient(): QueryClient {
  return makeQueryClient({
    queryCache: new QueryCache({
      onError: (_error, query) => {
        // Premier chargement en échec : c'est l'état d'erreur de la page qui l'affiche.
        // Échec d'un rafraîchissement en arrière-plan : les données restent affichées, on prévient.
        if (query.state.data !== undefined) toast.error(MESSAGES.errors.refresh);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _onMutateResult, mutation) => {
        if (mutation.meta?.skipGlobalErrorToast) return;
        toast.error(getErrorMessage(error));
      },
    }),
  });
}

/**
 * Renvoie le `QueryClient` : un nouveau par rendu serveur (isolation des requêtes),
 * un seul partagé dans le navigateur (le cache survit aux navigations).
 */
function getQueryClient(): QueryClient {
  if (typeof window === "undefined") return makeQueryClient();
  browserQueryClient ??= makeBrowserQueryClient();
  return browserQueryClient;
}

/**
 * Fournit le cache TanStack Query à toute l'application.
 *
 * @param props.children - Arbre de l'application
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
      {/* En bas à droite : le haut est réservé aux actions des pages, le bas gauche à la sidebar */}
      <ReactQueryDevtools buttonPosition="bottom-right" />
    </QueryClientProvider>
  );
}
