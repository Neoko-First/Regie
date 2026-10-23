"use client";

import {
  CHANGE_STATUS_LABELS,
  type ChangeStatus,
  type Gate,
  GATE_LABELS,
  type TransitionId,
} from "@regie/shared";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useTransition } from "../hooks/use-transition";

/** Longueur maximale du commentaire de transition (identique à l'API). */
const COMMENT_MAX_LENGTH = 10_000;

/** Transition à confirmer (définition du workflow ou action disponible renvoyée par l'API). */
export interface ConfirmableTransition {
  id: TransitionId;
  label: string;
  to: ChangeStatus;
  gate?: Gate | null;
  backward?: boolean;
}

/** Propriétés de `TransitionDialog`. */
export interface TransitionDialogProps {
  /** Évolution concernée ; `revision` (révision actuelle) est connue sur la page de détail */
  change: { key: string; status: ChangeStatus; revision?: number };
  transition: ConfirmableTransition;
  onClose: () => void;
}

/**
 * Confirmation d'une transition (page de l'évolution et glisser-déposer du board).
 * Pour un gate, rappelle que la validation est tracée et fige une révision.
 * Le commentaire est facultatif. Non optimiste : la modale attend la réponse de l'API.
 */
export function TransitionDialog({ change, transition, onClose }: TransitionDialogProps) {
  const mutation = useTransition(change.key);
  const [comment, setComment] = useState("");
  const commentId = `transition-comment-${transition.id}`;

  async function confirm() {
    try {
      await mutation.mutateAsync({
        transition: transition.id,
        fromStatus: change.status,
        comment: comment.trim() || undefined,
      });
      onClose();
    } catch {
      // Toast d'erreur affiché par la gestion globale ; la modale reste ouverte
    }
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && !mutation.isPending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {transition.gate ? GATE_LABELS[transition.gate] : transition.label}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {transition.gate ? (
              <>
                Vous validez <strong>{change.key}</strong> telle qu&apos;elle est affichée. Cette
                validation est tracée à votre nom et fige{" "}
                {change.revision === undefined
                  ? "une nouvelle révision"
                  : `la révision r${change.revision + 1}`}
                .
              </>
            ) : (
              <>
                <strong>{change.key}</strong> passera au statut «{" "}
                {CHANGE_STATUS_LABELS[transition.to]} ».
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field>
          <FieldLabel htmlFor={commentId}>Commentaire (facultatif)</FieldLabel>
          <Textarea
            id={commentId}
            value={comment}
            maxLength={COMMENT_MAX_LENGTH}
            rows={3}
            onChange={(event) => setComment(event.target.value)}
          />
          {transition.backward ? (
            <FieldDescription>Expliquez ce qui doit être repris.</FieldDescription>
          ) : null}
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Annuler</AlertDialogCancel>
          <Button
            variant={transition.gate ? "success" : "default"}
            disabled={mutation.isPending}
            onClick={confirm}
          >
            {mutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : transition.gate ? (
              <ShieldCheck />
            ) : (
              <ArrowRight />
            )}
            {transition.label}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
