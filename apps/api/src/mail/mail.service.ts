import { Injectable, Logger } from "@nestjs/common";
import type { MailTransportKind } from "@regie/shared";
import { AppConfigService } from "../config/app-config.service";
import { MailSettingsService } from "./mail-settings.service";
import type { MailSender, MailTransport, OutgoingEmail } from "./mail.types";
import { CaptureTransport } from "./transports/capture.transport";
import { MailjetTransport } from "./transports/mailjet.transport";
import { SmtpTransport } from "./transports/smtp.transport";

/** Moyen d'envoi retenu pour un email. */
interface ResolvedTransport {
  kind: MailTransportKind;
  transport: MailTransport | null;
  from: MailSender;
}

/** Libellés des moyens d'envoi, pour l'administration et l'email de test. */
export const TRANSPORT_LABELS: Record<MailTransportKind, string> = {
  MAILJET: "Mailjet",
  SMTP: "SMTP (repli)",
  TEST: "Capture (tests)",
  NONE: "Aucun",
};

/** Découpe « Nom <adresse> » (format de SMTP_FROM). */
function parseSender(value: string): MailSender {
  const match = /^(.*)<(.+)>$/.exec(value.trim());
  return match
    ? { name: match[1]!.trim().replace(/^"|"$/g, ""), email: match[2]!.trim() }
    : { name: "Régie", email: value.trim() };
}

/**
 * Envoi des emails transactionnels. Choix du moyen d'envoi, dans l'ordre :
 * tests → capture en mémoire ; Mailjet s'il est activé et complet (administration) ;
 * sinon le SMTP de repli (`SMTP_URL`, Mailpit en développement).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  /** Emails capturés en environnement de test (lus par les tests e2e) */
  readonly captured = new CaptureTransport();
  private readonly smtp: SmtpTransport | null;

  constructor(
    private readonly config: AppConfigService,
    private readonly settings: MailSettingsService,
  ) {
    const url = config.get("SMTP_URL");
    this.smtp = url ? new SmtpTransport(url) : null;
  }

  /** Détermine le moyen d'envoi à utiliser maintenant. */
  private async resolve(): Promise<ResolvedTransport> {
    const fallbackFrom = parseSender(this.config.get("SMTP_FROM"));
    if (this.config.get("NODE_ENV") === "test") {
      return { kind: "TEST", transport: this.captured, from: fallbackFrom };
    }
    const mailjet = await this.settings.mailjetConfig();
    if (mailjet) {
      return {
        kind: "MAILJET",
        transport: new MailjetTransport(mailjet.credentials),
        from: mailjet.sender,
      };
    }
    if (this.smtp) return { kind: "SMTP", transport: this.smtp, from: fallbackFrom };
    return { kind: "NONE", transport: null, from: fallbackFrom };
  }

  /**
   * Moyen d'envoi actuellement actif (affiché dans l'administration).
   *
   * @returns Le type de transport
   */
  async activeTransport(): Promise<MailTransportKind> {
    return (await this.resolve()).kind;
  }

  /**
   * Envoie un email et attend le résultat.
   *
   * @param email - Destinataire et contenu
   * @returns Le moyen d'envoi utilisé
   * @throws Error si aucun moyen d'envoi n'est configuré ou si l'envoi échoue
   */
  async send(email: OutgoingEmail): Promise<MailTransportKind> {
    const { kind, transport, from } = await this.resolve();
    if (!transport) throw new Error("Aucun moyen d'envoi d'email n'est configuré.");
    await transport.send(email, from);
    return kind;
  }

  /**
   * Envoie un email sans faire attendre la requête HTTP (et sans révéler par le temps de
   * réponse si un compte existe). Un échec est journalisé, sans le contenu de l'email.
   *
   * @param email - Destinataire et contenu
   * @param purpose - Nature de l'email, pour le journal (ex. « réinitialisation »)
   */
  sendInBackground(email: OutgoingEmail, purpose: string): void {
    this.send(email).catch((error: unknown) => {
      this.logger.error(
        `Échec de l'envoi d'un email (${purpose}) : ${error instanceof Error ? error.message : "erreur inconnue"}`,
      );
    });
  }
}
