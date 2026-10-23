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
} as const;
