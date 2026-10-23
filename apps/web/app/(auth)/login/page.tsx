import { APP_NAME } from "@regie/shared";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: `Connectez-vous à ${APP_NAME}.`,
};

/** Page de connexion, hors de la coquille de l'application (pas de sidebar). */
export default function LoginPage() {
  return (
    <AuthShell
      title="Connexion"
      description="De la spec à la recette, toute la production au même endroit."
    >
      {/* useSearchParams (paramètre `next`) : rendu côté client, sous Suspense */}
      <Suspense fallback={<Skeleton className="h-52 w-full" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
