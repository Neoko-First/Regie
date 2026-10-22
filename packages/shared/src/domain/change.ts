// Évolution (« Change » dans le code, D-080) : statuts, natures, priorités et libellés.

/**
 * Statuts d'une évolution, dans l'ordre du cycle de vie (D-007, axe 1 : piloté par les humains).
 * L'état de livraison (axe 2, déduit de GitLab) viendra plus tard.
 */
export const CHANGE_STATUSES = [
  "DRAFT",
  "IN_REVIEW",
  "DESIGN",
  "IN_DEVELOPMENT",
  "IN_TESTING",
  "ACCEPTED",
  "DELIVERED",
  "ARCHIVED",
] as const;

export type ChangeStatus = (typeof CHANGE_STATUSES)[number];

/** Libellés français des statuts (colonnes du board). */
export const CHANGE_STATUS_LABELS: Record<ChangeStatus, string> = {
  DRAFT: "Brouillon",
  IN_REVIEW: "En revue",
  DESIGN: "Conception",
  IN_DEVELOPMENT: "En développement",
  IN_TESTING: "En recette",
  ACCEPTED: "Recetté",
  DELIVERED: "Livré",
  ARCHIVED: "Archivé",
};

/** Statuts dans lesquels le contenu d'une évolution n'est plus modifiable. */
export const LOCKED_CHANGE_STATUSES: readonly ChangeStatus[] = ["DELIVERED", "ARCHIVED"];

/**
 * Natures de travail (D-065, D-075). La question décisive : le comportement attendu
 * est-il déjà décrit ?
 */
export const CHANGE_NATURES = [
  "EVOLUTION",
  "MODIFICATION",
  "CORRECTION",
  "CATCH_UP",
  "TAKEOVER",
] as const;

export type ChangeNature = (typeof CHANGE_NATURES)[number];

/** Libellés et définitions des natures, pour l'UI. */
export const CHANGE_NATURE_LABELS: Record<ChangeNature, { label: string; hint: string }> = {
  EVOLUTION: { label: "Évolution", hint: "Comportement jamais décrit" },
  MODIFICATION: { label: "Modification", hint: "Le comportement décrit change" },
  CORRECTION: { label: "Correction", hint: "Le code s'écarte de ce qui est décrit" },
  CATCH_UP: { label: "Rattrapage", hint: "Code antérieur aux specs, rien n'est décrit" },
  TAKEOVER: { label: "Reprise", hint: "Reprise d'une fonction des logiciels existants" },
};

/** Priorités d'une évolution. */
export const CHANGE_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type ChangePriority = (typeof CHANGE_PRIORITIES)[number];

export const CHANGE_PRIORITY_LABELS: Record<ChangePriority, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  URGENT: "Urgente",
};

/** Format d'un identifiant d'évolution lisible : clé de l'espace + numéro (D-071). */
export const CHANGE_KEY_PATTERN = /^([A-Z][A-Z0-9]{1,5})-(\d+)$/;

/**
 * Construit l'identifiant lisible d'une évolution.
 *
 * @param spaceKey - Clé de l'espace (ex. « SOC »)
 * @param number - Numéro de l'évolution dans l'espace
 * @returns L'identifiant, ex. « SOC-12 »
 */
export function formatChangeKey(spaceKey: string, number: number): string {
  return `${spaceKey}-${number}`;
}

/**
 * Décompose un identifiant d'évolution.
 *
 * @param key - Identifiant, ex. « SOC-12 »
 * @returns La clé d'espace et le numéro, ou `null` si le format est invalide
 */
export function parseChangeKey(key: string): { spaceKey: string; number: number } | null {
  const match = CHANGE_KEY_PATTERN.exec(key);
  if (!match) return null;
  return { spaceKey: match[1]!, number: Number(match[2]) };
}
