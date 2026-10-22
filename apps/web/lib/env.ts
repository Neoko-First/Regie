import "server-only";
import { z } from "@regie/shared";

// Variables d'environnement serveur de Next.js, validées par Zod (CLAUDE.md §13).
// Aucune n'est préfixée NEXT_PUBLIC_ : elles ne doivent jamais atteindre le navigateur.

const serverEnvSchema = z.object({
  /** URL interne de l'API Nest, utilisée uniquement par le proxy BFF */
  API_URL: z.url(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

/**
 * Renvoie les variables d'environnement serveur validées.
 * La validation est paresseuse : `next build` ne doit pas échouer si l'API n'est pas configurée.
 *
 * @returns Les variables validées
 * @throws Si une variable est absente ou invalide
 */
export function getServerEnv(): ServerEnv {
  cachedEnv ??= serverEnvSchema.parse(process.env);
  return cachedEnv;
}
