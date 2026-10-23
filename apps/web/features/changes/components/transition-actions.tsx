"use client";

import { type AvailableTransition, type ChangeDetail } from "@regie/shared";
import { ArrowRight, ChevronDown, Undo2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TransitionDialog } from "./transition-dialog";

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
