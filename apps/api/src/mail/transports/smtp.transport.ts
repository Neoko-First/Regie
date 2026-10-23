import { createTransport, type Transporter } from "nodemailer";
import type { MailSender, MailTransport, OutgoingEmail } from "../mail.types";

/**
 * Envoi par SMTP (Nodemailer) : transport de repli, utilisé en développement avec Mailpit
 * (http://localhost:8025) tant que Mailjet n'est pas configuré.
 */
export class SmtpTransport implements MailTransport {
  private readonly transporter: Transporter;

  constructor(url: string) {
    this.transporter = createTransport(url);
  }

  async send(email: OutgoingEmail, from: MailSender): Promise<void> {
    await this.transporter.sendMail({
      from: { address: from.email, name: from.name },
      to: { address: email.to.email, name: email.to.name },
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
  }
}
