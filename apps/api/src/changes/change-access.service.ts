import { Injectable } from "@nestjs/common";
import { parseChangeKey, type SpaceRole } from "@regie/shared";
import { notFound } from "../common/errors/domain-errors";
import { PrismaService } from "../prisma/prisma.service";
import { SpaceAccessService } from "../spaces/space-access.service";
import { CHANGE_SUMMARY_INCLUDE, type ChangeWithRelations } from "./change.mapper";

/** Message unique : évolution inexistante, supprimée ou dans un espace inaccessible. */
const CHANGE_NOT_FOUND = "Évolution introuvable.";

/** Évolution accessible, avec les rôles de l'utilisateur dans son espace. */
export interface ChangeAccess {
  change: ChangeWithRelations;
  roles: SpaceRole[];
}

/**
 * Charge une évolution par son identifiant lisible en vérifiant que l'utilisateur
 * est membre de son espace. Point d'entrée unique de toutes les routes `/changes/:key`.
 */
@Injectable()
export class ChangeAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spaces: SpaceAccessService,
  ) {}

  /**
   * @param userId - Utilisateur
   * @param key - Identifiant lisible, ex. « SOC-12 »
   * @returns L'évolution et les rôles de l'utilisateur dans l'espace
   * @throws AppException 404 si l'évolution n'existe pas ou n'est pas accessible
   */
  async requireAccess(userId: string, key: string): Promise<ChangeAccess> {
    const parsed = parseChangeKey(key.toUpperCase());
    if (!parsed) throw notFound(CHANGE_NOT_FOUND);

    const change = await this.prisma.change.findFirst({
      where: {
        number: parsed.number,
        deletedAt: null,
        space: { key: parsed.spaceKey, deletedAt: null },
      },
      include: CHANGE_SUMMARY_INCLUDE,
    });
    if (!change) throw notFound(CHANGE_NOT_FOUND);

    const roles = await this.spaces.rolesIn(userId, change.spaceId);
    if (roles.length === 0) throw notFound(CHANGE_NOT_FOUND);
    return { change, roles };
  }
}
