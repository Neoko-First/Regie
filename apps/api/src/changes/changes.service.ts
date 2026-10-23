import { Injectable } from "@nestjs/common";
import {
  type ChangeDetail,
  type ChangeFilters,
  type ChangeSummary,
  type CreateChangeInput,
  LOCKED_CHANGE_STATUSES,
  type UpdateChangeInput,
} from "@regie/shared";
import type { AuthContext } from "../auth/auth.types";
import { conflict, forbidden, invalidField } from "../common/errors/domain-errors";
import type { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SpaceAccessService } from "../spaces/space-access.service";
import { ChangeAccessService } from "./change-access.service";
import { CHANGE_SUMMARY_INCLUDE, toChangeDetail, toChangeSummary } from "./change.mapper";

/** Nombre maximal d'évolutions renvoyées par la liste (le board n'a pas besoin de plus). */
const LIST_LIMIT = 500;

/** Données validées de création (valeurs par défaut Zod appliquées). */
type CreateChangeData = Required<CreateChangeInput>;

/**
 * Lecture et modification des évolutions. Les changements de statut passent
 * exclusivement par `ChangeWorkflowService`.
 */
@Injectable()
export class ChangesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spaces: SpaceAccessService,
    private readonly access: ChangeAccessService,
  ) {}

  /**
   * Évolutions visibles par l'utilisateur, filtrées. Sans filtre de statut, les évolutions
   * archivées sont exclues (elles encombreraient le board).
   *
   * @param auth - Utilisateur connecté
   * @param filters - Espace, statut, assigné (« me » = moi)
   * @returns Les évolutions, les plus récemment modifiées en premier
   */
  async list(auth: AuthContext, filters: ChangeFilters): Promise<ChangeSummary[]> {
    const platformAdmin = await this.spaces.isPlatformAdmin(auth.userId);
    const where: Prisma.ChangeWhereInput = {
      deletedAt: null,
      space: {
        deletedAt: null,
        ...(filters.space ? { key: filters.space } : {}),
        // Uniquement les espaces dont l'utilisateur est membre
        ...(platformAdmin ? {} : { memberships: { some: { userId: auth.userId } } }),
      },
      status: filters.status ?? { not: "ARCHIVED" },
      ...(filters.assignee
        ? { assigneeId: filters.assignee === "me" ? auth.userId : filters.assignee }
        : {}),
    };
    const changes = await this.prisma.change.findMany({
      where,
      include: CHANGE_SUMMARY_INCLUDE,
      orderBy: { updatedAt: "desc" },
      take: LIST_LIMIT,
    });
    return changes.map(toChangeSummary);
  }

  /**
   * Détail d'une évolution, avec les actions possibles pour l'utilisateur.
   *
   * @param auth - Utilisateur connecté
   * @param key - Identifiant lisible (« SOC-12 »)
   * @returns Le détail
   * @throws AppException 404 si l'évolution est inaccessible
   */
  async get(auth: AuthContext, key: string): Promise<ChangeDetail> {
    const { change, roles } = await this.access.requireAccess(auth.userId, key);
    return toChangeDetail(change, { userId: auth.userId, roles, isAgent: auth.isAgent });
  }

  /**
   * Crée une évolution en brouillon. Le numéro est attribué atomiquement dans l'espace.
   *
   * @param auth - Auteur
   * @param input - Espace, titre, nature, priorité, proposal
   * @returns Le détail de l'évolution créée
   * @throws AppException 404 si l'espace est inaccessible, 403 en lecture seule
   */
  async create(auth: AuthContext, input: CreateChangeData): Promise<ChangeDetail> {
    const { space, roles } = await this.spaces.requireAccess(auth.userId, input.spaceKey);
    this.spaces.assertRoles(roles);

    const change = await this.prisma.$transaction(async (tx) => {
      // Incrément atomique : deux créations simultanées n'obtiennent jamais le même numéro
      const { changeCounter } = await tx.space.update({
        where: { id: space.id },
        data: { changeCounter: { increment: 1 } },
        select: { changeCounter: true },
      });
      const created = await tx.change.create({
        data: {
          spaceId: space.id,
          number: changeCounter,
          title: input.title,
          nature: input.nature,
          priority: input.priority,
          proposal: input.proposal,
          authorId: auth.userId,
        },
        include: CHANGE_SUMMARY_INCLUDE,
      });
      await tx.activity.create({
        data: { changeId: created.id, actorId: auth.userId, type: "CREATED", data: {} },
      });
      return created;
    });
    return toChangeDetail(change, { userId: auth.userId, roles, isAgent: auth.isAgent });
  }

  /**
   * Modifie le contenu d'une évolution (PATCH : seuls les champs envoyés).
   * Le contenu d'une évolution livrée ou archivée est figé.
   *
   * @param auth - Utilisateur connecté
   * @param key - Identifiant lisible
   * @param input - Champs à modifier
   * @returns Le détail mis à jour
   * @throws AppException 403 en lecture seule, 409 si l'évolution est figée,
   *   400 si l'assigné n'est pas membre de l'espace
   */
  async update(auth: AuthContext, key: string, input: UpdateChangeInput): Promise<ChangeDetail> {
    const { change, roles } = await this.access.requireAccess(auth.userId, key);
    this.spaces.assertRoles(roles);
    if (LOCKED_CHANGE_STATUSES.includes(change.status)) {
      throw conflict("Une évolution livrée ou archivée ne peut plus être modifiée.");
    }
    if (input.assigneeId) {
      const assigneeRoles = await this.spaces.rolesIn(input.assigneeId, change.spaceId);
      if (assigneeRoles.length === 0) {
        throw invalidField("assigneeId", "La personne assignée doit être membre de l'espace.");
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.change.update({
        where: { id: change.id },
        data: input,
        include: CHANGE_SUMMARY_INCLUDE,
      });
      // On trace les champs modifiés, pas leur contenu (le contenu figé vit dans les révisions)
      await tx.activity.create({
        data: {
          changeId: change.id,
          actorId: auth.userId,
          type: "UPDATED",
          data: { fields: Object.keys(input) },
        },
      });
      return result;
    });
    return toChangeDetail(updated, { userId: auth.userId, roles, isAgent: auth.isAgent });
  }

  /**
   * Supprime (soft delete) une évolution encore en brouillon. Réservé à son auteur
   * ou à un admin de l'espace : au-delà du brouillon, l'historique doit être conservé.
   *
   * @param auth - Utilisateur connecté
   * @param key - Identifiant lisible
   * @throws AppException 403 si non autorisé, 409 si l'évolution n'est plus en brouillon
   */
  async remove(auth: AuthContext, key: string): Promise<void> {
    const { change, roles } = await this.access.requireAccess(auth.userId, key);
    if (change.authorId !== auth.userId && !roles.includes("ADMIN")) {
      throw forbidden("Seul l'auteur ou un admin de l'espace peut supprimer cette évolution.");
    }
    if (change.status !== "DRAFT") {
      throw conflict("Seule une évolution en brouillon peut être supprimée.");
    }
    await this.prisma.change.update({ where: { id: change.id }, data: { deletedAt: new Date() } });
  }
}
