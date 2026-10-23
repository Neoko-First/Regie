import { Injectable } from "@nestjs/common";
import type { ActivityItem, CommentItem, CreateCommentInput, RevisionItem } from "@regie/shared";
import type { AuthContext } from "../auth/auth.types";
import { delegationData } from "../common/delegation";
import { toUserSummary, USER_SUMMARY_SELECT } from "../common/user-summary";
import { PrismaService } from "../prisma/prisma.service";
import { SpaceAccessService } from "../spaces/space-access.service";
import { ChangeAccessService } from "./change-access.service";

/** Longueur de l'extrait de commentaire conservé dans l'historique. */
const COMMENT_EXCERPT_LENGTH = 140;

/**
 * Commentaires, historique d'activité et révisions d'une évolution.
 */
@Injectable()
export class ChangeHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spaces: SpaceAccessService,
    private readonly access: ChangeAccessService,
  ) {}

  /**
   * Commentaires d'une évolution, du plus ancien au plus récent.
   *
   * @param auth - Utilisateur connecté
   * @param key - Identifiant lisible
   * @returns Les commentaires
   */
  async listComments(auth: AuthContext, key: string): Promise<CommentItem[]> {
    const { change } = await this.access.requireAccess(auth.userId, key);
    const comments = await this.prisma.comment.findMany({
      where: { changeId: change.id, deletedAt: null },
      include: { author: { select: USER_SUMMARY_SELECT } },
      orderBy: { createdAt: "asc" },
    });
    return comments.map((comment) => ({
      id: comment.id,
      author: toUserSummary(comment.author),
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
    }));
  }

  /**
   * Ajoute un commentaire (rôle contributeur requis) et le trace dans l'historique.
   *
   * @param auth - Auteur du commentaire
   * @param key - Identifiant lisible
   * @param input - Texte du commentaire (markdown)
   * @returns Le commentaire créé
   * @throws AppException 403 en lecture seule
   */
  async addComment(
    auth: AuthContext,
    key: string,
    input: CreateCommentInput,
  ): Promise<CommentItem> {
    const { change, roles } = await this.access.requireAccess(auth.userId, key);
    this.spaces.assertRoles(roles);

    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: { changeId: change.id, authorId: auth.userId, body: input.body },
        include: { author: { select: USER_SUMMARY_SELECT } },
      });
      await tx.activity.create({
        data: {
          changeId: change.id,
          actorId: auth.userId,
          type: "COMMENTED",
          data: {
            commentId: created.id,
            excerpt: input.body.slice(0, COMMENT_EXCERPT_LENGTH),
            ...delegationData(auth),
          },
        },
      });
      return created;
    });
    return {
      id: comment.id,
      author: toUserSummary(comment.author),
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  /**
   * Historique d'une évolution, du plus récent au plus ancien.
   *
   * @param auth - Utilisateur connecté
   * @param key - Identifiant lisible
   * @returns Les événements
   */
  async listActivity(auth: AuthContext, key: string): Promise<ActivityItem[]> {
    const { change } = await this.access.requireAccess(auth.userId, key);
    const activities = await this.prisma.activity.findMany({
      where: { changeId: change.id },
      include: { actor: { select: USER_SUMMARY_SELECT } },
      orderBy: { createdAt: "desc" },
    });
    return activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      actor: toUserSummary(activity.actor),
      data: (activity.data ?? {}) as Record<string, unknown>,
      createdAt: activity.createdAt.toISOString(),
    }));
  }

  /**
   * Révisions figées par les gates, de la plus récente à la plus ancienne.
   *
   * @param auth - Utilisateur connecté
   * @param key - Identifiant lisible
   * @returns Les révisions, avec la personne qui a validé le gate
   */
  async listRevisions(auth: AuthContext, key: string): Promise<RevisionItem[]> {
    const { change } = await this.access.requireAccess(auth.userId, key);
    const revisions = await this.prisma.revision.findMany({
      where: { changeId: change.id },
      include: { gateApproval: { include: { approvedBy: { select: USER_SUMMARY_SELECT } } } },
      orderBy: { number: "desc" },
    });
    return revisions.flatMap((revision) =>
      revision.gateApproval
        ? [
            {
              number: revision.number,
              gate: revision.gate,
              approvedBy: toUserSummary(revision.gateApproval.approvedBy),
              comment: revision.gateApproval.comment,
              createdAt: revision.createdAt.toISOString(),
            },
          ]
        : [],
    );
  }
}
