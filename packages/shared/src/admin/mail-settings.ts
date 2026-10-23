import { emailSchema } from "../auth/auth.schemas";
import { z } from "../zod";

// Réglages d'envoi des emails (Mailjet), modifiables par l'administrateur de la plateforme.
// Les clés sont en ÉCRITURE SEULE : l'API ne les renvoie jamais, seulement un indice.

/** Clé facultative : absente ou vide = « ne pas modifier la clé enregistrée ». */
const optionalSecret = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .pipe(z.string().min(8, { error: "La clé semble trop courte." }).optional());

export const mailSettingsSchema = z.object({
  senderEmail: emailSchema,
  senderName: z
    .string()
    .trim()
    .min(2, { error: "Le nom de l'expéditeur doit faire au moins 2 caractères." })
    .max(80),
  enabled: z.boolean(),
  /** Clé API publique Mailjet (laisser vide pour conserver la clé enregistrée) */
  apiKey: optionalSecret,
  /** Clé secrète Mailjet (laisser vide pour conserver la clé enregistrée) */
  secretKey: optionalSecret,
});

export type MailSettingsInput = z.input<typeof mailSettingsSchema>;
export type MailSettingsData = z.output<typeof mailSettingsSchema>;

/** Moyen d'envoi effectivement utilisé par l'API. */
export type MailTransportKind = "MAILJET" | "SMTP" | "TEST" | "NONE";

/** Réglages tels que renvoyés par l'API (jamais les clés elles-mêmes). */
export interface MailSettingsInfo {
  senderEmail: string;
  senderName: string;
  enabled: boolean;
  /** 4 derniers caractères de la clé API, pour la reconnaître ; `null` si aucune */
  apiKeyHint: string | null;
  secretKeyConfigured: boolean;
  /** Ce qui sert réellement à envoyer (Mailjet si activé et complet, sinon SMTP de dev) */
  activeTransport: MailTransportKind;
  updatedAt: string | null;
}
