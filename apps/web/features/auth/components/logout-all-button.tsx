"use client";

import { ShieldOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui-extended/confirm-dialog";
import { useLogoutAll } from "../hooks/use-logout";
import { LOGOUT_ALL_DESCRIPTION } from "../messages";

/** Bouton « Tout déconnecter », avec confirmation (action irréversible). */
export function LogoutAllButton() {
  const logoutAll = useLogoutAll();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <ShieldOff /> Tout déconnecter
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Se déconnecter de tous les appareils ?"
        description={LOGOUT_ALL_DESCRIPTION}
        confirmLabel="Tout déconnecter"
        confirmIcon={<ShieldOff />}
        onConfirm={() => logoutAll.mutateAsync()}
      />
    </>
  );
}
