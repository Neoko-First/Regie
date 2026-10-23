import type { AuthUser, LoginInput, SessionInfo } from "@regie/shared";
import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

// Appels et options de cache du domaine « auth ». Les options (clé + fonction) sont définies
// ici une seule fois, pour être partagées par les hooks client et le préchargement serveur.

/** Requêtes HTTP du domaine auth (navigateur, via le proxy BFF). */
export const authApi = {
  login: (input: LoginInput) => apiClient.post<AuthUser>("/auth/login", input),
  logout: () => apiClient.post<void>("/auth/logout"),
  logoutAll: () => apiClient.post<void>("/auth/logout-all"),
  revokeSession: (sessionId: string) => apiClient.delete(`/auth/sessions/${sessionId}`),
};

/** Utilisateur connecté. Donnée stable : on évite de la recharger trop souvent. */
export const meQuery = () =>
  queryOptions({
    queryKey: queryKeys.auth.me(),
    queryFn: () => apiClient.get<AuthUser>("/auth/me"),
    staleTime: 5 * 60_000,
  });

/** Sessions actives de l'utilisateur. */
export const sessionsQuery = () =>
  queryOptions({
    queryKey: queryKeys.auth.sessions(),
    queryFn: () => apiClient.get<SessionInfo[]>("/auth/sessions"),
  });
