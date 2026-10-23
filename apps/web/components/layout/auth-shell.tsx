import { APP_NAME } from "@regie/shared";
import { Clapperboard } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Propriétés de la mise en page des pages publiques. */
export interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

/**
 * Mise en page des pages publiques (connexion, mot de passe oublié, réinitialisation,
 * invitation) : nom de l'application et carte centrée, hors de la coquille avec sidebar.
 */
export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="bg-background flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <Clapperboard className="size-4" />
          </span>
          <span className="text-h4 font-extrabold">{APP_NAME}</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-h4">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
