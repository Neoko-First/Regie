import { SPACE_ROLE_LABELS, SPACE_ROLES } from "@regie/shared";
import type { SelectOption } from "@/components/ui-extended/form-fields";

/** Rôles proposés dans les formulaires (cumulables, D-063). */
export const ROLE_OPTIONS: readonly SelectOption[] = SPACE_ROLES.map((role) => ({
  value: role,
  label: SPACE_ROLE_LABELS[role],
}));

/** Chemin de l'administration des espaces. */
export const ADMIN_SPACES_PATH = "/admin/spaces";

/**
 * Chemin de l'administration d'un espace (membres et invitations).
 *
 * @param spaceKey - Clé de l'espace
 * @returns Le chemin de la page
 * @example adminSpacePath("SOC") // "/admin/spaces/SOC"
 */
export const adminSpacePath = (spaceKey: string) => `${ADMIN_SPACES_PATH}/${spaceKey}`;
