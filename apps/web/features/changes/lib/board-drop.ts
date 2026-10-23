import {
  CHANGE_STATUS_LABELS,
  type ChangeStatus,
  checkTransition,
  getTransitionsFrom,
  type SpaceRole,
  type Transition,
} from "@regie/shared";

// Glisser-déposer du board : traduit « carte déposée dans une colonne » en transition du
// workflow. Aucune règle n'est réécrite ici : tout passe par `checkTransition` (@regie/shared),
// que l'API applique aussi. Le front ne fait qu'anticiper sa réponse.

/** Utilisateur qui déplace la carte. */
export interface BoardActor {
  userId: string;
  /** Rôles de l'utilisateur dans l'espace de l'évolution */
  roles: readonly SpaceRole[];
}

/** Carte déplacée (champs utiles d'une évolution). */
export interface BoardCard {
  status: ChangeStatus;
  author: { id: string };
}

/** Ce qu'implique le dépôt d'une carte dans une colonne. */
export type BoardDrop =
  /** Colonne d'origine : rien à faire */
  | { kind: "same" }
  /** Pas de passage direct entre ces deux statuts, ou passage refusé à cet utilisateur */
  | { kind: "forbidden"; reason: string }
  /** Transition simple vers l'avant : appliquée tout de suite (optimiste) */
  | { kind: "move"; transition: Transition }
  /** Gate (validation tracée) ou renvoi en arrière : confirmation explicite d'abord */
  | { kind: "confirm"; transition: Transition };

/**
 * Détermine l'effet du dépôt d'une carte dans la colonne d'un statut.
 *
 * @param card - Évolution déplacée (statut actuel, auteur)
 * @param target - Statut de la colonne de dépôt
 * @param actor - Utilisateur et ses rôles dans l'espace
 * @returns L'effet du dépôt, avec le motif lisible d'un refus
 * @example resolveBoardDrop(change, "IN_TESTING", { userId, roles: ["DEV"] }) // { kind: "move", … }
 */
export function resolveBoardDrop(
  card: BoardCard,
  target: ChangeStatus,
  actor: BoardActor,
): BoardDrop {
  if (target === card.status) return { kind: "same" };

  // Dans le workflow, deux statuts sont reliés par au plus une transition
  const transition = getTransitionsFrom(card.status).find((candidate) => candidate.to === target);
  if (!transition) {
    return {
      kind: "forbidden",
      reason: `Pas de passage direct de « ${CHANGE_STATUS_LABELS[card.status]} » à « ${CHANGE_STATUS_LABELS[target]} ».`,
    };
  }

  const check = checkTransition(transition.id, card.status, {
    roles: actor.roles,
    isAuthor: card.author.id === actor.userId,
    // Le board est une interface humaine : les agents passent par le MCP
    isAgent: false,
  });
  if (!check.allowed) return { kind: "forbidden", reason: check.reason };

  return transition.gate || transition.backward
    ? { kind: "confirm", transition }
    : { kind: "move", transition };
}
