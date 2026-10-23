import type { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarToggle } from "./sidebar-toggle";

/** Propriétés de l'en-tête de page. */
export interface PageHeaderProps {
  /** Titre de la page (h1) */
  title: string;
  /** Actions affichées à droite (boutons, filtres…) */
  actions?: ReactNode;
}

/**
 * En-tête commun à toutes les pages de l'application : bouton de la sidebar, titre et actions.
 * Server Component : il peut être rendu directement par une `page.tsx`.
 *
 * @example <PageHeader title="Évolutions" actions={<NewChangeButton />} />
 */
export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
      <SidebarToggle />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
      <h1 className="truncate text-sm font-semibold">{title}</h1>
      {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
