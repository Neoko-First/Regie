"use client";

import type { ChangePasswordInput, ForgotPasswordInput, ResetPasswordInput } from "@regie/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { LOGIN_PATH } from "../lib/safe-redirect";

// Parcours de mot de passe : actions d'authentification, donc NON optimistes (CLAUDE.md §6.3).

/**
 * Demande d'un lien de réinitialisation. La réponse est la même que le compte existe ou non.
 *
 * @returns La mutation
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      apiClient.post<void>("/auth/forgot-password", input),
  });
}

/**
 * Nouveau mot de passe depuis le lien reçu par email, puis retour à la connexion.
 *
 * @returns La mutation
 */
export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => apiClient.post<void>("/auth/reset-password", input),
    onSuccess: () => {
      toast.success("Mot de passe modifié : vous pouvez vous connecter.");
      router.replace(LOGIN_PATH);
    },
  });
}

/**
 * Changement du mot de passe par l'utilisateur connecté ; ses autres appareils sont déconnectés.
 *
 * @returns La mutation
 */
export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      apiClient.post<void>("/auth/change-password", input),
    onSuccess: () =>
      toast.success("Mot de passe modifié. Vos autres appareils ont été déconnectés."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.sessions() }),
  });
}
