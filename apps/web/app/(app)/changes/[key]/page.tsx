import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { changeQuery, changesPaths, commentsQuery } from "@/features/changes/api";
import { ChangeView } from "@/features/changes/components/change-view";
import { Prefetch } from "@/lib/server/prefetch";

/** Le titre de l'onglet affiche l'identifiant lisible (pas de requête supplémentaire). */
export async function generateMetadata({ params }: PageProps<"/changes/[key]">): Promise<Metadata> {
  const { key } = await params;
  return { title: decodeURIComponent(key).toUpperCase() };
}

/** Page d'une évolution. */
export default function ChangePage({ params }: PageProps<"/changes/[key]">) {
  return (
    <>
      <PageHeader title="Évolution" />
      <Suspense fallback={<ChangeSkeleton />}>
        <ChangeData params={params} />
      </Suspense>
    </>
  );
}

/** Précharge l'évolution et sa discussion (lecture des paramètres : dynamique, sous Suspense). */
async function ChangeData({ params }: Pick<PageProps<"/changes/[key]">, "params">) {
  const key = decodeURIComponent((await params).key).toUpperCase();
  return (
    <Prefetch
      requests={[
        { query: changeQuery(key), path: changesPaths.detail(key) },
        { query: commentsQuery(key), path: changesPaths.comments(key) },
      ]}
    >
      <ChangeView changeKey={key} />
    </Prefetch>
  );
}

function ChangeSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-6" aria-busy="true">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
