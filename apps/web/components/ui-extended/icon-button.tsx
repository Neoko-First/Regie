"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Propriétés d'`IconButton` : celles de `Button`, avec un libellé obligatoire. */
export type IconButtonProps = Omit<ComponentProps<typeof Button>, "aria-label"> & {
  /** Libellé de l'action : lu par les lecteurs d'écran et affiché dans le tooltip */
  label: string;
  /** Côté d'affichage du tooltip */
  tooltipSide?: ComponentProps<typeof TooltipContent>["side"];
};

/**
 * Bouton ne contenant qu'une icône. Impose un `aria-label` et un tooltip (CLAUDE.md §8).
 *
 * @example
 * <IconButton label="Copier le lien" onClick={copy}><Link2 /></IconButton>
 */
export function IconButton({
  label,
  tooltipSide,
  size = "icon",
  variant = "ghost",
  ...props
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button aria-label={label} size={size} variant={variant} {...props} />
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  );
}
