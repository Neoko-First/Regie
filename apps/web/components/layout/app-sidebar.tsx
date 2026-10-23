"use client";

import { APP_NAME } from "@regie/shared";
import { Clapperboard, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
 * Barre latérale de l'application (shadcn `Sidebar`, variante `inset`, repliable en icônes).
 */
export function AppSidebar() {
  const pathname = usePathname();
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
            <SidebarMenu>
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={label}
                    isActive={isNavItemActive(pathname, href)}
                  >
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
