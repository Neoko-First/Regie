import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { MAIL_SETTINGS_PATH, mailSettingsQuery } from "@/features/admin/api";
import { MailSettingsView } from "@/features/admin/components/mail-settings-view";
import { Prefetch } from "@/lib/server/prefetch";

export const metadata: Metadata = {
  title: "Envoi des emails",
  description: "Configuration de Mailjet pour les emails de Régie.",
};

/** Administration : envoi des emails (Mailjet). Accès refusé par l'API hors admin plateforme. */
export default function MailAdminPage() {
  return (
    <>
      <PageHeader title="Envoi des emails" />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <Prefetch requests={[{ query: mailSettingsQuery(), path: MAIL_SETTINGS_PATH }]}>
            <MailSettingsView />
          </Prefetch>
        </Suspense>
      </main>
    </>
  );
}
