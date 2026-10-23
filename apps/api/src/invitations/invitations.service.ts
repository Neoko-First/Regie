import { Injectable } from "@nestjs/common";
import { renderInvitationEmail, renderMemberAddedEmail } from "@regie/emails";
import {
  type AcceptInvitationInput,
  type AddMemberData,
  type AddMemberResult,
  type AuthUser,
  INVITATION_TTL_DAYS,
  type InvitationInfo,
  type InvitationPreview,
  isPasswordDifferentFromEmail,
  PASSWORD_EQUALS_EMAIL_MESSAGE,
  type SpaceRole,
  type UserSummary,
} from "@regie/shared";
import { AuthService } from "../auth/auth.service";
import type { ClientContext, IssuedTokens } from "../auth/auth.types";
import { PasswordService } from "../auth/password.service";
import { TokenService } from "../auth/token.service";
import { badRequest, conflict, invalidField, notFound } from "../common/errors/domain-errors";
import { toUserSummary, USER_SUMMARY_SELECT } from "../common/user-summary";
import { AppConfigService } from "../config/app-config.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { SpaceAccessService } from "../spaces/space-access.service";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Durée de validité d'un lien d'invitation. */
const INVITATION_TTL_MS = INVITATION_TTL_DAYS * DAY_MS;

/** Message unique pour un lien inutilisable (inconnu, expiré, révoqué, déjà utilisé). */
const INVALID_INVITATION_LINK =
  "Ce lien d'invitation n'est plus valable. Demandez à l'admin de l'espace de vous le renvoyer.";

/** Message quand l'adresse invitée a déjà un compte (créé entre-temps). */
const ACCOUNT_EXISTS =
  "Un compte existe déjà pour cette adresse : connectez-vous pour accéder à l'espace.";

/** Une invitation en attente : ni acceptée, ni révoquée (elle peut être expirée). */
const PENDING = { acceptedAt: null, revokedAt: null } as const;

/** Espace concerné par une invitation. */
interface SpaceRef {
  id: string;
  name: string;
}

/** Invitation Prisma avec son auteur, convertible en `InvitationInfo`. */
interface InvitationRow {
  id: string;
  email: string;
  roles: SpaceRole[];
  createdAt: Date;
  expiresAt: Date;
  invitedBy: UserSummary;
}

/** Convertit une invitation en réponse de l'API (jamais le jeton ni son hash). */
function toInvitationInfo(row: InvitationRow, now = new Date()): InvitationInfo {
  return {
    id: row.id,
    email: row.email,
    roles: row.roles,
    invitedBy: toUserSummary(row.invitedBy),
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    expired: row.expiresAt <= now,
  };
}

/**
 * Ajout de membres et invitations (D-091). Seul un admin de l'espace (ou l'administrateur
 * de la plateforme, admin partout) ajoute, invite, renvoie ou révoque. Une personne qui a
 * déjà un compte est rattachée tout de suite ; les autres reçoivent un lien qui crée leur
 * compte. Le jeton du lien n'est stocké que haché.
 */
