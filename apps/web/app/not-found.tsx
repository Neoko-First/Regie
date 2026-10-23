import { ArrowLeft, FileQuestion } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = {
  title: "Page introuvable",
};

/** Page 404 de l'application. */
export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileQuestion />
          </EmptyMedia>
          <EmptyTitle>Page introuvable</EmptyTitle>
          <EmptyDescription>
            Cette page n’existe pas ou a été déplacée. Vérifiez l’adresse ou revenez à votre boîte.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline">
            <Link href="/inbox">
              <ArrowLeft /> Retour à Ma boîte
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
