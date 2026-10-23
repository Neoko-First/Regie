import type {
  AddMemberData,
  AddMemberResult,
  CreateSpaceInput,
  InvitationInfo,
  SpaceMember,
  SpaceRole,
  SpaceSummary,
  UserSummary,
} from "@regie/shared";
import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

// Options de cache du domaine « espaces » (partagées entre hooks et préchargement serveur).

/** Données peu changeantes : on évite de les recharger à chaque écran. */
const STABLE_DATA_STALE_TIME_MS = 5 * 60_000;

/** Chemin des membres d'un espace. */
export const spaceMembersPath = (spaceKey: string) => `/spaces/${spaceKey}/members`;

/** Chemin des invitations en attente d'un espace. */
export const spaceInvitationsPath = (spaceKey: string) => `/spaces/${spaceKey}/invitations`;

/** Espaces de l'utilisateur, avec ses rôles. */
export const spacesQuery = () =>
  queryOptions({
    queryKey: queryKeys.spaces.list(),
    queryFn: () => apiClient.get<SpaceSummary[]>("/spaces"),
    staleTime: STABLE_DATA_STALE_TIME_MS,
  });

/** Membres d'un espace (choix de l'assigné). */
export const spaceMembersQuery = (spaceKey: string) =>
  queryOptions({
    queryKey: queryKeys.spaces.members(spaceKey),
    queryFn: () => apiClient.get<SpaceMember[]>(spaceMembersPath(spaceKey)),
    staleTime: STABLE_DATA_STALE_TIME_MS,
  });

/** Annuaire des utilisateurs. */
export const usersQuery = () =>
  queryOptions({
    queryKey: queryKeys.users.all,
    queryFn: () => apiClient.get<UserSummary[]>("/users"),
    staleTime: STABLE_DATA_STALE_TIME_MS,
  });

/** Invitations en attente d'un espace (admins de l'espace). */
export const spaceInvitationsQuery = (spaceKey: string) =>
  queryOptions({
    queryKey: queryKeys.spaces.invitations(spaceKey),
    queryFn: () => apiClient.get<InvitationInfo[]>(spaceInvitationsPath(spaceKey)),
  });

/** Requêtes de modification des espaces, des membres et des invitations. */
export const spacesApi = {
  create: (input: CreateSpaceInput) => apiClient.post<SpaceSummary>("/spaces", input),
  addMember: (spaceKey: string, input: AddMemberData) =>
    apiClient.post<AddMemberResult>(spaceMembersPath(spaceKey), input),
  setMemberRoles: (spaceKey: string, userId: string, roles: SpaceRole[]) =>
    apiClient.put<SpaceMember>(`${spaceMembersPath(spaceKey)}/${userId}`, { roles }),
  removeMember: (spaceKey: string, userId: string) =>
    apiClient.delete(`${spaceMembersPath(spaceKey)}/${userId}`),
  resendInvitation: (spaceKey: string, invitationId: string) =>
    apiClient.post<InvitationInfo>(`${spaceInvitationsPath(spaceKey)}/${invitationId}/resend`),
  revokeInvitation: (spaceKey: string, invitationId: string) =>
    apiClient.delete(`${spaceInvitationsPath(spaceKey)}/${invitationId}`),
};
