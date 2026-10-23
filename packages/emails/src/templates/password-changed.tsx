import { EmailLayout, EmailNote, EmailText } from "../components/email-layout";

/** Données de l'email de notification de changement de mot de passe. */
export interface PasswordChangedEmailProps {
  name: string;
  /** Date et heure du changement, déjà formatées en français (fuseau Europe/Paris) */
  changedAt: string;
  /** Vrai si le changement fait suite à un « mot de passe oublié » */
  viaReset: boolean;
}

/**
 * Notification de sécurité envoyée après chaque changement de mot de passe (CLAUDE.md §12.3).
 */
export function PasswordChangedEmail({ name, changedAt, viaReset }: PasswordChangedEmailProps) {
  return (
    <EmailLayout
      preview="Le mot de passe de votre compte Régie a été modifié."
      title="Votre mot de passe a été modifié"
    >
      <EmailText>Bonjour {name},</EmailText>
      <EmailText>
        Le mot de passe de votre compte Régie a été modifié le {changedAt}
        {viaReset ? " à la suite d’une demande de réinitialisation" : ""}. Par sécurité,{" "}
        {viaReset
          ? "toutes vos sessions ont été fermées."
          : "vos autres appareils ont été déconnectés."}
      </EmailText>
      <EmailNote>
        Si vous n’êtes pas à l’origine de ce changement, prévenez immédiatement l’administrateur de
        Régie : votre compte est peut-être compromis.
      </EmailNote>
    </EmailLayout>
  );
}

/** Aperçu local (`pnpm --filter @regie/emails preview`). */
PasswordChangedEmail.PreviewProps = {
  name: "Paula Ordonneau",
  changedAt: "23/10/2026 à 14:35",
  viaReset: false,
} satisfies PasswordChangedEmailProps;

export default PasswordChangedEmail;
