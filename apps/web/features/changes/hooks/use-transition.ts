"use client";

import {
  CHANGE_STATUS_LABELS,
  type ChangeFilters,
  type ChangeSummary,
  ErrorCode,
  type Transition,
  type TransitionRequest,
} from "@regie/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isApiError } from "@/lib/api-client";
import { optimisticHandlers } from "@/lib/optimistic";
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

/** Déplacement d'une carte du board : l'évolution et la transition qu'implique le dépôt. */
export interface BoardMove {
  change: Pick<ChangeSummary, "id" | "key" | "status">;
  transition: Pick<Transition, "id" | "to">;
}

/**
 * Transition simple déclenchée par un glisser-déposer sur le board, OPTIMISTE : la carte
 * change de colonne tout de suite, et revient à sa place si l'API refuse (rôle, statut
 * changé entre-temps). Les gates et les renvois ne passent pas par ici : ils sont confirmés
 * dans une modale (`useTransition`).
 *
 * @param filters - Filtres de la liste affichée sur le board
 * @returns La mutation
 */
export function useBoardTransition(filters: ChangeFilters) {
  return useMutation({
    mutationFn: ({ change, transition }: BoardMove) =>
      changesApi.transition(change.key, { transition: transition.id, fromStatus: change.status }),
    ...optimisticHandlers<ChangeSummary[] | undefined, BoardMove>({
      queryKey: queryKeys.changes.list(filters),
      updater: (old, { change, transition }) =>
        old?.map((item) => (item.id === change.id ? { ...item, status: transition.to } : item)),
      messages: {
        success: ({ change, transition }) =>
          `${change.key} : ${CHANGE_STATUS_LABELS[transition.to]}`,
      },
      // Détail, historique et autres listes de l'évolution : rechargés au prochain affichage
      invalidateKeys: [queryKeys.changes.all, queryKeys.inbox.all],
    }),
  });
}
