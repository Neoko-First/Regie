import { EmailAction, EmailLayout, EmailNote, EmailText } from "../components/email-layout";

/** Données de l'email d'invitation à rejoindre un espace. */
export interface InvitationEmailProps {
  /** Nom de la personne qui invite */
  inviterName: string;
  spaceName: string;
  /** Lien d'acceptation, à usage unique */
  acceptUrl: string;
  /** Durée de validité du lien, en jours */
  expiresInDays: number;
}

/**
 * Invitation envoyée à une personne qui n'a pas encore de compte Régie (D-091).
 */
export function InvitationEmail({
  inviterName,
  spaceName,
  acceptUrl,
  expiresInDays,
}: InvitationEmailProps) {
  return (
    <EmailLayout
      preview={`${inviterName} vous invite à rejoindre l’espace ${spaceName} sur Régie.`}
      title={`Rejoindre l’espace ${spaceName}`}
    >
      <EmailText>Bonjour,</EmailText>
      <EmailText>
        {inviterName} vous invite à rejoindre l’espace {spaceName} sur Régie, la plateforme où les
        évolutions des produits Xotis naissent, se valident et se recettent.
      </EmailText>
      <EmailAction href={acceptUrl} label="Accepter l’invitation" />
      <EmailNote>
        Ce lien est valable {expiresInDays} jours et ne fonctionne qu’une fois : il vous permet de
        créer votre compte. Si vous ne vous attendiez pas à cette invitation, ignorez cet email.
      </EmailNote>
    </EmailLayout>
  );
}

/** Aperçu local (`pnpm --filter @regie/emails preview`). */
InvitationEmail.PreviewProps = {
  inviterName: "Alexandre",
  spaceName: "Socle",
  acceptUrl: "http://localhost:3000/invitation/exemple",
  expiresInDays: 7,
} satisfies InvitationEmailProps;

export default InvitationEmail;
