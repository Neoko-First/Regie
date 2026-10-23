"use client";

import {
  type AvailableTransition,
  type ChangeDetail,
  CHANGE_STATUS_LABELS,
  GATE_LABELS,
} from "@regie/shared";
import { ArrowRight, ChevronDown, Loader2, Undo2, ShieldCheck } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTransition } from "../hooks/use-transition";

/** Longueur maximale du commentaire de transition (identique à l'API). */
const COMMENT_MAX_LENGTH = 10_000;

/**
 * Confirmation d'une transition. Pour un gate, rappelle que la validation est tracée
 * et fige une révision. Le commentaire est facultatif.
 */
function TransitionDialog({
  change,
  transition,
  onClose,
}: {
  change: ChangeDetail;
  transition: AvailableTransition;
  onClose: () => void;
}) {
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
                validation est tracée à votre nom et fige la révision r{change.revision + 1}.
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

/**
 * Actions de workflow de l'évolution (en haut à droite de la page, cf. REGIE.md §11).
 * Les actions vers l'avant sont des boutons ; une action refusée reste visible, grisée,
 * avec son motif en tooltip. Les renvois en arrière sont regroupés dans un menu.
 */
export function TransitionActions({ change }: { change: ChangeDetail }) {
  const [selected, setSelected] = useState<AvailableTransition | null>(null);
  const forward = change.transitions.filter((transition) => !transition.backward);
  const backward = change.transitions.filter(
    (transition) => transition.backward && transition.allowed,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {backward.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Undo2 /> Renvoyer <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {backward.map((transition) => (
              <DropdownMenuItem key={transition.id} onSelect={() => setSelected(transition)}>
                {transition.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {forward.map((transition) => {
        const button = (
          <Button
            size="sm"
            variant={transition.gate ? "success" : "default"}
            disabled={!transition.allowed}
            onClick={() => setSelected(transition)}
          >
            {transition.gate ? <ShieldCheck /> : <ArrowRight />}
            {transition.label}
          </Button>
        );
        if (transition.allowed) return <span key={transition.id}>{button}</span>;
        // Un bouton désactivé ne déclenche pas de tooltip : on l'enveloppe
        return (
          <Tooltip key={transition.id}>
            <TooltipTrigger asChild>
              <span tabIndex={0} aria-label={`${transition.label} : ${transition.reason ?? ""}`}>
                {button}
              </span>
            </TooltipTrigger>
            <TooltipContent>{transition.reason}</TooltipContent>
          </Tooltip>
        );
      })}

      {selected ? (
        <TransitionDialog change={change} transition={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
