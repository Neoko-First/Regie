"use client";

import { ChevronsUpDown, LogOut, MonitorSmartphone, ShieldOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui-extended/confirm-dialog";
import { initials } from "@/components/ui-extended/user-avatar";
import { useCurrentUser } from "../hooks/use-current-user";
import { useLogout, useLogoutAll } from "../hooks/use-logout";
import { LOGOUT_ALL_DESCRIPTION } from "../messages";

/**
 * Menu de l'utilisateur connecté (pied de la sidebar) : appareils connectés et déconnexion.
 * À rendre sous un <Suspense> (utilisateur préchargé côté serveur).
 */
export function UserMenu() {
  const user = useCurrentUser();
  const logout = useLogout();
  const logoutAll = useLogoutAll();
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton size="lg" tooltip={user.name}>
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <span className="grid flex-1 text-left leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-xs">{user.email}</span>
            </span>
            <ChevronsUpDown className="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-60">
          <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings/sessions">
              <MonitorSmartphone /> Appareils connectés
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => logout.mutate()} disabled={logout.isPending}>
            <LogOut /> Se déconnecter
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmLogoutAll(true)}>
            <ShieldOff /> Se déconnecter partout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmLogoutAll}
        onOpenChange={setConfirmLogoutAll}
        title="Se déconnecter de tous les appareils ?"
        description={LOGOUT_ALL_DESCRIPTION}
        confirmLabel="Tout déconnecter"
        confirmIcon={<ShieldOff />}
        onConfirm={() => logoutAll.mutateAsync()}
      />
    </>
  );
}

/** Emplacement du menu utilisateur pendant le chargement. */
export function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-2 p-2">
      <Skeleton className="size-8 rounded-lg" />
      <div className="flex flex-1 flex-col gap-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
