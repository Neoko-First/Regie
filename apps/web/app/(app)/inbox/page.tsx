import { Inbox } from "lucide-react";
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
  title: "Ma boîte",
  description: "Les évolutions et validations qui attendent une action de votre part.",
};

/** Ma boîte : point d'entrée de l'utilisateur (mentions, assignations, gates en attente). */
export default function InboxPage() {
  return (
    <>
      <PageHeader title="Ma boîte" />
      <main className="flex flex-1 items-center justify-center p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>Rien à traiter pour le moment</EmptyTitle>
            <EmptyDescription>
              Les évolutions qui attendent votre validation, vos assignations et vos mentions
              apparaîtront ici.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    </>
  );
}
