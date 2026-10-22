"use client";

import type { CommentItem, CreateCommentInput } from "@regie/shared";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { meQuery } from "@/features/auth/api";
import { createTempId, optimisticHandlers } from "@/lib/optimistic";
import { queryKeys } from "@/lib/query-keys";
import { activityQuery, changesApi, commentsQuery, revisionsQuery } from "../api";

/**
 * Commentaires d'une évolution. À utiliser sous un <Suspense>.
 *
 * @param key - Identifiant lisible
 */
export function useComments(key: string) {
  return useSuspenseQuery(commentsQuery(key)).data;
}

/**
 * Ajout optimiste d'un commentaire : il s'affiche immédiatement.
 *
 * @param key - Identifiant lisible
 * @returns La mutation d'ajout
 */
export function useAddComment(key: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCommentInput) => changesApi.addComment(key, input),
    ...optimisticHandlers<CommentItem[], CreateCommentInput>({
      queryKey: queryKeys.changes.comments(key),
      updater: (old = [], input) => {
        const me = queryClient.getQueryData(meQuery().queryKey);
        return [
          ...old,
          {
            id: createTempId(),
            author: me ?? { id: "", name: "Moi", email: "" },
            body: input.body,
            createdAt: new Date().toISOString(),
          },
        ];
      },
      messages: { success: "Commentaire publié" },
      invalidateKeys: [queryKeys.changes.activity(key)],
    }),
  });
}

/**
 * Historique d'activité. À utiliser sous un <Suspense>.
 *
 * @param key - Identifiant lisible
 */
export function useActivity(key: string) {
  return useSuspenseQuery(activityQuery(key)).data;
}

/**
 * Révisions figées par les gates. À utiliser sous un <Suspense>.
 *
 * @param key - Identifiant lisible
 */
export function useRevisions(key: string) {
  return useSuspenseQuery(revisionsQuery(key)).data;
}
