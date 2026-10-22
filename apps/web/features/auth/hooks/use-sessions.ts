"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { authApi, sessionsQuery } from "../api";

/**
 * Sessions actives de l'utilisateur (préchargées côté serveur). À utiliser sous un <Suspense>.
 *
 * @returns La liste des sessions, la plus récente en premier
 */
export function useSessions() {
  return useSuspenseQuery(sessionsQuery()).data;
}

/**
 * Révoque la session d'un autre appareil. Action de sécurité : non optimiste,
 * déclenchée depuis une `ConfirmDialog` qui attend la réponse du serveur.
 *
 * @returns La mutation de révocation
 */
export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: () => toast.success("L'appareil a été déconnecté."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.sessions() }),
  });
}
