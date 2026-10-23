import { EmailAction, EmailLayout, EmailText } from "../components/email-layout";

/** Données de l'email envoyé à un utilisateur existant ajouté à un espace. */
export interface MemberAddedEmailProps {
  name: string;
  /** Nom de la personne qui a ajouté le membre */
  inviterName: string;
  spaceName: string;
  /** Lien vers Régie */
  appUrl: string;
}

/**
 * Prévient un utilisateur qui a déjà un compte qu'il a été ajouté à un espace.
 */
export function MemberAddedEmail({ name, inviterName, spaceName, appUrl }: MemberAddedEmailProps) {
  return (
    <EmailLayout
      preview={`Vous avez accès à l’espace ${spaceName} sur Régie.`}
      title={`Vous avez rejoint l’espace ${spaceName}`}
    >
      <EmailText>Bonjour {name},</EmailText>
      <EmailText>
        {inviterName} vous a ajouté à l’espace {spaceName}. Ses évolutions apparaissent dès
        maintenant dans votre board.
      </EmailText>
      <EmailAction href={appUrl} label="Ouvrir Régie" />
    </EmailLayout>
  );
}

/** Aperçu local (`pnpm --filter @regie/emails preview`). */
MemberAddedEmail.PreviewProps = {
  name: "Rémi Cettier",
  inviterName: "Alexandre",
  spaceName: "Socle",
  appUrl: "http://localhost:3000",
} satisfies MemberAddedEmailProps;

export default MemberAddedEmail;
