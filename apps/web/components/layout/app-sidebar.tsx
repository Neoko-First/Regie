"use client";

import { APP_NAME } from "@regie/shared";
import { Clapperboard, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useCommandPaletteStore } from "@/stores/command-palette-store";
import { isNavItemActive, NAV_ITEMS } from "./nav-items";
import { ThemeMenu } from "./theme-menu";

/**
 * Liens de navigation principaux.
 *
 * @param props.activePath - Chemin courant (`null` : aucun lien mis en avant)
 */
function NavLinks({ activePath }: { activePath: string | null }) {
  return (
    <SidebarMenu>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton
            asChild
            tooltip={label}
            isActive={activePath !== null && isNavItemActive(activePath, href)}
          >
            <Link href={href}>
              <Icon />
              <span>{label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

/**
 * Navigation avec le lien actif. Lire l'URL (`usePathname`) rend ce composant propre à chaque
 * page : avec Cache Components, il doit être sous <Suspense> pour que la coquille commune
 * reste prérendue (sinon le build échoue sur les routes dynamiques comme /changes/[key]).
 */
function ActiveNavLinks() {
  return <NavLinks activePath={usePathname()} />;
}

/**
 * Barre latérale de l'application (shadcn `Sidebar`, variante `inset`, repliable en icônes).
 *
 * @param props.userMenu - Menu de l'utilisateur, rendu côté serveur (préchargement + Suspense)
 */
export function AppSidebar({ userMenu }: { userMenu: ReactNode }) {
  const openCommandPalette = useCommandPaletteStore((s) => s.setOpen);

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={APP_NAME}>
              <Link href="/inbox">
                {/* Identité cinéma (D-024) : le clap, discret */}
                <span className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Clapperboard className="size-4" />
                </span>
                <span className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">{APP_NAME}</span>
                  <span className="text-muted-foreground text-xs">De la spec à la recette</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Rechercher (Ctrl+K)"
              onClick={() => openCommandPalette(true)}
            >
              <Search />
              <span>Rechercher</span>
              <KbdGroup className="ml-auto">
                <Kbd>Ctrl</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <Suspense fallback={<NavLinks activePath={null} />}>
              <ActiveNavLinks />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeMenu />
          </SidebarMenuItem>
          <SidebarMenuItem>{userMenu}</SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
