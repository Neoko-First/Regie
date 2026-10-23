"use client";

import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { IconButton } from "@/components/ui-extended/icon-button";

/**
 * Bouton d'ouverture / repli de la sidebar, avec tooltip (remplace `SidebarTrigger`,
 * qui n'en a pas). Raccourci clavier natif de shadcn : Ctrl+B.
 */
export function SidebarToggle() {
  const { toggleSidebar } = useSidebar();
  return (
    <IconButton
      label="Afficher ou masquer la barre latérale (Ctrl+B)"
      size="icon-sm"
      onClick={toggleSidebar}
    >
      <PanelLeft />
    </IconButton>
  );
}
