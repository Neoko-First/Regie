import type { ChangeStatus } from "./change";
import { hasAnyRole, type SpaceRole } from "./roles";

// Workflow UNIQUE des évolutions (D-008 : opinionated, codé, non configurable).
// La même définition sert à l'API (qui autorise ou refuse) et à l'UI (qui affiche les actions).
// « Le skill guide, l'API garantit » (D-020) : seule la vérification serveur fait foi.

/** Gates de validation humaine (D-009). */
export const GATES = ["FUNCTIONAL", "TECHNICAL", "ACCEPTANCE"] as const;

export type Gate = (typeof GATES)[number];

export const GATE_LABELS: Record<Gate, string> = {
  FUNCTIONAL: "Gate 1 · Fonctionnel",
  TECHNICAL: "Gate 2 · Technique",
  ACCEPTANCE: "Gate 3 · Recette",
};

/** Identifiants des transitions, utilisés dans l'API (`POST /changes/:key/transitions`). */
export const TRANSITION_IDS = [
  "submit_for_review",
  "back_to_draft",
  "approve_functional",
  "back_to_review",
  "approve_technical",
  "start_testing",
  "back_to_development",
  "back_to_review_from_testing",
  "approve_acceptance",
  "mark_delivered",
  "archive",
] as const;

export type TransitionId = (typeof TRANSITION_IDS)[number];

/** Définition d'une transition du workflow. */
export interface Transition {
  id: TransitionId;
  from: ChangeStatus;
  to: ChangeStatus;
  /** Libellé du bouton dans l'UI */
  label: string;
  /** Rôles autorisés (au moins un) */
  roles: readonly SpaceRole[];
  /** Si renseigné : passage d'un gate humain, qui fige une révision (D-010) */
  gate?: Gate;
  /** Transition « retour » (renvoi en arrière) : affichée de façon secondaire */
  backward?: boolean;
}

/**
 * Toutes les transitions autorisées. Toute transition absente de cette liste est interdite.
 * Cycle : Brouillon → En revue → [Gate 1] → Conception → [Gate 2] → En développement
 * → En recette → [Gate 3] → Recetté → Livré → Archivé.
 */
export const TRANSITIONS: readonly Transition[] = [
  {
    id: "submit_for_review",
    from: "DRAFT",
    to: "IN_REVIEW",
    label: "Soumettre en revue",
    roles: ["ADMIN", "PO", "LEAD_TECH", "DEV", "TESTER"],
  },
  {
    id: "back_to_draft",
    from: "IN_REVIEW",
    to: "DRAFT",
    label: "Renvoyer en brouillon",
    roles: ["PO"],
    backward: true,
  },
  {
    id: "approve_functional",
    from: "IN_REVIEW",
    to: "DESIGN",
    label: "Valider le fonctionnel",
    roles: ["PO"],
    gate: "FUNCTIONAL",
  },
  {
    id: "back_to_review",
    from: "DESIGN",
    to: "IN_REVIEW",
    label: "Renvoyer en revue",
    roles: ["PO", "LEAD_TECH"],
    backward: true,
  },
  {
    id: "approve_technical",
    from: "DESIGN",
    to: "IN_DEVELOPMENT",
    label: "Valider la technique",
    roles: ["LEAD_TECH"],
    gate: "TECHNICAL",
  },
  {
    id: "start_testing",
    from: "IN_DEVELOPMENT",
    to: "IN_TESTING",
    label: "Passer en recette",
    roles: ["LEAD_TECH", "DEV"],
  },
  {
    id: "back_to_development",
    from: "IN_TESTING",
    to: "IN_DEVELOPMENT",
    label: "Renvoyer en développement",
    roles: ["TESTER", "LEAD_TECH"],
    backward: true,
  },
  {
    id: "back_to_review_from_testing",
    from: "IN_TESTING",
    to: "IN_REVIEW",
    label: "Renvoyer en revue (spec à revoir)",
    roles: ["TESTER", "PO"],
    backward: true,
  },
  {
    id: "approve_acceptance",
    from: "IN_TESTING",
    to: "ACCEPTED",
    label: "Valider la recette",
    roles: ["TESTER"],
    gate: "ACCEPTANCE",
  },
  {
    id: "mark_delivered",
    from: "ACCEPTED",
    to: "DELIVERED",
    label: "Marquer comme livrée",
    roles: ["LEAD_TECH"],
  },
  {
    id: "archive",
    from: "DELIVERED",
    to: "ARCHIVED",
    label: "Archiver",
    roles: ["PO", "LEAD_TECH"],
  },
];

/**
 * Renvoie la définition d'une transition.
 *
 * @param id - Identifiant de la transition
 * @returns La transition (toujours définie pour un `TransitionId` valide)
 */
export function getTransition(id: TransitionId): Transition {
  return TRANSITIONS.find((transition) => transition.id === id)!;
}

/**
 * Transitions possibles depuis un statut, avant contrôle des droits.
 *
 * @param status - Statut actuel de l'évolution
 * @returns Les transitions partant de ce statut
 */
export function getTransitionsFrom(status: ChangeStatus): Transition[] {
  return TRANSITIONS.filter((transition) => transition.from === status);
}

/** Acteur qui demande une transition. */
export interface TransitionActor {
  /** Rôles de l'acteur dans l'espace de l'évolution */
  roles: readonly SpaceRole[];
  /** Vrai si l'acteur est l'auteur de l'évolution */
  isAuthor: boolean;
  /** Vrai si l'action vient d'un agent IA (jeton de délégation MCP) */
  isAgent: boolean;
}

/** Résultat du contrôle d'une transition, avec un motif lisible en cas de refus. */
export type TransitionCheck = { allowed: true } | { allowed: false; reason: string };

/**
 * Vérifie qu'un acteur peut effectuer une transition depuis le statut actuel.
 * Règles : la transition existe depuis ce statut ; l'acteur a l'un des rôles requis ;
 * un gate n'est jamais validé par un agent (D-009) ni par l'auteur de l'évolution (Q-022).
 *
 * @param transitionId - Transition demandée
 * @param status - Statut actuel de l'évolution
 * @param actor - Rôles et nature de l'acteur
 * @returns `{ allowed: true }` ou le motif du refus
 */
export function checkTransition(
  transitionId: TransitionId,
  status: ChangeStatus,
  actor: TransitionActor,
): TransitionCheck {
  const transition = getTransition(transitionId);
  if (transition.from !== status) {
    return { allowed: false, reason: "Cette action n'est pas possible au statut actuel." };
  }
  if (transition.gate && actor.isAgent) {
    return {
      allowed: false,
      reason: "Un agent ne peut pas valider un gate : validation humaine requise.",
    };
  }
  if (!hasAnyRole(actor.roles, transition.roles)) {
    return { allowed: false, reason: "Votre rôle dans cet espace ne permet pas cette action." };
  }
  if (transition.gate && actor.isAuthor) {
    return {
      allowed: false,
      reason: "L'auteur d'une évolution ne peut pas valider ses propres gates.",
    };
  }
  return { allowed: true };
}

/**
 * Transitions que l'acteur peut effectuer maintenant (pour afficher les boutons).
 *
 * @param status - Statut actuel de l'évolution
 * @param actor - Rôles et nature de l'acteur
 * @returns Les transitions autorisées, chacune avec son éventuel motif de refus pour l'UI
 */
export function getAvailableTransitions(
  status: ChangeStatus,
  actor: TransitionActor,
): Array<Transition & { check: TransitionCheck }> {
  return getTransitionsFrom(status).map((transition) => ({
    ...transition,
    check: checkTransition(transition.id, status, actor),
  }));
}
