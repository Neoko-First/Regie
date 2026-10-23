import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { invitationPreviewPath, invitationPreviewQuery } from "@/features/invitations/api";
import { AcceptInvitation } from "@/features/invitations/components/accept-invitation-form";
import { Prefetch } from "@/lib/server/prefetch";

export const metadata: Metadata = {
  title: "Invitation",
  description: "Créer votre compte Régie à partir d'une invitation.",
};

type Props = PageProps<"/invitation/[token]">;

/** Acceptation d'une invitation reçue par email (D-091) : création du compte. */
export default function InvitationPage({ params }: Props) {
  return (
    <AuthShell
      title="Rejoindre Régie"
      description="Choisissez votre nom et votre mot de passe pour créer votre compte."
    >
      {/* Le jeton est dans l'URL : lecture sous Suspense (Cache Components) */}
      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <Invitation params={params} />
      </Suspense>
    </AuthShell>
  );
}

async function Invitation({ params }: Pick<Props, "params">) {
  const { token } = await params;
  return (
    <Prefetch
      requests={[{ query: invitationPreviewQuery(token), path: invitationPreviewPath(token) }]}
    >
      <AcceptInvitation token={token} />
    </Prefetch>
  );
}
