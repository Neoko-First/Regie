import { type LucideIcon, Monitor, Moon, Sun } from "lucide-react";

/** Thème proposé à l'utilisateur (valeurs comprises par `next-themes`). */
export interface ThemeOption {
  value: "light" | "dark" | "system";
  label: string;
  icon: LucideIcon;
}

/**
 * Thèmes disponibles. Source unique pour le sélecteur de la sidebar et la palette de commandes.
 */
export const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Système", icon: Monitor },
];
