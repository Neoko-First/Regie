import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/password-forms";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: "Recevoir un lien pour choisir un nouveau mot de passe.",
};

/** Mot de passe oublié : demande d'un lien de réinitialisation par email. */
export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Mot de passe oublié"
      description="Saisissez l'adresse de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
