"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { agentTokensApi, agentTokensQuery } from "../api";

/**
 * Jetons d'agent de l'utilisateur. À utiliser sous un <Suspense>.
 *
 * @returns Les jetons actifs (sans leur valeur)
 */
export function useAgentTokens() {
  return useSuspenseQuery(agentTokensQuery()).data;
}

/**
 * Création d'un jeton. NON optimiste : la valeur du jeton n'existe qu'une fois créée par
 * l'API, et elle doit être affichée à l'utilisateur.
 *
 * @returns La mutation de création
 */
export function useCreateAgentToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: agentTokensApi.create,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.agentTokens.all }),
  });
}

/**
 * Révocation d'un jeton (action de sécurité, non optimiste, confirmée).
 *
 * @returns La mutation de révocation
 */
export function useRevokeAgentToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: agentTokensApi.revoke,
    onSuccess: () => toast.success("Jeton révoqué : l'agent n'a plus accès à Régie."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.agentTokens.all }),
  });
}
