import { z } from "@regie/shared";

/** Port d'écoute par défaut de l'API en développement. */
const DEFAULT_PORT = 4000;

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
