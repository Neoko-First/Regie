import type { MailSender, MailTransport, OutgoingEmail } from "../mail.types";

/** Email capturé (tests). */
export interface CapturedEmail extends OutgoingEmail {
  from: MailSender;
}

/**
 * Transport des tests : garde les emails en mémoire au lieu de les envoyer, pour que les tests
 * e2e puissent lire le lien reçu (réinitialisation, invitation…).
 */
export class CaptureTransport implements MailTransport {
  readonly sent: CapturedEmail[] = [];

  send(email: OutgoingEmail, from: MailSender): Promise<void> {
    this.sent.push({ ...email, from });
    return Promise.resolve();
  }

  /**
   * Dernier email reçu par une adresse.
   *
   * @param address - Adresse du destinataire
   * @returns L'email, ou `undefined` s'il n'y en a pas
   */
  lastTo(address: string): CapturedEmail | undefined {
    return this.sent.filter((email) => email.to.email === address).at(-1);
  }
}
