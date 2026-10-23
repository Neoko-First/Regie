"use client";

import type { ComponentProps } from "react";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Champs de formulaire standard : React Hook Form (Controller) + composants `Field` de shadcn.
// Le label est toujours associé au champ (accessibilité) et l'erreur Zod affichée dessous.

/** Propriétés communes aux champs liés à React Hook Form. */
interface BaseFieldProps<TValues extends FieldValues> {
  control: Control<TValues>;
  name: FieldPath<TValues>;
  label: string;
  description?: string;
}

/** Propriétés de `TextField`. */
export type TextFieldProps<TValues extends FieldValues> = BaseFieldProps<TValues> &
  Omit<ComponentProps<typeof Input>, "name" | "value" | "onChange" | "onBlur">;

/**
 * Champ texte sur une ligne, lié au formulaire.
 *
 * @example <TextField control={form.control} name="title" label="Titre" autoFocus />
 */
export function TextField<TValues extends FieldValues>({
  control,
  name,
  label,
  description,
  ...inputProps
}: TextFieldProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input id={name} aria-invalid={fieldState.invalid} {...inputProps} {...field} />
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );
}

/** Propriétés de `TextareaField`. */
export type TextareaFieldProps<TValues extends FieldValues> = BaseFieldProps<TValues> &
  Omit<ComponentProps<typeof Textarea>, "name" | "value" | "onChange" | "onBlur">;

/**
 * Champ texte multiligne, lié au formulaire.
 *
 * @example <TextareaField control={form.control} name="summary" label="Résumé" rows={4} />
 */
export function TextareaField<TValues extends FieldValues>({
  control,
  name,
  label,
  description,
  ...textareaProps
}: TextareaFieldProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Textarea id={name} aria-invalid={fieldState.invalid} {...textareaProps} {...field} />
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );
}
