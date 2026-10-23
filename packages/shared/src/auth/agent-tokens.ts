import { z } from "../zod";

// Jetons d'agent IA (D-014) : un humain crée un jeton pour un agent (Claude Code…),
// qui agit alors en son nom via le serveur MCP, sans jamais pouvoir valider un gate.

/** Préfixe des jetons d'agent : les rend reconnaissables (ex. par un scanner de secrets). */
export const AGENT_TOKEN_PREFIX = "regie_pat_";

/** Durées de validité proposées, en jours (`null` = sans expiration). */
export const AGENT_TOKEN_DURATIONS = [30, 90, 365] as const;

export const createAgentTokenSchema = z.object({
  /** Nom de l'agent, visible dans l'historique des évolutions */
  name: z
    .string()
    .trim()
    .min(2, { error: "Le nom doit faire au moins 2 caractères." })
    .max(60, { error: "Le nom ne doit pas dépasser 60 caractères." }),
  /** Durée en jours (`null` = sans expiration). Accepte aussi « 30 » (listes déroulantes). */
  expiresInDays: z.coerce
    .number()
    .pipe(z.union([z.literal(30), z.literal(90), z.literal(365)]))
    .nullable(),
});

export type CreateAgentTokenInput = z.input<typeof createAgentTokenSchema>;

/** Données validées (durée convertie en nombre), reçues par l'API. */
export type CreateAgentTokenData = z.output<typeof createAgentTokenSchema>;

/** Jeton d'agent tel que listé (jamais la valeur du jeton). */
export interface AgentTokenInfo {
  id: string;
  name: string;
  /** Début du jeton, pour le reconnaître */
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

/** Réponse de création : la valeur du jeton n'est renvoyée qu'UNE fois. */
export interface CreatedAgentToken {
  token: string;
  info: AgentTokenInfo;
}
