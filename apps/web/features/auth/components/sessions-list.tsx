"use client";

import type { SessionInfo } from "@regie/shared";
import { LogOut, Monitor } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui-extended/confirm-dialog";
import { formatDateTime, formatRelative } from "@/lib/format";
import { useRevokeSession, useSessions } from "../hooks/use-sessions";
import { describeUserAgent } from "../lib/describe-user-agent";

/**
 * Liste des appareils connectés, avec révocation des autres sessions.
 * À rendre sous un <Suspense> (sessions préchargées côté serveur).
 */
export function SessionsList() {
  const sessions = useSessions();
  const revoke = useRevokeSession();
  const [toRevoke, setToRevoke] = useState<SessionInfo | null>(null);

  return (
    <>
      <ul className="flex flex-col gap-3" aria-label="Appareils connectés">
        {sessions.map((session) => (
          <li key={session.id}>
            <Card>
              <CardContent className="flex items-center gap-4">
                <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Monitor className="size-4" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2 font-medium">
                    {describeUserAgent(session.userAgent)}
                    {session.current ? <Badge variant="secondary">Cet appareil</Badge> : null}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {session.ip ?? "Adresse IP inconnue"} · Dernière activité{" "}
                    {/* L'heure relative peut différer d'une seconde entre serveur et navigateur */}
                    <time dateTime={session.lastUsedAt} suppressHydrationWarning>
                      {formatRelative(session.lastUsedAt)}
                    </time>
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Connecté le {formatDateTime(session.createdAt)}
                  </span>
                </div>
                {session.current ? null : (
                  <Button variant="destructive" size="sm" onClick={() => setToRevoke(session)}>
                    <LogOut /> Déconnecter
                  </Button>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={toRevoke !== null}
        onOpenChange={(open) => !open && setToRevoke(null)}
        title="Déconnecter cet appareil ?"
        description={
          toRevoke ? (
            <>
              La session <strong>{describeUserAgent(toRevoke.userAgent)}</strong> (
              {toRevoke.ip ?? "adresse IP inconnue"}) sera fermée immédiatement.
            </>
          ) : null
        }
        confirmLabel="Déconnecter"
        confirmIcon={<LogOut />}
        onConfirm={() => revoke.mutateAsync(toRevoke!.id)}
      />
    </>
  );
}

/** Squelette de la liste pendant le premier chargement. */
export function SessionsListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
