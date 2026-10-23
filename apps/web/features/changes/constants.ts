import {
  CHANGE_NATURE_LABELS,
  CHANGE_NATURES,
  CHANGE_PRIORITIES,
  CHANGE_PRIORITY_LABELS,
  CHANGE_STATUSES,
  type ChangeStatus,
} from "@regie/shared";
import type { SelectOption } from "@/components/ui-extended/form-fields";

/** Colonnes du board : tout le cycle, sauf les évolutions archivées. */
export const BOARD_STATUSES: readonly ChangeStatus[] = CHANGE_STATUSES.filter(
  (status) => status !== "ARCHIVED",
);

/** Options du choix de la nature (avec la règle de décision en aide, D-066). */
export const NATURE_OPTIONS: readonly SelectOption[] = CHANGE_NATURES.map((nature) => ({
  value: nature,
  label: CHANGE_NATURE_LABELS[nature].label,
  hint: CHANGE_NATURE_LABELS[nature].hint,
}));

/** Options du choix de la priorité. */
export const PRIORITY_OPTIONS: readonly SelectOption[] = CHANGE_PRIORITIES.map((priority) => ({
  value: priority,
  label: CHANGE_PRIORITY_LABELS[priority],
}));

/** Vues de la page Évolutions (paramètre d'URL `vue`). */
export const CHANGE_VIEWS = { board: "board", list: "list" } as const;

export type ChangeView = (typeof CHANGE_VIEWS)[keyof typeof CHANGE_VIEWS];
