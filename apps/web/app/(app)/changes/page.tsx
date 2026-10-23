import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { changesPaths, changesQuery } from "@/features/changes/api";
import { ChangesExplorer } from "@/features/changes/components/changes-explorer";
import { NewChangeButton } from "@/features/changes/components/create-change-dialog";
import { BOARD_STATUSES } from "@/features/changes/constants";
import { parseChangeFilters } from "@/features/changes/lib/filters";
import { spacesQuery } from "@/features/spaces/api";
import { Prefetch } from "@/lib/server/prefetch";

export const metadata: Metadata = {
  title: "Évolutions",
  description: "Board et liste des évolutions, de la spec à la recette.",
};

/** Évolutions : board kanban et liste filtrable. */
export default function ChangesPage({ searchParams }: PageProps<"/changes">) {
  return (
    <>
      <PageHeader title="Évolutions" actions={<NewChangeButton />} />
      <Suspense fallback={<BoardSkeleton />}>
        <ChangesData searchParams={searchParams} />
      </Suspense>
    </>
  );
}

/** Précharge les évolutions correspondant aux filtres de l'URL (lecture dynamique, sous Suspense). */
async function ChangesData({ searchParams }: Pick<PageProps<"/changes">, "searchParams">) {
  const { filters } = parseChangeFilters(await searchParams);
  return (
    <Prefetch
      requests={[
        { query: changesQuery(filters), path: changesPaths.list(filters) },
        { query: spacesQuery(), path: "/spaces" },
      ]}
    >
      <ChangesExplorer />
    </Prefetch>
  );
}

/** Squelette du board pendant le premier chargement. */
function BoardSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden p-4" aria-busy="true" aria-label="Chargement">
      {BOARD_STATUSES.slice(0, 5).map((status) => (
        <div key={status} className="flex w-72 shrink-0 flex-col gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
  );
}
