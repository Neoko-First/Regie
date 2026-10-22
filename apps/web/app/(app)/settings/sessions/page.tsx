import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { sessionsQuery } from "@/features/auth/api";
import { LogoutAllButton } from "@/features/auth/components/logout-all-button";
import { SessionsList, SessionsListSkeleton } from "@/features/auth/components/sessions-list";
import { Prefetch } from "@/lib/server/prefetch";

export const metadata: Metadata = {
  title: "Appareils connectés",
  description: "Les appareils connectés à votre compte, et leur déconnexion.",
};

/** Gestion des sessions : liste des appareils connectés et révocation (CLAUDE.md §12.3). */
export default function SessionsPage() {
  return (
    <>
      <PageHeader title="Appareils connectés" actions={<LogoutAllButton />} />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
        <p className="text-muted-foreground text-sm">
          Si vous ne reconnaissez pas un appareil, déconnectez-le puis changez votre mot de passe.
        </p>
        <Suspense fallback={<SessionsListSkeleton />}>
          <Prefetch requests={[{ query: sessionsQuery(), path: "/auth/sessions" }]}>
            <SessionsList />
          </Prefetch>
        </Suspense>
      </main>
    </>
  );
}