@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SpaceAccessService,
    private readonly tokens: TokenService,
    private readonly passwords: PasswordService,
    private readonly auth: AuthService,
    private readonly mail: MailService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Ajoute une personne à un espace par son email : rattachement direct si elle a un compte,
   * invitation sinon. Dans les deux cas, elle est prévenue par email.
   *
   * @param userId - Admin qui agit
   * @param spaceKey - Clé de l'espace
   * @param input - Email et rôles
   * @returns Le membre ajouté ou l'invitation envoyée
   * @throws AppException 403 si l'utilisateur n'est pas admin, 409 si la personne est déjà membre
   */
  async addMember(
    userId: string,
    spaceKey: string,
    input: AddMemberData,
  ): Promise<AddMemberResult> {
    const { space, inviter } = await this.requireSpaceAdmin(userId, spaceKey);
    const existing = await this.prisma.user.findFirst({
      where: { email: input.email, deletedAt: null },
      select: USER_SUMMARY_SELECT,
    });
    if (!existing) {
      const invitation = await this.issueInvitation(space, input.email, input.roles, inviter);
      return { status: "INVITED", invitation };
    }

    const membership = await this.prisma.membership.findUnique({
      where: { spaceId_userId: { spaceId: space.id, userId: existing.id } },
    });
    if (membership) throw conflict(`${existing.name} est déjà membre de cet espace.`);

    const created = await this.prisma.membership.create({
      data: { spaceId: space.id, userId: existing.id, roles: input.roles },
    });
    await this.notifyMemberAdded(existing, inviter, space);
    return { status: "ADDED", member: { user: toUserSummary(existing), roles: created.roles } };
  }

  /**
   * Invitations en attente d'un espace (expirées comprises, pour pouvoir les renvoyer).
   *
   * @param userId - Admin qui consulte
   * @param spaceKey - Clé de l'espace
   * @returns Les invitations, la plus récente en premier
   */
  async list(userId: string, spaceKey: string): Promise<InvitationInfo[]> {
    const { space } = await this.requireSpaceAdmin(userId, spaceKey);
    const rows = await this.prisma.invitation.findMany({
      where: { spaceId: space.id, ...PENDING },
      include: { invitedBy: { select: USER_SUMMARY_SELECT } },
      orderBy: { createdAt: "desc" },
    });
    const now = new Date();
    return rows.map((row) => toInvitationInfo(row, now));
  }

  /**
   * Renvoie une invitation : nouveau lien, nouvelle échéance ; l'ancien lien ne marche plus.
   *
   * @param userId - Admin qui agit
   * @param spaceKey - Clé de l'espace
   * @param invitationId - Invitation à renvoyer
   * @returns L'invitation renouvelée
   * @throws AppException 404 si l'invitation n'est plus en attente
   */
  async resend(userId: string, spaceKey: string, invitationId: string): Promise<InvitationInfo> {
    const { space, inviter } = await this.requireSpaceAdmin(userId, spaceKey);
    const current = await this.prisma.invitation.findFirst({
      where: { id: invitationId, spaceId: space.id, ...PENDING },
    });
    if (!current) throw notFound("Invitation introuvable.");
    return this.issueInvitation(space, current.email, current.roles, inviter);
  }

  /**
   * Révoque une invitation en attente : son lien ne fonctionne plus.
   *
   * @param userId - Admin qui agit
   * @param spaceKey - Clé de l'espace
   * @param invitationId - Invitation à révoquer
   * @throws AppException 404 si l'invitation n'est plus en attente
   */
  async revoke(userId: string, spaceKey: string, invitationId: string): Promise<void> {
    const { space } = await this.requireSpaceAdmin(userId, spaceKey);
    const { count } = await this.prisma.invitation.updateMany({
      where: { id: invitationId, spaceId: space.id, ...PENDING },
      data: { revokedAt: new Date() },
    });
    if (count === 0) throw notFound("Invitation introuvable.");
  }

  /**
   * Ce que voit l'invité en ouvrant le lien, avant d'accepter.
   *
   * @param token - Jeton du lien
   * @returns L'adresse invitée, l'espace et l'auteur de l'invitation
   * @throws AppException 400 si le lien est inutilisable ou si un compte existe déjà
   */
  async preview(token: string): Promise<InvitationPreview> {
    const invitation = await this.findUsable(token);
    await this.assertNoAccount(invitation.email);
    return {
      email: invitation.email,
      spaceName: invitation.space.name,
      invitedByName: invitation.invitedBy.name,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  /**
   * Accepte une invitation : crée le compte, rattache l'invité à TOUS les espaces où une
   * invitation valable l'attend, consomme ces invitations et ouvre une session.
   *
   * @param input - Jeton, nom et mot de passe (politique vérifiée par le schéma)
   * @param client - Appareil (pour la session ouverte)
   * @returns Les jetons à poser en cookies et l'utilisateur connecté
   * @throws AppException 400 si le lien est inutilisable, si un compte existe déjà ou si le
   * mot de passe reprend l'email
   */
  async accept(
    input: AcceptInvitationInput,
    client: ClientContext,
  ): Promise<{ tokens: IssuedTokens; user: AuthUser }> {
    const now = new Date();
    const invitation = await this.findUsable(input.token, now);
    await this.assertNoAccount(invitation.email);
    if (!isPasswordDifferentFromEmail(input.password, invitation.email)) {
      throw invalidField("password", PASSWORD_EQUALS_EMAIL_MESSAGE);
    }
    const passwordHash = await this.passwords.hash(input.password);

    const user = await this.prisma.$transaction(async (tx) => {
      // Consommation conditionnelle : deux soumissions simultanées du même lien ne passent pas
      const consumed = await tx.invitation.updateMany({
        where: { id: invitation.id, ...PENDING },
        data: { acceptedAt: now },
      });
      if (consumed.count === 0) throw badRequest(INVALID_INVITATION_LINK);

      // L'unicité de l'email en base protège aussi d'une création concurrente du compte
      const created = await tx.user.create({
        data: { email: invitation.email, name: input.name, passwordHash },
      });
      const others = await tx.invitation.findMany({
        where: { email: invitation.email, ...PENDING, expiresAt: { gt: now } },
        select: { id: true, spaceId: true, roles: true },
      });
      await tx.invitation.updateMany({
        where: { id: { in: others.map((other) => other.id) } },
        data: { acceptedAt: now },
      });
      await tx.membership.createMany({
        data: [
          { spaceId: invitation.spaceId, userId: created.id, roles: invitation.roles },
          ...others
            .filter((other) => other.spaceId !== invitation.spaceId)
            .map((other) => ({ spaceId: other.spaceId, userId: created.id, roles: other.roles })),
        ],
        skipDuplicates: true,
      });
      return created;
    });

    return this.auth.openSession(user, client, now);
  }

  /** Vérifie que l'utilisateur administre l'espace et renvoie l'espace et son profil. */
  private async requireSpaceAdmin(
    userId: string,
    spaceKey: string,
  ): Promise<{ space: SpaceRef; inviter: UserSummary }> {
    const { space, roles } = await this.access.requireAccess(userId, spaceKey);
    this.access.assertRoles(roles, ["ADMIN"]);
    const inviter = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: USER_SUMMARY_SELECT,
    });
    return { space, inviter };
  }

  /**
   * Émet une invitation (nouveau jeton) et l'envoie. Une seule invitation en attente par
   * adresse et par espace : les précédentes sont révoquées.
   */
  private async issueInvitation(
    space: SpaceRef,
    email: string,
    roles: SpaceRole[],
    inviter: UserSummary,
  ): Promise<InvitationInfo> {
    const now = new Date();
    const { token, hash } = this.tokens.generateOpaqueToken();
    const [, created] = await this.prisma.$transaction([
      this.prisma.invitation.updateMany({
        where: { spaceId: space.id, email, ...PENDING },
        data: { revokedAt: now },
      }),
      this.prisma.invitation.create({
        data: {
          spaceId: space.id,
          email,
          roles,
          tokenHash: hash,
          invitedById: inviter.id,
          expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
        },
        include: { invitedBy: { select: USER_SUMMARY_SELECT } },
      }),
    ]);

    const rendered = await renderInvitationEmail({
      inviterName: inviter.name,
      spaceName: space.name,
      acceptUrl: `${this.config.get("WEB_ORIGIN")}/invitation/${token}`,
      expiresInDays: INVITATION_TTL_DAYS,
    });
    this.mail.sendInBackground({ ...rendered, to: { email, name: email } }, "invitation");
    return toInvitationInfo(created, now);
  }

  /** Prévient un utilisateur existant qu'il a été ajouté à un espace. */
  private async notifyMemberAdded(
    member: UserSummary,
    inviter: UserSummary,
    space: SpaceRef,
  ): Promise<void> {
    const rendered = await renderMemberAddedEmail({
      name: member.name,
      inviterName: inviter.name,
      spaceName: space.name,
      appUrl: this.config.get("WEB_ORIGIN"),
    });
    this.mail.sendInBackground(
      { ...rendered, to: { email: member.email, name: member.name } },
      "ajout à un espace",
    );
  }

  /** Charge une invitation utilisable à partir du jeton du lien. */
  private async findUsable(token: string, now = new Date()) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash: this.tokens.hashOpaqueToken(token) },
      include: {
        space: { select: { name: true, deletedAt: true } },
        invitedBy: { select: { name: true } },
      },
    });
    if (
      !invitation ||
      invitation.acceptedAt ||
      invitation.revokedAt ||
      invitation.expiresAt <= now ||
      invitation.space.deletedAt
    ) {
      throw badRequest(INVALID_INVITATION_LINK);
    }
    return invitation;
  }

  /** Refuse l'acceptation si un compte a été créé entre-temps pour cette adresse. */
  private async assertNoAccount(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (user) throw badRequest(ACCOUNT_EXISTS);
  }
}
