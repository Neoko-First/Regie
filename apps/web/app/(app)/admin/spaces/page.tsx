import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { meQuery } from "@/features/auth/api";
import { spacesQuery } from "@/features/spaces/api";
import { AdminSpacesList, CreateSpaceButton } from "@/features/spaces/components/spaces-admin";
import { Prefetch } from "@/lib/server/prefetch";

export const metadata: Metadata = {
  title: "Espaces et membres",
  description: "Création des espaces et gestion de leurs membres.",
};

/** Préchargement commun : utilisateur (droits) et espaces (rôles). */
const REQUESTS = [
  { query: meQuery(), path: "/auth/me" },
  { query: spacesQuery(), path: "/spaces" },
];

/** Administration des espaces (D-091) : admins d'espace et administrateur de la plateforme. */
export default function AdminSpacesPage() {
  return (
    <>
      <PageHeader
        title="Espaces et membres"
        actions={
          <Suspense fallback={null}>
            <Prefetch requests={REQUESTS}>
              <CreateSpaceButton />
            </Prefetch>
          </Suspense>
        }
      />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
        <p className="text-muted-foreground text-sm">
          Les espaces dont vous êtes admin. Dans chacun, vous ajoutez des membres, choisissez leurs
          rôles et suivez les invitations envoyées.
        </p>
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <Prefetch requests={REQUESTS}>
            <AdminSpacesList />
          </Prefetch>
        </Suspense>
      </main>
    </>
  );
}
