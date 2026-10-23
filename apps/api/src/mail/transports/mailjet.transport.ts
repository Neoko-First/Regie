import type { MailSender, MailTransport, OutgoingEmail } from "../mail.types";

/** API d'envoi de Mailjet (version 3.1). */
const MAILJET_SEND_URL = "https://api.mailjet.com/v3.1/send";

/** Au-delà de ce délai, l'envoi est considéré comme échoué. */
const MAILJET_TIMEOUT_MS = 10_000;

/**
 * Envoi par l'API HTTP de Mailjet (authentification Basic : clé API + clé secrète).
 * Les clés sont reçues déchiffrées pour un seul envoi et ne sont jamais journalisées.
 */
export class MailjetTransport implements MailTransport {
  constructor(private readonly credentials: { apiKey: string; secretKey: string }) {}

  async send(email: OutgoingEmail, from: MailSender): Promise<void> {
    const auth = Buffer.from(`${this.credentials.apiKey}:${this.credentials.secretKey}`).toString(
      "base64",
    );
    const response = await fetch(MAILJET_SEND_URL, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        Messages: [
          {
            From: { Email: from.email, Name: from.name },
            To: [{ Email: email.to.email, Name: email.to.name }],
            Subject: email.subject,
            TextPart: email.text,
            HTMLPart: email.html,
          },
        ],
      }),
      signal: AbortSignal.timeout(MAILJET_TIMEOUT_MS),
    });
    if (!response.ok) {
      // Statut seulement : le corps peut contenir des données de l'email
      throw new Error(`Mailjet a refusé l'envoi (HTTP ${response.status}).`);
    }
  }
}
