"use client";

import type {
  AddMemberData,
  CreateSpaceInput,
  InvitationInfo,
  SpaceMember,
  SpaceRole,
  SpaceSummary,
} from "@regie/shared";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { createTempId, optimisticHandlers } from "@/lib/optimistic";
import { queryKeys } from "@/lib/query-keys";
import { spaceInvitationsQuery, spaceMembersQuery, spacesApi } from "../api";

// Administration d'un espace : création (administrateur de la plateforme), membres et
// invitations (admins de l'espace). Les droits sont vérifiés par l'API.

/**
 * Membres d'un espace. À utiliser sous un <Suspense>.
 *
 * @param spaceKey - Clé de l'espace
 * @returns Les membres et leurs rôles
 */
export function useSpaceMemberList(spaceKey: string) {
  return useSuspenseQuery(spaceMembersQuery(spaceKey)).data;
}

/**
 * Invitations en attente d'un espace. À utiliser sous un <Suspense>.
 *
 * @param spaceKey - Clé de l'espace
 * @returns Les invitations, la plus récente en premier
 */
export function useSpaceInvitations(spaceKey: string) {
  return useSuspenseQuery(spaceInvitationsQuery(spaceKey)).data;
}

/**
 * Création d'un espace, optimiste : il apparaît tout de suite dans la liste.
 *
 * @returns La mutation
 */
export function useCreateSpace() {
  return useMutation({
    mutationFn: spacesApi.create,
    ...optimisticHandlers<SpaceSummary[], CreateSpaceInput>({
      queryKey: queryKeys.spaces.list(),
      updater: (old = [], input) =>
        [
          ...old,
          {
            id: createTempId(),
            key: input.key,
            name: input.name,
            description: input.description ?? "",
            myRoles: ["ADMIN" as const],
          },
        ].sort((a, b) => a.name.localeCompare(b.name, "fr")),
      messages: { success: "Espace créé" },
    }),
  });
}

/**
 * Ajout d'une personne par son email. NON optimiste : c'est l'API qui sait si la personne
 * a déjà un compte (rattachée) ou non (invitée), et le toast le dit.
 *
 * @param spaceKey - Clé de l'espace
 * @returns La mutation
 */
export function useAddMember(spaceKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddMemberData) => spacesApi.addMember(spaceKey, input),
    onSuccess: (result) =>
      toast.success(
        result.status === "ADDED"
          ? `${result.member.user.name} a été ajouté à l’espace`
          : `Invitation envoyée à ${result.invitation.email}`,
      ),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.spaces.members(spaceKey) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.spaces.invitations(spaceKey) }),
      ]),
  });
}

/** Variables de modification des rôles d'un membre. */
interface MemberRolesVariables {
  userId: string;
  roles: SpaceRole[];
}

/**
 * Modification des rôles d'un membre, optimiste.
 *
 * @param spaceKey - Clé de l'espace
 * @returns La mutation
 */
export function useSetMemberRoles(spaceKey: string) {
  return useMutation({
    mutationFn: ({ userId, roles }: MemberRolesVariables) =>
      spacesApi.setMemberRoles(spaceKey, userId, roles),
    ...optimisticHandlers<SpaceMember[], MemberRolesVariables>({
      queryKey: queryKeys.spaces.members(spaceKey),
      updater: (old = [], { userId, roles }) =>
        old.map((member) => (member.user.id === userId ? { ...member, roles } : member)),
      messages: { success: "Rôles mis à jour" },
      // Ses propres rôles ont pu changer : la liste des espaces (myRoles) aussi
      invalidateKeys: [queryKeys.spaces.list()],
    }),
  });
}

/**
 * Retrait d'un membre, optimiste (réversible : on peut le rajouter).
 *
 * @param spaceKey - Clé de l'espace
 * @returns La mutation
 */
export function useRemoveMember(spaceKey: string) {
  return useMutation({
    mutationFn: (userId: string) => spacesApi.removeMember(spaceKey, userId),
    ...optimisticHandlers<SpaceMember[], string>({
      queryKey: queryKeys.spaces.members(spaceKey),
      updater: (old = [], userId) => old.filter((member) => member.user.id !== userId),
      messages: { success: "Membre retiré de l’espace" },
      invalidateKeys: [queryKeys.spaces.list()],
    }),
  });
}

/**
 * Renvoi d'une invitation (nouveau lien). NON optimiste : on confirme l'envoi réel.
 *
 * @param spaceKey - Clé de l'espace
 * @returns La mutation
 */
export function useResendInvitation(spaceKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitation: InvitationInfo) => spacesApi.resendInvitation(spaceKey, invitation.id),
    onSuccess: (invitation) => toast.success(`Invitation renvoyée à ${invitation.email}`),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.invitations(spaceKey) }),
  });
}

/**
 * Révocation d'une invitation, optimiste : son lien cesse de fonctionner.
 *
 * @param spaceKey - Clé de l'espace
 * @returns La mutation
 */
export function useRevokeInvitation(spaceKey: string) {
  return useMutation({
    mutationFn: (invitationId: string) => spacesApi.revokeInvitation(spaceKey, invitationId),
    ...optimisticHandlers<InvitationInfo[], string>({
      queryKey: queryKeys.spaces.invitations(spaceKey),
      updater: (old = [], invitationId) => old.filter((item) => item.id !== invitationId),
      messages: { success: "Invitation révoquée" },
    }),
  });
}
