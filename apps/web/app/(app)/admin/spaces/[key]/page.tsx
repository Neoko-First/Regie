import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { meQuery } from "@/features/auth/api";
import {
  spaceInvitationsPath,
  spaceInvitationsQuery,
  spaceMembersPath,
  spaceMembersQuery,
} from "@/features/spaces/api";
import {
  AddMemberButton,
  InvitationsTable,
  MembersTable,
} from "@/features/spaces/components/space-members-admin";
import { Prefetch } from "@/lib/server/prefetch";

export const metadata: Metadata = {
  title: "Membres de l’espace",
  description: "Membres, rôles et invitations d’un espace.",
};

type Props = PageProps<"/admin/spaces/[key]">;

/** Membres et invitations d'un espace (admins de l'espace). */
export default function AdminSpacePage({ params }: Props) {
  return (
    // La clé est dans l'URL : lecture sous Suspense (Cache Components)
    <Suspense fallback={<Skeleton className="m-6 h-64" />}>
      <SpaceAdmin params={params} />
    </Suspense>
  );
}

async function SpaceAdmin({ params }: Pick<Props, "params">) {
  const { key } = await params;
  const spaceKey = key.toUpperCase();
  return (
    <>
      <PageHeader
        title={`Membres de ${spaceKey}`}
        actions={<AddMemberButton spaceKey={spaceKey} />}
      />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6">
        <section className="flex flex-col gap-3" aria-labelledby="members-title">
          <h2 id="members-title" className="text-h4">
            Membres
          </h2>
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <Prefetch
              requests={[
                { query: meQuery(), path: "/auth/me" },
                { query: spaceMembersQuery(spaceKey), path: spaceMembersPath(spaceKey) },
              ]}
            >
              <MembersTable spaceKey={spaceKey} />
            </Prefetch>
          </Suspense>
        </section>
        <section className="flex flex-col gap-3" aria-labelledby="invitations-title">
          <h2 id="invitations-title" className="text-h4">
            Invitations en attente
          </h2>
          <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <Prefetch
              requests={[
                { query: spaceInvitationsQuery(spaceKey), path: spaceInvitationsPath(spaceKey) },
              ]}
            >
              <InvitationsTable spaceKey={spaceKey} />
            </Prefetch>
          </Suspense>
        </section>
      </main>
    </>
  );
}
