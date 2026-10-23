import type { MailTransportKind } from "@regie/shared";

/** Libellés des moyens d'envoi d'email. */
export const TRANSPORT_LABELS: Record<MailTransportKind, string> = {
  MAILJET: "Mailjet",
  SMTP: "SMTP de repli",
  TEST: "Capture de test",
  NONE: "Aucun",
};
