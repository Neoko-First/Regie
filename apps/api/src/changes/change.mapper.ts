import {
  type ChangeDetail,
  type ChangeSummary,
  formatChangeKey,
  getAvailableTransitions,
  type SpaceRole,
} from "@regie/shared";
import { toUserSummary, USER_SUMMARY_SELECT } from "../common/user-summary";
import type { Prisma } from "../generated/prisma/client";

/** Relations chargées pour construire un résumé d'évolution. */
export const CHANGE_SUMMARY_INCLUDE = {
  space: { select: { key: true } },
  author: { select: USER_SUMMARY_SELECT },
  assignee: { select: USER_SUMMARY_SELECT },
} as const satisfies Prisma.ChangeInclude;

/** Évolution chargée avec `CHANGE_SUMMARY_INCLUDE`. */
export type ChangeWithRelations = Prisma.ChangeGetPayload<{
  include: typeof CHANGE_SUMMARY_INCLUDE;
}>;

/**
 * Convertit une évolution en résumé (cartes du board, liste).
 *
 * @param change - Évolution avec espace, auteur et assigné
 * @returns Le résumé renvoyé par l'API
 */
export function toChangeSummary(change: ChangeWithRelations): ChangeSummary {
  return {
    id: change.id,
    key: formatChangeKey(change.space.key, change.number),
    spaceKey: change.space.key,
    title: change.title,
    status: change.status,
    nature: change.nature,
    priority: change.priority,
    revision: change.revision,
    author: toUserSummary(change.author),
    assignee: change.assignee ? toUserSummary(change.assignee) : null,
    updatedAt: change.updatedAt.toISOString(),
  };
}

/**
 * Convertit une évolution en détail, avec les actions de workflow calculées pour l'utilisateur
 * (boutons de l'UI). L'API revérifie chaque action au moment où elle est demandée.
 *
 * @param change - Évolution avec espace, auteur et assigné
 * @param viewer - Rôles de l'utilisateur, et s'il agit en tant qu'agent
 * @returns Le détail renvoyé par l'API
 */
export function toChangeDetail(
  change: ChangeWithRelations,
  viewer: { userId: string; roles: SpaceRole[]; isAgent: boolean },
): ChangeDetail {
  const transitions = getAvailableTransitions(change.status, {
    roles: viewer.roles,
    isAuthor: change.authorId === viewer.userId,
    isAgent: viewer.isAgent,
  });
  return {
    ...toChangeSummary(change),
    proposal: change.proposal,
    plan: change.plan,
    tasks: change.tasks,
    createdAt: change.createdAt.toISOString(),
    myRoles: viewer.roles,
    transitions: transitions.map((transition) => ({
      id: transition.id,
      label: transition.label,
      to: transition.to,
      gate: transition.gate ?? null,
      backward: transition.backward ?? false,
      allowed: transition.check.allowed,
      reason: transition.check.allowed ? null : transition.check.reason,
    })),
  };
}
