"use client";

import { Eye, EyeOff } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Champs de formulaire standard : React Hook Form (Controller) + composants `Field` de shadcn.
// Le label est toujours associé au champ (accessibilité) et l'erreur Zod affichée dessous.

/**
 * Propriétés communes aux champs liés à React Hook Form. `TTransformed` est le type des
 * valeurs après validation Zod (peut différer de la saisie, ex. email normalisé).
 */
interface BaseFieldProps<TValues extends FieldValues, TTransformed = TValues> {
  control: Control<TValues, unknown, TTransformed>;
  name: FieldPath<TValues>;
  label: string;
  description?: string;
}

/** Propriétés de `TextField`. */
export type TextFieldProps<TValues extends FieldValues, TTransformed = TValues> = BaseFieldProps<
  TValues,
  TTransformed
> &
  Omit<ComponentProps<typeof Input>, "name" | "value" | "onChange" | "onBlur">;

/**
 * Champ texte sur une ligne, lié au formulaire.
 *
 * @example <TextField control={form.control} name="title" label="Titre" autoFocus />
 */
export function TextField<TValues extends FieldValues, TTransformed = TValues>({
  control,
  name,
  label,
  description,
  ...inputProps
}: TextFieldProps<TValues, TTransformed>) {
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
export type TextareaFieldProps<
  TValues extends FieldValues,
  TTransformed = TValues,
> = BaseFieldProps<TValues, TTransformed> &
  Omit<ComponentProps<typeof Textarea>, "name" | "value" | "onChange" | "onBlur">;

/**
 * Champ texte multiligne, lié au formulaire.
 *
 * @example <TextareaField control={form.control} name="summary" label="Résumé" rows={4} />
 */
export function TextareaField<TValues extends FieldValues, TTransformed = TValues>({
  control,
  name,
  label,
  description,
  ...textareaProps
}: TextareaFieldProps<TValues, TTransformed>) {
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

/** Propriétés de `PasswordField`. */
export type PasswordFieldProps<
  TValues extends FieldValues,
  TTransformed = TValues,
> = BaseFieldProps<TValues, TTransformed> &
  Omit<ComponentProps<"input">, "name" | "value" | "onChange" | "onBlur" | "type">;

/**
 * Champ mot de passe avec bouton afficher / masquer (CLAUDE.md §12.2).
 *
 * @example <PasswordField control={form.control} name="password" label="Mot de passe" />
 */
export function PasswordField<TValues extends FieldValues, TTransformed = TValues>({
  control,
  name,
  label,
  description,
  ...inputProps
}: PasswordFieldProps<TValues, TTransformed>) {
  const [visible, setVisible] = useState(false);
  const toggleLabel = visible ? "Masquer le mot de passe" : "Afficher le mot de passe";

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={name}
              type={visible ? "text" : "password"}
              aria-invalid={fieldState.invalid}
              {...inputProps}
              {...field}
            />
            <InputGroupAddon align="inline-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <InputGroupButton
                    size="icon-xs"
                    aria-label={toggleLabel}
                    aria-pressed={visible}
                    onClick={() => setVisible((current) => !current)}
                  >
                    {visible ? <EyeOff /> : <Eye />}
                  </InputGroupButton>
                </TooltipTrigger>
                <TooltipContent>{toggleLabel}</TooltipContent>
              </Tooltip>
            </InputGroupAddon>
          </InputGroup>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );
}
