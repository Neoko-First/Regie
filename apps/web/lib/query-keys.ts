// Fabrique UNIQUE des clés de cache TanStack Query (CLAUDE.md §6.1).
// Structure hiérarchique par domaine : invalider `<domaine>.all` invalide aussi listes et détails.
//
// Modèle à suivre pour chaque domaine :
//
//   changes: {
//     all: ["changes"] as const,
//     lists: () => [...queryKeys.changes.all, "list"] as const,
//     list: (filters: ChangeFilters) => [...queryKeys.changes.lists(), filters] as const,
//     detail: (id: string) => [...queryKeys.changes.all, "detail", id] as const,
//   },

/**
 * Clés de cache de toutes les données serveur. Aucune clé ne doit être écrite en dur ailleurs.
 */
export const queryKeys = {} as const;
