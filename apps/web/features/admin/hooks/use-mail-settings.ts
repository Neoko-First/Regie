"use client";

import type { MailSettingsData } from "@regie/shared";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { adminApi, mailSettingsQuery } from "../api";
import { TRANSPORT_LABELS } from "../constants";

/**
 * Réglages d'envoi des emails. À utiliser sous un <Suspense>.
 *
 * @returns Les réglages (jamais les clés)
 */
export function useMailSettings() {
  return useSuspenseQuery(mailSettingsQuery()).data;
}

/**
 * Enregistrement des réglages. NON optimiste : il touche à des secrets et à l'envoi réel.
 *
 * @returns La mutation
 */
export function useUpdateMailSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MailSettingsData) => adminApi.updateMailSettings(input),
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.admin.mailSettings(), settings);
      toast.success("Réglages d’envoi enregistrés");
    },
  });
}

/**
 * Envoi d'un email de test à l'administrateur connecté.
 *
 * @returns La mutation
 */
export function useSendTestEmail() {
  return useMutation({
    mutationFn: adminApi.sendTestEmail,
    onSuccess: ({ transport }) =>
      toast.success(
        `Email de test envoyé (${TRANSPORT_LABELS[transport]}) : vérifiez votre boîte.`,
      ),
  });
}
