import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { changesPaths, inboxQuery } from "@/features/changes/api";
import { NewChangeButton } from "@/features/changes/components/create-change-dialog";
import { InboxView } from "@/features/changes/components/inbox-view";
import { Prefetch } from "@/lib/server/prefetch";

export const metadata: Metadata = {
  title: "Ma boîte",
  description: "Les évolutions et validations qui attendent une action de votre part.",
};

/** Ma boîte : point d'entrée de l'utilisateur (gates à valider, assignations). */
export default function InboxPage() {
  return (
    <>
      <PageHeader title="Ma boîte" actions={<NewChangeButton />} />
      <main className="mx-auto flex w-full max-w-5xl flex-col p-6">
        <Suspense fallback={<InboxSkeleton />}>
          <Prefetch requests={[{ query: inboxQuery(), path: changesPaths.inbox() }]}>
            <InboxView />
          </Prefetch>
        </Suspense>
      </main>
    </>
  );
}

function InboxSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
