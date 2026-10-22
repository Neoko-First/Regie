import { SquareKanban } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = {
  title: "Évolutions",
  description: "Board et liste des évolutions, de la spec à la recette.",
};

/** Évolutions : board et liste (le contenu arrive avec le domaine, phase 4 et 5). */
export default function ChangesPage() {
  return (
    <>
      <PageHeader title="Évolutions" />
      <main className="flex flex-1 items-center justify-center p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SquareKanban />
            </EmptyMedia>
            <EmptyTitle>Aucune évolution</EmptyTitle>
            <EmptyDescription>
              Les évolutions proposées par l’équipe ou par les agents apparaîtront ici, sous forme
              de board et de liste.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    </>
  );
}
