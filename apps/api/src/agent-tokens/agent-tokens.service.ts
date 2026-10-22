import { Injectable } from "@nestjs/common";
import {
  AGENT_TOKEN_PREFIX,
  type AgentTokenInfo,
  type CreateAgentTokenData,
  type CreatedAgentToken,
} from "@regie/shared";
import { TokenService } from "../auth/token.service";
import type { AuthContext } from "../auth/auth.types";
import { notFound } from "../common/errors/domain-errors";
import type { AgentToken } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Nombre de caractères aléatoires conservés en clair pour reconnaître un jeton dans la liste. */
const VISIBLE_PREFIX_LENGTH = 4;

/** Convertit un jeton en informations listables (jamais sa valeur). */
function toInfo(token: AgentToken): AgentTokenInfo {
  return {
    id: token.id,
    name: token.name,
    prefix: token.prefix,
    createdAt: token.createdAt.toISOString(),
    lastUsedAt: token.lastUsedAt?.toISOString() ?? null,
    expiresAt: token.expiresAt?.toISOString() ?? null,
  };
}

/**
 * Jetons de délégation des agents IA (D-014). Un jeton porte les droits de l'humain
 * qui l'a créé ; il est stocké haché et sa valeur n'est montrée qu'à la création.
 */
@Injectable()
export class AgentTokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  /**
   * Jetons actifs de l'utilisateur.
   *
   * @param auth - Utilisateur connecté
   * @returns Les jetons non révoqués, les plus récents en premier
   */
  async list(auth: AuthContext): Promise<AgentTokenInfo[]> {
    const tokens = await this.prisma.agentToken.findMany({
      where: { userId: auth.userId, revokedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return tokens.map(toInfo);
  }

  /**
   * Crée un jeton d'agent.
   *
   * @param auth - Humain qui délègue ses droits
   * @param input - Nom de l'agent et durée de validité
   * @returns Le jeton en clair (une seule fois) et ses informations
   */
  async create(auth: AuthContext, input: CreateAgentTokenData): Promise<CreatedAgentToken> {
    const { token, hash } = this.tokens.generateOpaqueToken(AGENT_TOKEN_PREFIX);
    const created = await this.prisma.agentToken.create({
      data: {
        userId: auth.userId,
        name: input.name,
        tokenHash: hash,
        prefix: token.slice(0, AGENT_TOKEN_PREFIX.length + VISIBLE_PREFIX_LENGTH),
        expiresAt: input.expiresInDays ? new Date(Date.now() + input.expiresInDays * DAY_MS) : null,
      },
    });
    return { token, info: toInfo(created) };
  }

  /**
   * Révoque un jeton de l'utilisateur.
   *
   * @param auth - Utilisateur connecté
   * @param id - Jeton à révoquer
   * @throws AppException 404 si le jeton n'existe pas ou appartient à quelqu'un d'autre
   */
  async revoke(auth: AuthContext, id: string): Promise<void> {
    const { count } = await this.prisma.agentToken.updateMany({
      where: { id, userId: auth.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) throw notFound("Jeton introuvable.");
  }

  /**
   * Authentifie un agent par son jeton.
   *
   * @param rawToken - Jeton reçu dans l'en-tête Authorization
   * @returns Le contexte d'agent, ou `null` si le jeton est inconnu, expiré, révoqué
   *   ou si l'utilisateur qui l'a créé a été supprimé
   */
  async authenticate(rawToken: string): Promise<AuthContext | null> {
    if (!rawToken.startsWith(AGENT_TOKEN_PREFIX)) return null;
    const now = new Date();
    const token = await this.prisma.agentToken.findFirst({
      where: {
        tokenHash: this.tokens.hashOpaqueToken(rawToken),
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        user: { deletedAt: null },
      },
    });
    if (!token) return null;

    await this.prisma.agentToken.update({ where: { id: token.id }, data: { lastUsedAt: now } });
    return { userId: token.userId, sessionId: null, isAgent: true, agentName: token.name };
  }
}
