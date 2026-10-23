// Rôles par espace (D-013), cumulables (D-063) : les droits d'un membre sont l'union de ses rôles.

/** Rôles qu'un membre peut détenir dans un espace. */
export const SPACE_ROLES = ["ADMIN", "PO", "LEAD_TECH", "DEV", "TESTER", "READER"] as const;

export type SpaceRole = (typeof SPACE_ROLES)[number];

/** Libellés français des rôles, pour l'UI. */
export const SPACE_ROLE_LABELS: Record<SpaceRole, string> = {
  ADMIN: "Admin",
  PO: "PO",
  LEAD_TECH: "Lead tech",
  DEV: "Dev",
  TESTER: "Recetteur",
  READER: "Lecteur",
};

/** Rôles autorisés à créer et modifier des évolutions (tous sauf la lecture seule). */
export const CONTRIBUTOR_ROLES: readonly SpaceRole[] = [
  "ADMIN",
  "PO",
  "LEAD_TECH",
  "DEV",
  "TESTER",
];

/**
 * Indique si un membre détient au moins un des rôles demandés.
 *
 * @param memberRoles - Rôles du membre dans l'espace
 * @param required - Rôles acceptés
 * @returns `true` si l'un des rôles du membre fait partie des rôles acceptés
 * @example hasAnyRole(["DEV", "TESTER"], ["TESTER"]) // true
 */
export function hasAnyRole(
  memberRoles: readonly SpaceRole[],
  required: readonly SpaceRole[],
): boolean {
  return memberRoles.some((role) => required.includes(role));
}
