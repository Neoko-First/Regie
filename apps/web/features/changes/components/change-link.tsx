"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import type { ComponentProps } from "react";
import { isTempId } from "@/lib/optimistic";
import { changeQuery } from "../api";

/** Propriétés de `ChangeLink`. */
type ChangeLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  changeId: string;
  changeKey: string;
};

/**
 * Lien vers la page d'une évolution, qui précharge son détail au survol (CLAUDE.md §6.3) :
 * la page s'ouvre instantanément. Inactif tant que l'évolution n'est pas confirmée par le serveur.
 */
export function ChangeLink({ changeId, changeKey, children, ...props }: ChangeLinkProps) {
  const queryClient = useQueryClient();
  if (isTempId(changeId)) {
    return <span aria-busy="true">{children}</span>;
  }
  return (
    <Link
      href={`/changes/${changeKey}`}
      onMouseEnter={() => void queryClient.prefetchQuery(changeQuery(changeKey))}
      onFocus={() => void queryClient.prefetchQuery(changeQuery(changeKey))}
      {...props}
    >
      {children}
    </Link>
  );
}
