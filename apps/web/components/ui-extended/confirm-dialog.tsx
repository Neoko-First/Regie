"use client";

import { Loader2, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** Propriétés de `ConfirmDialog`. */
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Rappel clair de ce qui sera supprimé ou modifié de façon irréversible */
  description: ReactNode;
  confirmLabel?: string;
  /** Icône du bouton de confirmation (par défaut : corbeille) */
  confirmIcon?: ReactNode;
  /** Action irréversible : la modale attend sa fin ; une exception la garde ouverte */
  onConfirm: () => Promise<unknown>;
}

/**
 * Confirmation d'une action irréversible (suppression, révocation…), CLAUDE.md §10.
 * L'action n'est pas optimiste : on attend la réponse du serveur avec un spinner.
 * Le toast d'erreur éventuel est affiché par la mutation (gestion globale).
 *
 * @example
 * <ConfirmDialog open={open} onOpenChange={setOpen} title="Supprimer l'évolution ?"
 *   description={<>L'évolution <strong>SOC-12</strong> sera définitivement supprimée.</>}
 *   onConfirm={() => deleteChange.mutateAsync(id)} />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Supprimer",
  confirmIcon = <Trash2 />,
  onConfirm,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  async function handleConfirm(event: React.MouseEvent) {
    // Empêche la fermeture automatique : on attend la réponse du serveur
    event.preventDefault();
    setPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Erreur déjà signalée par le toast global de la mutation : la modale reste ouverte
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={handleConfirm}>
            {pending ? <Loader2 className="animate-spin" /> : confirmIcon} {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
