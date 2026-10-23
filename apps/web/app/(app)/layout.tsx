import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * Coquille des pages de l'application : sidebar (variante `inset`), zone de contenu
 * et palette de commandes. Les pages hors application (connexion…) vivent hors de ce groupe.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  );
}
