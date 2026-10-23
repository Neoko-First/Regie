import { Injectable } from "@nestjs/common";
import { CONTRIBUTOR_ROLES, hasAnyRole, type SpaceRole } from "@regie/shared";
import { forbidden, notFound } from "../common/errors/domain-errors";
import { PrismaService } from "../prisma/prisma.service";

/** Espace accessible, avec les rôles de l'utilisateur. */
export interface SpaceAccess {
  space: { id: string; key: string; name: string; description: string };
  roles: SpaceRole[];
}

/** Message renvoyé pour un espace inexistant OU inaccessible (on ne révèle pas son existence). */
const SPACE_NOT_FOUND = "Espace introuvable.";

/**
 * Point UNIQUE de contrôle d'accès aux espaces (CLAUDE.md §13 : vérifier le droit sur la
 * ressource, pas seulement la connexion). Un administrateur de la plateforme a le rôle ADMIN
 * dans tous les espaces, mais aucun rôle métier : il ne valide pas de gate à ce titre.
 */
@Injectable()
export class SpaceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Indique si un utilisateur est administrateur de la plateforme.
   *
   * @param userId - Utilisateur
   * @returns `true` pour un administrateur de la plateforme
   */
  async isPlatformAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPlatformAdmin: true },
    });
    return user?.isPlatformAdmin ?? false;
  }

  /**
   * Rôles d'un utilisateur dans un espace (vide s'il n'en est pas membre).
   *
   * @param userId - Utilisateur
   * @param spaceId - Espace
   * @returns Les rôles, ADMIN ajouté pour un administrateur de la plateforme
   */
  async rolesIn(userId: string, spaceId: string): Promise<SpaceRole[]> {
    const [membership, platformAdmin] = await Promise.all([
      this.prisma.membership.findUnique({
        where: { spaceId_userId: { spaceId, userId } },
        select: { roles: true },
      }),
      this.isPlatformAdmin(userId),
    ]);
    const roles = new Set<SpaceRole>(membership?.roles ?? []);
    if (platformAdmin) roles.add("ADMIN");
    return [...roles];
  }

  /**
   * Charge un espace visible par l'utilisateur.
   *
   * @param userId - Utilisateur
   * @param spaceKey - Clé de l'espace (ex. « SOC »)
   * @returns L'espace et les rôles de l'utilisateur
   * @throws AppException 404 si l'espace n'existe pas ou si l'utilisateur n'y a aucun rôle
   */
  async requireAccess(userId: string, spaceKey: string): Promise<SpaceAccess> {
    const space = await this.prisma.space.findFirst({
      where: { key: spaceKey, deletedAt: null },
      select: { id: true, key: true, name: true, description: true },
    });
    if (!space) throw notFound(SPACE_NOT_FOUND);
    const roles = await this.rolesIn(userId, space.id);
    if (roles.length === 0) throw notFound(SPACE_NOT_FOUND);
    return { space, roles };
  }

  /**
   * Vérifie qu'un utilisateur détient l'un des rôles demandés.
   *
   * @param roles - Rôles de l'utilisateur dans l'espace
   * @param required - Rôles acceptés (par défaut : tout rôle contributeur, pas la lecture seule)
   * @throws AppException 403 sinon
   */
  assertRoles(
    roles: readonly SpaceRole[],
    required: readonly SpaceRole[] = CONTRIBUTOR_ROLES,
  ): void {
    if (!hasAnyRole(roles, required)) throw forbidden();
  }
}
