import { Injectable } from "@nestjs/common";
import {
  type ChangeDetail,
  checkTransition,
  getTransition,
  type TransitionRequest,
} from "@regie/shared";
import type { AuthContext } from "../auth/auth.types";
import { conflict, forbidden } from "../common/errors/domain-errors";
import { PrismaService } from "../prisma/prisma.service";
import { ChangeAccessService } from "./change-access.service";
import { CHANGE_SUMMARY_INCLUDE, toChangeDetail } from "./change.mapper";

/** Message quand le statut a changé entre l'affichage et le clic. */
const STALE_STATUS_MESSAGE =
  "Cette évolution a changé entre-temps. Rechargez la page pour voir son statut actuel.";

/**
 * Changements de statut d'une évolution, selon le workflow unique de `@regie/shared`.
 * Le passage d'un gate fige une révision immuable et trace la validation (D-009, D-010).
 */
@Injectable()
export class ChangeWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ChangeAccessService,
  ) {}

  /**
   * Applique une transition. Contrôles, dans l'ordre : accès à l'évolution ; statut affiché
   * toujours à jour (`fromStatus`) ; règles du workflow (rôle, gate humain, pas l'auteur).
   * La mise à jour est conditionnée au statut en base : deux validations simultanées
   * ne peuvent pas toutes les deux réussir.
   *
   * @param auth - Utilisateur (ou agent) qui agit
   * @param key - Identifiant lisible de l'évolution
   * @param request - Transition demandée, statut affiché, commentaire éventuel
   * @returns Le détail de l'évolution après transition
   * @throws AppException 409 si le statut a changé, 403 si la transition est refusée
   */
  async transition(
    auth: AuthContext,
    key: string,
    request: TransitionRequest,
  ): Promise<ChangeDetail> {
    const { change, roles } = await this.access.requireAccess(auth.userId, key);
    if (change.status !== request.fromStatus) throw conflict(STALE_STATUS_MESSAGE);

    const check = checkTransition(request.transition, change.status, {
      roles,
      isAuthor: change.authorId === auth.userId,
      isAgent: auth.isAgent,
    });
    if (!check.allowed) throw forbidden(check.reason);

    const transition = getTransition(request.transition);
    const comment = request.comment || null;

    const updated = await this.prisma.$transaction(async (tx) => {
      // Mise à jour conditionnelle : échoue si un autre utilisateur a changé le statut
      const { count } = await tx.change.updateMany({
        where: { id: change.id, status: change.status, deletedAt: null },
        data: {
          status: transition.to,
          ...(transition.gate ? { revision: { increment: 1 } } : {}),
        },
      });
      if (count === 0) throw conflict(STALE_STATUS_MESSAGE);

      if (transition.gate) {
        const revisionNumber = change.revision + 1;
        // Révision immuable : le contenu exact validé par ce gate (D-010)
        const revision = await tx.revision.create({
          data: {
            changeId: change.id,
            number: revisionNumber,
            gate: transition.gate,
            snapshot: {
              title: change.title,
              nature: change.nature,
              priority: change.priority,
              proposal: change.proposal,
              plan: change.plan,
              tasks: change.tasks,
            },
          },
        });
        await tx.gateApproval.create({
          data: {
            changeId: change.id,
            revisionId: revision.id,
            gate: transition.gate,
            approvedById: auth.userId,
            comment,
          },
        });
        await tx.activity.create({
          data: {
            changeId: change.id,
            actorId: auth.userId,
            type: "GATE_APPROVED",
            data: {
              gate: transition.gate,
              revision: revisionNumber,
              from: change.status,
              to: transition.to,
              comment,
            },
          },
        });
      } else {
        await tx.activity.create({
          data: {
            changeId: change.id,
            actorId: auth.userId,
            type: "STATUS_CHANGED",
            data: { transition: transition.id, from: change.status, to: transition.to, comment },
          },
        });
      }

      return tx.change.findUniqueOrThrow({
        where: { id: change.id },
        include: CHANGE_SUMMARY_INCLUDE,
      });
    });

    return toChangeDetail(updated, { userId: auth.userId, roles, isAgent: auth.isAgent });
  }
}
