"use client";

import { CHANGE_STATUS_LABELS, ErrorCode, type TransitionRequest } from "@regie/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { changesApi } from "../api";

/**
 * Changement de statut (dont la validation des gates). NON optimiste : une validation est
 * tracée et peut être refusée par l'API (rôle, statut changé entre-temps) ; on attend sa réponse.
 *
 * @param key - Identifiant lisible de l'évolution
 * @returns La mutation de transition
 */
export function useTransition(key: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: TransitionRequest) => changesApi.transition(key, request),
    onSuccess: (change) => {
      queryClient.setQueryData(queryKeys.changes.detail(key), change);
      toast.success(`${key} : ${CHANGE_STATUS_LABELS[change.status]}`);
    },
    onError: (error) => {
      // Statut changé par quelqu'un d'autre : on recharge pour afficher l'état réel
      if (isApiError(error) && error.code === ErrorCode.CONFLICT) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.changes.detail(key) });
      }
    },
    onSettled: () =>
      Promise.all(
        [
          queryKeys.changes.lists(),
          queryKeys.changes.activity(key),
          queryKeys.changes.revisions(key),
          queryKeys.inbox.all,
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
}
