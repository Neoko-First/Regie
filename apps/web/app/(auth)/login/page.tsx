import { APP_NAME } from "@regie/shared";
import { Clapperboard } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: `Connectez-vous à ${APP_NAME}.`,
};

/** Page de connexion, hors de la coquille de l'application (pas de sidebar). */
export default function LoginPage() {
  return (
    <main className="bg-background flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <Clapperboard className="size-4" />
          </span>
          <span className="text-h4 font-extrabold">{APP_NAME}</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>
              De la spec à la recette, toute la production au même endroit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* useSearchParams (paramètre `next`) : rendu côté client, sous Suspense */}
            <Suspense fallback={<Skeleton className="h-52 w-full" />}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
