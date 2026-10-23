import { Injectable } from "@nestjs/common";
import { checkTransition, type InboxContent, TRANSITIONS } from "@regie/shared";
import type { AuthContext } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { CHANGE_SUMMARY_INCLUDE, toChangeSummary } from "./change.mapper";

/** Statuts depuis lesquels un gate peut être validé (dérivés du workflow partagé). */
const GATE_STATUSES = [...new Set(TRANSITIONS.filter((t) => t.gate).map((t) => t.from))];

/** Transitions de gate (une par statut de départ). */
const GATE_TRANSITIONS = TRANSITIONS.filter((transition) => transition.gate);

/**
 * « Ma boîte » (point d'entrée de chaque utilisateur, Q-023) : gates qu'il peut valider
 * et évolutions qui lui sont assignées. Les droits sont calculés avec le workflow partagé :
 * la boîte propose exactement ce que l'API acceptera.
 */
@Injectable()
export class InboxService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @param auth - Utilisateur connecté
   * @returns Les évolutions à valider et celles qui lui sont assignées
   */
  async get(auth: AuthContext): Promise<InboxContent> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId: auth.userId, space: { deletedAt: null } },
      select: { spaceId: true, roles: true },
    });
    const rolesBySpace = new Map(memberships.map((m) => [m.spaceId, m.roles]));
    const spaceIds = [...rolesBySpace.keys()];

    const [candidates, assigned] = await Promise.all([
      this.prisma.change.findMany({
        where: { deletedAt: null, spaceId: { in: spaceIds }, status: { in: GATE_STATUSES } },
        include: CHANGE_SUMMARY_INCLUDE,
        orderBy: { updatedAt: "asc" }, // les plus anciennes attendent depuis plus longtemps
      }),
      this.prisma.change.findMany({
        where: {
          deletedAt: null,
          spaceId: { in: spaceIds },
          assigneeId: auth.userId,
          status: { notIn: ["DELIVERED", "ARCHIVED"] },
        },
        include: CHANGE_SUMMARY_INCLUDE,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const toValidate = candidates.filter((change) =>
      GATE_TRANSITIONS.some(
        (transition) =>
          checkTransition(transition.id, change.status, {
            roles: rolesBySpace.get(change.spaceId) ?? [],
            isAuthor: change.authorId === auth.userId,
            isAgent: auth.isAgent,
          }).allowed,
      ),
    );

    return { toValidate: toValidate.map(toChangeSummary), assigned: assigned.map(toChangeSummary) };
  }
}
