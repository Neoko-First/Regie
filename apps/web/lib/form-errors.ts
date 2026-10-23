import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { isApiError } from "./api-client";

/**
 * Remonte les erreurs de champ renvoyées par l'API dans le formulaire (CLAUDE.md §9).
 *
 * @param form - Formulaire concerné
 * @param error - Erreur reçue (ignorée si ce n'est pas une erreur de l'API avec des champs)
 * @example
 * try { await mutation.mutateAsync(values); } catch (error) { applyFieldErrors(form, error); }
 */
export function applyFieldErrors<T extends FieldValues, C = unknown, O = T>(
  form: UseFormReturn<T, C, O>,
  error: unknown,
): void {
  if (!isApiError(error) || !error.fieldErrors) return;
  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    form.setError(field as Path<T>, { message: messages.join(" ") });
  }
}
