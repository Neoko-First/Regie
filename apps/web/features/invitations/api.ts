import type { AcceptInvitationInput, AuthUser, InvitationPreview } from "@regie/shared";
import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

/**
 * Chemin de l'aperçu d'une invitation (route publique de l'API).
 *
 * @param token - Jeton du lien reçu par email
 * @returns Le chemin à appeler
 */
export const invitationPreviewPath = (token: string) => `/invitations/${encodeURIComponent(token)}`;

/** Aperçu d'une invitation : adresse invitée, espace, auteur. */
export const invitationPreviewQuery = (token: string) =>
  queryOptions({
    queryKey: queryKeys.invitations.preview(token),
    queryFn: () => apiClient.get<InvitationPreview>(invitationPreviewPath(token)),
    // Le lien ne change pas pendant que la page est ouverte
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

/** Requêtes de modification du domaine « invitations ». */
export const invitationsApi = {
  accept: (input: AcceptInvitationInput) => apiClient.post<AuthUser>("/invitations/accept", input),
};
