import { Injectable } from "@nestjs/common";
import type {
  CreateSpaceInput,
  MemberRolesInput,
  SpaceMember,
  SpaceRole,
  SpaceSummary,
} from "@regie/shared";
import { conflict, forbidden, notFound } from "../common/errors/domain-errors";
import { toUserSummary, USER_SUMMARY_SELECT } from "../common/user-summary";
import { PrismaService } from "../prisma/prisma.service";
import { SpaceAccessService } from "./space-access.service";

/** Données validées de création d'espace (après transformation Zod). */
type CreateSpaceData = Required<Pick<CreateSpaceInput, "key" | "name" | "description">>;

/**
 * Espaces et membres. Les droits sont vérifiés via `SpaceAccessService`.
 */
@Injectable()
export class SpacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SpaceAccessService,
  ) {}

  /**
   * Espaces dont l'utilisateur est membre (tous pour un administrateur de la plateforme).
   *
   * @param userId - Utilisateur
   * @returns Les espaces, triés par nom, avec les rôles de l'utilisateur
   */
  async listForUser(userId: string): Promise<SpaceSummary[]> {
    const platformAdmin = await this.access.isPlatformAdmin(userId);
    const spaces = await this.prisma.space.findMany({
      where: { deletedAt: null, ...(platformAdmin ? {} : { memberships: { some: { userId } } }) },
      include: { memberships: { where: { userId }, select: { roles: true } } },
      orderBy: { name: "asc" },
    });
    return spaces.map((space) => {
      const roles = new Set<SpaceRole>(space.memberships[0]?.roles ?? []);
      if (platformAdmin) roles.add("ADMIN");
      return {
        id: space.id,
        key: space.key,
        name: space.name,
        description: space.description,
        myRoles: [...roles],
      };
    });
  }

  /**
   * Crée un espace (administrateur de la plateforme uniquement). Le créateur en devient admin.
   *
   * @param userId - Créateur
   * @param input - Clé, nom, description
   * @returns L'espace créé
   * @throws AppException 403 si l'utilisateur n'est pas administrateur, 409 si la clé est prise
   */
  async create(userId: string, input: CreateSpaceData): Promise<SpaceSummary> {
    if (!(await this.access.isPlatformAdmin(userId))) {
      throw forbidden("Seul un administrateur de la plateforme peut créer un espace.");
    }
    const existing = await this.prisma.space.findUnique({ where: { key: input.key } });
    if (existing) throw conflict(`La clé ${input.key} est déjà utilisée par un autre espace.`);

    const space = await this.prisma.space.create({
      data: { ...input, memberships: { create: { userId, roles: ["ADMIN"] } } },
    });
    return {
      id: space.id,
      key: space.key,
      name: space.name,
      description: space.description,
      myRoles: ["ADMIN"],
    };
  }

  /**
   * Détail d'un espace visible par l'utilisateur.
   *
   * @param userId - Utilisateur
   * @param spaceKey - Clé de l'espace
   * @returns L'espace et les rôles de l'utilisateur
   * @throws AppException 404 si l'espace est inaccessible
   */
  async get(userId: string, spaceKey: string): Promise<SpaceSummary> {
    const { space, roles } = await this.access.requireAccess(userId, spaceKey);
    return { ...space, myRoles: roles };
  }

  /**
   * Membres d'un espace (visible par tout membre).
   *
   * @param userId - Utilisateur qui consulte
   * @param spaceKey - Clé de l'espace
   * @returns Les membres et leurs rôles, triés par nom
   */
  async listMembers(userId: string, spaceKey: string): Promise<SpaceMember[]> {
    const { space } = await this.access.requireAccess(userId, spaceKey);
    const memberships = await this.prisma.membership.findMany({
      where: { spaceId: space.id, user: { deletedAt: null } },
      include: { user: { select: USER_SUMMARY_SELECT } },
      orderBy: { user: { name: "asc" } },
    });
    return memberships.map((membership) => ({
      user: toUserSummary(membership.user),
      roles: membership.roles,
    }));
  }

  /**
   * Définit les rôles d'un utilisateur dans un espace (ajout ou modification), admin uniquement.
   *
   * @param userId - Administrateur qui agit
   * @param spaceKey - Clé de l'espace
   * @param memberId - Utilisateur concerné
   * @param input - Nouveaux rôles (remplacent les précédents)
   * @returns Le membre mis à jour
   * @throws AppException 403 si l'utilisateur n'est pas admin de l'espace, 404 si le membre n'existe pas
   */
  async setMemberRoles(
    userId: string,
    spaceKey: string,
    memberId: string,
    input: Required<MemberRolesInput>,
  ): Promise<SpaceMember> {
    const { space, roles } = await this.access.requireAccess(userId, spaceKey);
    this.access.assertRoles(roles, ["ADMIN"]);

    const user = await this.prisma.user.findFirst({
      where: { id: memberId, deletedAt: null },
      select: USER_SUMMARY_SELECT,
    });
    if (!user) throw notFound("Utilisateur introuvable.");

    const membership = await this.prisma.membership.upsert({
      where: { spaceId_userId: { spaceId: space.id, userId: memberId } },
      update: { roles: input.roles },
      create: { spaceId: space.id, userId: memberId, roles: input.roles },
    });
    return { user: toUserSummary(user), roles: membership.roles };
  }

  /**
   * Retire un membre d'un espace, admin uniquement.
   *
   * @param userId - Administrateur qui agit
   * @param spaceKey - Clé de l'espace
   * @param memberId - Membre à retirer
   * @throws AppException 403 si l'utilisateur n'est pas admin, 404 si ce n'est pas un membre
   */
  async removeMember(userId: string, spaceKey: string, memberId: string): Promise<void> {
    const { space, roles } = await this.access.requireAccess(userId, spaceKey);
    this.access.assertRoles(roles, ["ADMIN"]);
    const { count } = await this.prisma.membership.deleteMany({
      where: { spaceId: space.id, userId: memberId },
    });
    if (count === 0) throw notFound("Ce membre ne fait pas partie de l'espace.");
  }
}
