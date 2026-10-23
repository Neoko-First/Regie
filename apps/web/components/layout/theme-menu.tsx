"use client";

import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useIsClient } from "@/hooks/use-is-client";
import { THEME_OPTIONS } from "./theme-options";

/**
 * Sélecteur de thème (clair / sombre / système) affiché dans le pied de la sidebar.
 */
export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();
  // Le thème choisi est lu dans le localStorage : inconnu côté serveur. On affiche « Système »
  // jusqu'à l'hydratation pour que le rendu client initial soit identique au rendu serveur.
  const current =
    (isClient && THEME_OPTIONS.find((option) => option.value === theme)) || THEME_OPTIONS[2]!;
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton tooltip="Thème">
          <CurrentIcon />
          <span>Thème : {current.label.toLowerCase()}</span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-48">
        <DropdownMenuLabel>Thème</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={current.value} onValueChange={setTheme}>
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
