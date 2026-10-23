import { z } from "../zod";

/**
 * Adresse email normalisée (espaces retirés, minuscules) avant validation :
 * « Alice@Xotis.fr » et « alice@xotis.fr » désignent le même compte.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Saisissez une adresse email valide." }));

/** Données du formulaire de connexion. */
export const loginSchema = z.object({
  email: emailSchema,
  // Pas de politique de mot de passe à la connexion : seulement « non vide »
  password: z.string().min(1, { error: "Saisissez votre mot de passe." }),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Utilisateur connecté, tel que renvoyé par `GET /auth/me`. */
export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

/** Session (appareil connecté), pour la page de gestion des sessions. */
export const sessionInfoSchema = z.object({
  id: z.string(),
  userAgent: z.string().nullable(),
  ip: z.string().nullable(),
  createdAt: z.iso.datetime(),
  lastUsedAt: z.iso.datetime(),
  /** Vrai pour la session de l'appareil qui fait la requête */
  current: z.boolean(),
});

export type SessionInfo = z.infer<typeof sessionInfoSchema>;
