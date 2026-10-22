import { Skeleton } from "@/components/ui/skeleton";

/** Chargement d'une page de l'application : squelette de l'en-tête et du contenu. */
export default function AppLoading() {
  return (
    <div aria-busy="true" aria-label="Chargement" className="flex flex-1 flex-col">
      <div className="flex h-12 items-center gap-2 border-b px-3">
        <Skeleton className="size-7" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex flex-col gap-3 p-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
