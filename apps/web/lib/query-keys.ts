import type { ChangeFilters } from "@regie/shared";

// Fabrique UNIQUE des clés de cache TanStack Query (CLAUDE.md §6.1).
// Structure hiérarchique par domaine : invalider `<domaine>.all` invalide aussi listes et détails.

/**
 * Clés de cache de toutes les données serveur. Aucune clé ne doit être écrite en dur ailleurs.
 */
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
    sessions: () => [...queryKeys.auth.all, "sessions"] as const,
  },
  users: {
    all: ["users"] as const,
  },
  spaces: {
    all: ["spaces"] as const,
    list: () => [...queryKeys.spaces.all, "list"] as const,
    members: (spaceKey: string) => [...queryKeys.spaces.all, "members", spaceKey] as const,
  },
  changes: {
    all: ["changes"] as const,
    lists: () => [...queryKeys.changes.all, "list"] as const,
    list: (filters: ChangeFilters) => [...queryKeys.changes.lists(), filters] as const,
    detail: (key: string) => [...queryKeys.changes.all, "detail", key] as const,
    comments: (key: string) => [...queryKeys.changes.detail(key), "comments"] as const,
    activity: (key: string) => [...queryKeys.changes.detail(key), "activity"] as const,
    revisions: (key: string) => [...queryKeys.changes.detail(key), "revisions"] as const,
  },
  inbox: {
    all: ["inbox"] as const,
  },
} as const;
