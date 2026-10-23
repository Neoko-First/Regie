import { z } from "@regie/shared";

/** Port d'écoute par défaut de l'API en développement. */
const DEFAULT_PORT = 4000;

/** Longueur minimale d'un secret de signature (256 bits en hexadécimal ≈ 64 caractères). */
const MIN_SECRET_LENGTH = 32;

/** Taille d'une clé AES-256. */
const ENCRYPTION_KEY_BYTES = 32;

/**
 * Schéma des variables d'environnement de l'API, validé au démarrage (CLAUDE.md §13).
 * Une variable absente ou invalide empêche l'API de démarrer, avec un message explicite.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  /** Chaîne de connexion PostgreSQL */
  DATABASE_URL: z.url(),
  /** Origine du front : seule origine autorisée par CORS et la vérification Origin */
  WEB_ORIGIN: z.url(),
  /** Clé de signature des access tokens (HS256) : au moins 32 caractères aléatoires */
  JWT_ACCESS_SECRET: z.string().min(MIN_SECRET_LENGTH),
  /**
   * Préfixe sous lequel le navigateur voit l'API (proxy BFF de Next.js).
   * Sert à restreindre le chemin du cookie de refresh : `${prefix}/auth`.
   */
  PUBLIC_API_PREFIX: z
    .string()
    .regex(/^\/[\w-]+$/)
    .default("/api"),
  /**
   * Clé de chiffrement des secrets stockés en base (clés Mailjet) : 32 octets en base64.
   * La perdre rend les secrets enregistrés illisibles (il faudra les ressaisir).
   */
  SETTINGS_ENCRYPTION_KEY: z
    .string()
    .refine((value) => Buffer.from(value, "base64").length === ENCRYPTION_KEY_BYTES, {
      error: "Doit faire 32 octets encodés en base64.",
    }),
  /** Serveur SMTP de repli quand Mailjet n'est pas configuré (Mailpit en développement) */
  SMTP_URL: z.url().optional(),
  /** Expéditeur utilisé avec le SMTP de repli */
  SMTP_FROM: z.string().default("Régie <no-reply@regie.test>"),
});

/** Variables d'environnement validées et typées. */
export type Env = z.infer<typeof envSchema>;

/**
 * Valide les variables d'environnement.
 *
 * @param source - Variables brutes (par défaut `process.env`)
 * @returns Les variables validées et typées
 * @throws Error listant toutes les variables invalides
 */
export function validateEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    // On liste les noms et les problèmes, jamais les valeurs (elles peuvent contenir des secrets)
    const details = result.error.issues
      .map((issue) => `- ${issue.path.join(".")} : ${issue.message}`)
      .join("\n");
    throw new Error(`Variables d'environnement invalides :\n${details}`);
  }
  return result.data;
}
