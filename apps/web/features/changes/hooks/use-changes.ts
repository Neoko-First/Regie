"use client";

import {
  type AuthUser,
  type ChangeDetail,
  type ChangeFilters,
  type ChangeSummary,
  type CreateChangeInput,
  type UpdateChangeInput,
} from "@regie/shared";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { meQuery } from "@/features/auth/api";
import { createTempId, optimisticHandlers } from "@/lib/optimistic";
import { queryKeys } from "@/lib/query-keys";
import { changeQuery, changesApi, changesQuery } from "../api";

/**
 * Évolutions filtrées (board, liste). À utiliser sous un <Suspense>.
 *
 * @param filters - Espace, statut, assigné
 * @returns Les évolutions
 */
export function useChanges(filters: ChangeFilters) {
  return useSuspenseQuery(changesQuery(filters)).data;
}

/**
 * Détail d'une évolution. À utiliser sous un <Suspense>.
 *
 * @param key - Identifiant lisible (« SOC-12 »)
 * @returns L'évolution, avec les actions possibles pour l'utilisateur
 */
export function useChange(key: string) {
  return useSuspenseQuery(changeQuery(key)).data;
}

/** Utilisateur affiché sur un élément optimiste avant la réponse du serveur. */
const UNKNOWN_USER: AuthUser = { id: "", name: "Moi", email: "", isPlatformAdmin: false };

/**
 * Création optimiste : la carte apparaît immédiatement dans la liste affichée,
 * avec un identifiant temporaire, puis est remplacée par la version du serveur.
 *
 * @param filters - Filtres de la liste affichée (celle qui reçoit la carte)
 * @returns La mutation de création
 */
export function useCreateChange(filters: ChangeFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changesApi.create,
    // `undefined` : liste pas encore en cache, on ne crée pas de cache partiel
    ...optimisticHandlers<ChangeSummary[] | undefined, CreateChangeInput>({
      queryKey: queryKeys.changes.list(filters),
      updater: (old, input) => {
        if (!old) return old;
        const me = queryClient.getQueryData(meQuery().queryKey) ?? UNKNOWN_USER;
        const optimistic: ChangeSummary = {
          id: createTempId(),
          // Numéro inconnu tant que le serveur n'a pas répondu
          key: `${input.spaceKey}-…`,
          spaceKey: input.spaceKey,
          title: input.title,
          status: "DRAFT",
          nature: input.nature ?? "EVOLUTION",
          priority: input.priority ?? "MEDIUM",
          revision: 0,
          author: me,
          assignee: null,
          updatedAt: new Date().toISOString(),
        };
        return [optimistic, ...old];
      },
      messages: { success: "Évolution créée" },
      invalidateKeys: [queryKeys.changes.lists(), queryKeys.inbox.all],
    }),
  });
}

/**
 * Modification optimiste du contenu d'une évolution (titre, nature, priorité, assigné, textes).
 *
 * @param key - Identifiant lisible
 * @returns La mutation de modification
 */
export function useUpdateChange(key: string) {
  return useMutation({
    mutationFn: (input: UpdateChangeInput) => changesApi.update(key, input),
    ...optimisticHandlers<ChangeDetail, UpdateChangeInput>({
      queryKey: queryKeys.changes.detail(key),
      // `assigneeId` n'existe pas dans le détail : l'assigné est mis à jour à la resynchronisation
      updater: (old, { assigneeId: _assigneeId, ...input }) => ({ ...old!, ...input }),
      messages: { success: "Évolution enregistrée" },
      invalidateKeys: [
        queryKeys.changes.lists(),
        queryKeys.changes.activity(key),
        queryKeys.inbox.all,
      ],
    }),
  });
}

/**
 * Suppression d'un brouillon. Action irréversible : non optimiste, déclenchée depuis
 * une `ConfirmDialog` qui attend la réponse du serveur.
 *
 * @param key - Identifiant lisible
 * @returns La mutation de suppression
 */
export function useDeleteChange(key: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => changesApi.remove(key),
    onSuccess: () => {
      toast.success(`${key} supprimée`);
      router.push("/changes");
      queryClient.removeQueries({ queryKey: queryKeys.changes.detail(key) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.changes.lists() });
    },
  });
}
