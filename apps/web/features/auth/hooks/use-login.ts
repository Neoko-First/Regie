"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { authApi } from "../api";
import { getSafeRedirect } from "../lib/safe-redirect";

/**
 * Connexion. Action d'auth : NON optimiste (CLAUDE.md §6.3), on attend la réponse du serveur.
 * En cas d'échec, le toast d'erreur global affiche le message de l'API (« Identifiants incorrects. »).
 *
 * @param next - Page à rouvrir après connexion (paramètre `next`, validé)
 * @returns La mutation de connexion
 */
export function useLogin(next: string | null) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      // L'utilisateur est déjà connu : la sidebar s'affiche sans nouvelle requête
      queryClient.setQueryData(queryKeys.auth.me(), user);
      toast.success(`Bienvenue, ${user.name}`);
      router.replace(getSafeRedirect(next));
    },
  });
}
