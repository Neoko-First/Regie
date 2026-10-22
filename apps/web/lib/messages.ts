// Textes récurrents des toasts et états d'erreur (CLAUDE.md §11).
// Les messages propres à un domaine vivent dans `features/<domaine>/`.

/**
 * Messages génériques affichés à l'utilisateur.
 */
export const MESSAGES = {
  errors: {
    generic: "Une erreur est survenue. Réessayez dans un instant.",
    network: "Impossible de joindre le serveur. Vérifiez votre connexion.",
    unavailable: "Le service est momentanément indisponible. Réessayez dans quelques instants.",
    refresh: "Les données affichées n'ont pas pu être actualisées.",
    unauthenticated: "Votre session a expiré. Reconnectez-vous.",
    forbidden: "Vous n'avez pas les droits pour effectuer cette action.",
    notFound: "L'élément demandé est introuvable.",
  },
  success: {
    saved: "Modifications enregistrées",
    deleted: "Suppression effectuée",
  },
} as const;
