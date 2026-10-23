import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { meQuery } from "@/features/auth/api";
import { CreateChangeDialog } from "@/features/changes/components/create-change-dialog";
import { spacesQuery } from "@/features/spaces/api";
import { UserMenu, UserMenuSkeleton } from "@/features/auth/components/user-menu";
import { Prefetch } from "@/lib/server/prefetch";

/**
 * Coquille des pages de l'application : sidebar (variante `inset`), zone de contenu
 * et palette de commandes. Les pages hors application (connexion…) vivent hors de ce groupe.
 * Seul le menu utilisateur lit la session : il est isolé sous un <Suspense> pour que le reste
 * de la coquille s'affiche immédiatement (Cache Components).
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      <AppSidebar
        userMenu={
          <Suspense fallback={<UserMenuSkeleton />}>
            <Prefetch requests={[{ query: meQuery(), path: "/auth/me" }]}>
              <UserMenu />
            </Prefetch>
          </Suspense>
        }
      />
      {/* min-w-0 : un contenu large (board) défile dans la page au lieu d'élargir la coquille */}
      <SidebarInset className="min-w-0">{children}</SidebarInset>
      <CommandPalette />
      {/* Modale « Nouvelle évolution », ouverte depuis les pages et la palette ⌘K */}
      <Suspense fallback={null}>
        <Prefetch requests={[{ query: spacesQuery(), path: "/spaces" }]}>
          <CreateChangeDialog />
        </Prefetch>
      </Suspense>
    </SidebarProvider>
  );
}
