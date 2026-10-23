import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordButton } from "@/features/auth/components/password-forms";

export const metadata: Metadata = {
  title: "Sécurité",
  description: "Mot de passe de votre compte.",
};

/** Sécurité du compte : changement du mot de passe. */
export default function SecurityPage() {
  return (
    <>
      <PageHeader title="Sécurité" />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-h4 flex items-center gap-2">
              <KeyRound className="size-5" aria-hidden /> Mot de passe
            </CardTitle>
            <CardDescription>
              12 caractères minimum, avec une minuscule, une majuscule, un chiffre et un caractère
              spécial. Un email vous prévient de chaque changement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordButton />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
