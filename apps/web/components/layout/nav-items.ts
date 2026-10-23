import { Inbox, type LucideIcon, SquareKanban } from "lucide-react";

/** Entrée de navigation principale, partagée par la sidebar et la palette de commandes. */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Texte d'aide affiché dans la palette de commandes */
  description: string;
}

/**
 * Navigation principale de l'application. Source unique : la sidebar et la palette
 * de commandes (⌘K) se construisent à partir de cette liste.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: "Ma boîte",
    href: "/inbox",
    icon: Inbox,
    description: "Ce qui attend une action de ma part",
  },
  {
    label: "Évolutions",
    href: "/changes",
    icon: SquareKanban,
    description: "Board et liste des évolutions",
  },
];

/**
 * Indique si une entrée de navigation correspond à la page courante (sous-pages comprises).
 *
 * @param pathname - Chemin courant
 * @param href - Chemin de l'entrée
 * @returns `true` si l'entrée doit être affichée comme active
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
