import type { RenderedEmail } from "@regie/emails";

/** Email à envoyer : destinataire et contenu rendu par @regie/emails. */
export interface OutgoingEmail extends RenderedEmail {
  to: { email: string; name: string };
}

/** Expéditeur d'un email. */
export interface MailSender {
  email: string;
  name: string;
}

/** Moyen d'envoi (Mailjet, SMTP, capture en test). */
export interface MailTransport {
  send(email: OutgoingEmail, from: MailSender): Promise<void>;
}
