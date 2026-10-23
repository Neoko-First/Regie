import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { ResetPasswordForm } from "@/features/auth/components/password-forms";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  description: "Choisir un nouveau mot de passe.",
};

/** Nouveau mot de passe, depuis le lien reçu par email. */
export default function ResetPasswordPage({ params }: PageProps<"/reset-password/[token]">) {
  return (
    <AuthShell
      title="Choisir un nouveau mot de passe"
      description="Toutes vos sessions seront fermées : vous devrez vous reconnecter sur vos appareils."
    >
      {/* Le jeton est dans l'URL : lecture sous Suspense (Cache Components) */}
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ResetForm params={params} />
      </Suspense>
    </AuthShell>
  );
}

async function ResetForm({ params }: Pick<PageProps<"/reset-password/[token]">, "params">) {
  const { token } = await params;
  return <ResetPasswordForm token={token} />;
}
