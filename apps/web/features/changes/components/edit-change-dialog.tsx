"use client";

import {
  type ChangeDetail,
  type UpdateChangeInput,
  updateChangeSchema,
  type z,
} from "@regie/shared";
import { FieldGroup } from "@/components/ui/field";
import { FormDialog } from "@/components/ui-extended/form-dialog";
import { SelectField, TextareaField, TextField } from "@/components/ui-extended/form-fields";
import { useSpaceMembers } from "@/features/spaces/hooks/use-spaces";
import { NATURE_OPTIONS, PRIORITY_OPTIONS } from "../constants";
import { useUpdateChange } from "../hooks/use-changes";

/** Valeurs du formulaire « Informations ». */
type InfoValues = z.input<typeof updateChangeSchema>;

/**
 * N'envoie que les champs réellement modifiés (PATCH, CLAUDE.md §9).
 *
 * @param values - Valeurs validées du formulaire
 * @param dirty - Champs modifiés par l'utilisateur
 * @returns Le corps de la requête PATCH
 */
function pickDirty(
  values: UpdateChangeInput,
  dirty: Partial<Record<keyof UpdateChangeInput, unknown>>,
) {
  return Object.fromEntries(
    Object.entries(values).filter(([field]) => dirty[field as keyof UpdateChangeInput]),
  ) as UpdateChangeInput;
}

/**
 * Modale d'édition des informations d'une évolution : titre, nature, priorité, assigné.
 */
export function EditChangeDialog({
  change,
  open,
  onOpenChange,
}: {
  change: ChangeDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateChange(change.key);
  const members = useSpaceMembers(change.spaceKey);

  const defaultValues: InfoValues = {
    title: change.title,
    nature: change.nature,
    priority: change.priority,
    assigneeId: change.assignee?.id ?? null,
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Modifier ${change.key}`}
      schema={updateChangeSchema}
      defaultValues={defaultValues}
      onSubmit={(values, form) => update.mutate(pickDirty(values, form.formState.dirtyFields))}
    >
      {(form) => (
        <FieldGroup>
          <TextField control={form.control} name="title" label="Titre" />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              control={form.control}
              name="nature"
              label="Nature"
              options={NATURE_OPTIONS}
            />
            <SelectField
              control={form.control}
              name="priority"
              label="Priorité"
              options={PRIORITY_OPTIONS}
            />
          </div>
          <SelectField
            control={form.control}
            name="assigneeId"
            label="Assigné à"
            placeholder={members.isPending ? "Chargement des membres…" : undefined}
            emptyOption={{ label: "Personne", value: null }}
            options={(members.data ?? []).map((member) => ({
              value: member.user.id,
              label: member.user.name,
            }))}
          />
        </FieldGroup>
      )}
    </FormDialog>
  );
}

/** Champs markdown modifiables d'une évolution. */
export type MarkdownField = "proposal" | "plan" | "tasks";

/**
 * Modale d'édition d'un texte markdown (proposal, plan ou tasks).
 */
export function EditMarkdownDialog({
  change,
  field,
  label,
  open,
  onOpenChange,
}: {
  change: ChangeDetail;
  field: MarkdownField;
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateChange(change.key);
  const defaultValues: InfoValues = { [field]: change[field] };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${label} · ${change.key}`}
      description="Texte en markdown. Les gates déjà passés restent figés dans leurs révisions."
      schema={updateChangeSchema}
      defaultValues={defaultValues}
      onSubmit={(values) => update.mutate({ [field]: values[field] })}
    >
      {(form) => (
        <TextareaField
          control={form.control}
          name={field}
          label={label}
          rows={18}
          className="font-mono text-sm"
        />
      )}
    </FormDialog>
  );
}
