"use client";

import type { AcceptInvitationInput } from "@regie/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { invitationPreviewQuery, invitationsApi } from "../api";

/**
 * Aperçu d'une invitation (préchargé côté serveur). Non suspendu : un lien expiré ou
 * déjà utilisé s'affiche comme un état de la page, pas comme une erreur.
 *
 * @param token - Jeton du lien
 * @returns La requête TanStack
 */
export function useInvitationPreview(token: string) {
  return useQuery(invitationPreviewQuery(token));
}

/**
 * Acceptation d'une invitation : crée le compte et connecte l'invité. Action d'auth,
 * NON optimiste (CLAUDE.md §6.3).
 *
 * @returns La mutation
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (input: AcceptInvitationInput) => invitationsApi.accept(input),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.me(), user);
      // Les espaces de l'invité viennent de changer
      void queryClient.invalidateQueries({ queryKey: queryKeys.spaces.all });
      toast.success(`Bienvenue, ${user.name} : votre compte est créé`);
      router.replace("/");
    },
  });
}
