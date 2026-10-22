"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "@regie/shared";
import { Check, Loader2, RotateCcw } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import {
  type DefaultValues,
  type FieldValues,
  type Path,
  useForm,
  type UseFormReturn,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isApiError } from "@/lib/api-client";
import { DiscardChangesDialog } from "./discard-changes-dialog";

/**
 * Mode de soumission :
 * - `optimistic` : la modale se ferme dès la soumission valide, la mutation optimiste fait le reste ;
 * - `await` : la modale attend la réponse du serveur (actions critiques, CLAUDE.md §6.3).
 */
export type FormDialogMode = "optimistic" | "await";

/** Propriétés de `FormDialog`. */
export interface FormDialogProps<TInput extends FieldValues, TOutput> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Schéma Zod partagé (`@regie/shared`), le même que celui du DTO côté API */
  schema: z.ZodType<TOutput, TInput>;
  /** Valeurs initiales, référence pour `isDirty` (jamais `undefined`) */
  defaultValues: DefaultValues<TInput>;
  /** Reçoit les valeurs validées ; en mode `await`, une exception garde la modale ouverte */
  onSubmit: (
    values: TOutput,
    form: UseFormReturn<TInput, unknown, TOutput>,
  ) => void | Promise<void>;
  mode?: FormDialogMode;
  submitLabel?: string;
  /** Champs du formulaire */
  children: (form: UseFormReturn<TInput, unknown, TOutput>) => ReactNode;
}

/**
 * Modale de formulaire standard (CLAUDE.md §9 et §10) :
 * - formulaire réinitialisé à chaque ouverture ;
 * - « Annuler » remet les valeurs initiales sans fermer ;
 * - « Enregistrer » grisé tant que rien n'a changé ou qu'une requête est en cours ;
 * - confirmation avant de fermer si des modifications n'ont pas été enregistrées ;
 * - erreurs serveur par champ remontées via `setError`.
 *
 * @example
 * <FormDialog title="Nouvelle évolution" schema={createChangeSchema} defaultValues={{ title: "" }}
 *   open={open} onOpenChange={setOpen} onSubmit={(values) => createChange.mutate(values)}>
 *   {(form) => <TextField control={form.control} name="title" label="Titre" />}
 * </FormDialog>
 */
export function FormDialog<TInput extends FieldValues, TOutput>({
  open,
  onOpenChange,
  title,
  description,
  schema,
  defaultValues,
  onSubmit,
  mode = "optimistic",
  submitLabel = "Enregistrer",
  children,
}: FormDialogProps<TInput, TOutput>) {
  const form = useForm<TInput, unknown, TOutput>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const { isDirty, isSubmitting } = form.formState;
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Réinitialisation à chaque ouverture (et non à chaque rendu : `defaultValues` change d'identité)
  useEffect(() => {
    if (open) form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /** Fermeture demandée par la croix, l'overlay ou Échap : on protège les modifications. */
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) return;
    if (!nextOpen && isDirty) {
      setConfirmDiscard(true);
      return;
    }
    onOpenChange(nextOpen);
  }

  const submit = form.handleSubmit(async (values) => {
    if (mode === "optimistic") {
      // L'élément est déjà visible grâce à la mutation optimiste : on ferme tout de suite
      onOpenChange(false);
      await onSubmit(values, form);
      return;
    }
    try {
      await onSubmit(values, form);
      onOpenChange(false);
    } catch (error) {
      // Le toast d'erreur est géré par la mutation ; on rattache les erreurs aux champs
      if (isApiError(error) && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          form.setError(field as Path<TInput>, { message: messages.join(" ") });
        }
      }
    }
  });

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <form onSubmit={submit} noValidate className="flex flex-col gap-6">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description ? <DialogDescription>{description}</DialogDescription> : null}
            </DialogHeader>

            {children(form)}

            <DialogFooter>
              {/* Annuler = retour aux valeurs initiales, la modale reste ouverte */}
              <Button
                type="button"
                variant="outline"
                disabled={!isDirty || isSubmitting}
                onClick={() => form.reset()}
              >
                <RotateCcw /> Annuler
              </Button>
              <Button type="submit" variant="success" disabled={!isDirty || isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Check />} {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DiscardChangesDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        onDiscard={() => {
          setConfirmDiscard(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
