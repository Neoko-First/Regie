import { EmailAction, EmailLayout, EmailNote, EmailText } from "../components/email-layout";

/** Données de l'email de réinitialisation du mot de passe. */
export interface PasswordResetEmailProps {
  name: string;
  /** Lien de réinitialisation, à usage unique */
  resetUrl: string;
  /** Durée de validité du lien, en minutes */
  expiresInMinutes: number;
}

/**
 * Email envoyé après une demande « Mot de passe oublié ».
 */
export function PasswordResetEmail({ name, resetUrl, expiresInMinutes }: PasswordResetEmailProps) {
  return (
    <EmailLayout
      preview="Choisissez un nouveau mot de passe pour Régie."
      title="Réinitialiser votre mot de passe"
    >
      <EmailText>Bonjour {name},</EmailText>
      <EmailText>
        Une réinitialisation du mot de passe de votre compte Régie a été demandée. Pour choisir un
        nouveau mot de passe, utilisez le bouton ci-dessous.
      </EmailText>
      <EmailAction href={resetUrl} label="Choisir un nouveau mot de passe" />
      <EmailNote>
        Ce lien est valable {expiresInMinutes} minutes et ne fonctionne qu’une fois. Si vous n’êtes
        pas à l’origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.
      </EmailNote>
    </EmailLayout>
  );
}

/** Aperçu local (`pnpm --filter @regie/emails preview`). */
PasswordResetEmail.PreviewProps = {
  name: "Paula Ordonneau",
  resetUrl: "http://localhost:3000/reset-password/exemple",
  expiresInMinutes: 30,
} satisfies PasswordResetEmailProps;

export default PasswordResetEmail;
