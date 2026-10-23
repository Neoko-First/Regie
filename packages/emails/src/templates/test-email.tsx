import { EmailLayout, EmailNote, EmailText } from "../components/email-layout";

/** Données de l'email de test. */
export interface TestEmailProps {
  name: string;
  /** Moyen d'envoi utilisé (Mailjet, SMTP…) */
  transport: string;
}

/**
 * Email de test envoyé depuis l'administration pour vérifier la configuration d'envoi.
 */
export function TestEmail({ name, transport }: TestEmailProps) {
  return (
    <EmailLayout
      preview="L'envoi d'emails de Régie fonctionne."
      title="L’envoi d’emails fonctionne"
    >
      <EmailText>Bonjour {name},</EmailText>
      <EmailText>
        Cet email confirme que Régie peut envoyer des messages (invitations, réinitialisations de
        mot de passe, notifications de sécurité).
      </EmailText>
      <EmailNote>Moyen d’envoi utilisé : {transport}.</EmailNote>
    </EmailLayout>
  );
}

/** Aperçu local (`pnpm --filter @regie/emails preview`). */
TestEmail.PreviewProps = { name: "Alexandre", transport: "Mailjet" } satisfies TestEmailProps;

export default TestEmail;
