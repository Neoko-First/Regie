import type {
  ActivityItem,
  ChangeDetail,
  ChangeFilters,
  ChangeSummary,
  CommentItem,
  CreateChangeInput,
  CreateCommentInput,
  InboxContent,
  RevisionItem,
  TransitionRequest,
  UpdateChangeInput,
} from "@regie/shared";
import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { toQueryString } from "@/lib/url";

// Appels et options de cache du domaine « évolutions ». Chaque requête expose aussi
// son chemin d'API (`path`), utilisé par le préchargement serveur (`<Prefetch>`).

/** Chemins de l'API, définis une seule fois pour le client et le serveur. */
export const changesPaths = {
  list: (filters: ChangeFilters) =>
    `/changes${toQueryString({ space: filters.space, status: filters.status, assignee: filters.assignee })}`,
  detail: (key: string) => `/changes/${key}`,
  comments: (key: string) => `/changes/${key}/comments`,
  activity: (key: string) => `/changes/${key}/activity`,
  revisions: (key: string) => `/changes/${key}/revisions`,
  inbox: () => "/inbox",
};

/** Requêtes HTTP de modification. */
export const changesApi = {
  create: (input: CreateChangeInput) => apiClient.post<ChangeDetail>("/changes", input),
  update: (key: string, input: UpdateChangeInput) =>
    apiClient.patch<ChangeDetail>(changesPaths.detail(key), input),
  remove: (key: string) => apiClient.delete(changesPaths.detail(key)),
  transition: (key: string, request: TransitionRequest) =>
    apiClient.post<ChangeDetail>(`${changesPaths.detail(key)}/transitions`, request),
  addComment: (key: string, input: CreateCommentInput) =>
    apiClient.post<CommentItem>(changesPaths.comments(key), input),
};

/** Liste filtrée (board et liste). */
export const changesQuery = (filters: ChangeFilters) =>
  queryOptions({
    queryKey: queryKeys.changes.list(filters),
    queryFn: () => apiClient.get<ChangeSummary[]>(changesPaths.list(filters)),
  });

/** Détail d'une évolution, avec les actions possibles pour l'utilisateur. */
export const changeQuery = (key: string) =>
  queryOptions({
    queryKey: queryKeys.changes.detail(key),
    queryFn: () => apiClient.get<ChangeDetail>(changesPaths.detail(key)),
  });

export const commentsQuery = (key: string) =>
  queryOptions({
    queryKey: queryKeys.changes.comments(key),
    queryFn: () => apiClient.get<CommentItem[]>(changesPaths.comments(key)),
  });

export const activityQuery = (key: string) =>
  queryOptions({
    queryKey: queryKeys.changes.activity(key),
    queryFn: () => apiClient.get<ActivityItem[]>(changesPaths.activity(key)),
  });

export const revisionsQuery = (key: string) =>
  queryOptions({
    queryKey: queryKeys.changes.revisions(key),
    queryFn: () => apiClient.get<RevisionItem[]>(changesPaths.revisions(key)),
  });

/** « Ma boîte » : gates à valider et évolutions assignées. */
export const inboxQuery = () =>
  queryOptions({
    queryKey: queryKeys.inbox.all,
    queryFn: () => apiClient.get<InboxContent>(changesPaths.inbox()),
  });
