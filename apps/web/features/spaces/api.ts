import type { SpaceMember, SpaceSummary, UserSummary } from "@regie/shared";
import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

// Options de cache du domaine « espaces » (partagées entre hooks et préchargement serveur).

/** Données peu changeantes : on évite de les recharger à chaque écran. */
const STABLE_DATA_STALE_TIME_MS = 5 * 60_000;

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
    queryFn: () => apiClient.get<SpaceMember[]>(`/spaces/${spaceKey}/members`),
    staleTime: STABLE_DATA_STALE_TIME_MS,
  });

/** Annuaire des utilisateurs. */
export const usersQuery = () =>
  queryOptions({
    queryKey: queryKeys.users.all,
    queryFn: () => apiClient.get<UserSummary[]>("/users"),
    staleTime: STABLE_DATA_STALE_TIME_MS,
  });
