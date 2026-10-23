import { HttpStatus, Injectable } from "@nestjs/common";
import { renderPasswordChangedEmail, renderPasswordResetEmail } from "@regie/emails";
import {
  type ChangePasswordInput,
  ErrorCode,
  isPasswordDifferentFromEmail,
  PASSWORD_EQUALS_EMAIL_MESSAGE,
  type ResetPasswordInput,
} from "@regie/shared";
import { AppException } from "../common/errors/app.exception";
import { invalidField } from "../common/errors/domain-errors";
import { formatDateTimeFr } from "../common/format";
import { AppConfigService } from "../config/app-config.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { PASSWORD_RESET_TTL_MS } from "./auth.constants";
import { AuthService } from "./auth.service";
import type { AuthContext } from "./auth.types";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";

const MS_PER_MINUTE = 60_000;

/** Message unique pour un lien de réinitialisation inutilisable (inconnu, expiré, déjà utilisé). */
const INVALID_RESET_LINK =
  "Ce lien de réinitialisation n'est plus valable. Faites une nouvelle demande.";

/**
 * Parcours de mot de passe (CLAUDE.md §12.3) : mot de passe oublié, réinitialisation
 * par lien, changement par l'utilisateur connecté. Chaque changement révoque des sessions
 * et déclenche un email de notification.
 */
@Injectable()
export class PasswordFlowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly auth: AuthService,
    private readonly mail: MailService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Demande de réinitialisation. Le comportement visible est IDENTIQUE que le compte existe
   * ou non (même réponse, même délai : l'email part en arrière-plan), pour ne pas révéler
   * quelles adresses ont un compte.
   *
   * @param email - Adresse saisie (normalisée par le schéma)
   */
  async requestReset(email: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true, email: true, name: true },
    });
    if (!user) return;

    const { token, hash } = this.tokens.generateOpaqueToken();
    await this.prisma.$transaction([
      // Une seule demande valable à la fois : les liens précédents ne fonctionnent plus
      this.prisma.verificationToken.updateMany({
        where: { userId: user.id, type: "PASSWORD_RESET", usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.verificationToken.create({
        data: {
          userId: user.id,
          type: "PASSWORD_RESET",
          tokenHash: hash,
          expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
      }),
    ]);

    const rendered = await renderPasswordResetEmail({
      name: user.name,
      resetUrl: `${this.config.get("WEB_ORIGIN")}/reset-password/${token}`,
      expiresInMinutes: PASSWORD_RESET_TTL_MS / MS_PER_MINUTE,
    });
    this.mail.sendInBackground({ ...rendered, to: user }, "réinitialisation du mot de passe");
  }

  /**
   * Réinitialise le mot de passe avec le jeton reçu par email. Le jeton est consommé,
   * toutes les sessions sont révoquées, le verrouillage éventuel est levé.
   *
   * @param input - Jeton et nouveau mot de passe (politique vérifiée par le schéma)
   * @throws AppException 400 si le lien est inutilisable ou si le mot de passe reprend l'email
   */
  async reset(input: ResetPasswordInput): Promise<void> {
    const now = new Date();
    const stored = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: this.tokens.hashOpaqueToken(input.token) },
      include: { user: { select: { id: true, email: true, name: true, deletedAt: true } } },
    });
    if (
      !stored ||
      stored.type !== "PASSWORD_RESET" ||
      stored.usedAt ||
      stored.expiresAt <= now ||
      stored.user.deletedAt
    ) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        INVALID_RESET_LINK,
      );
    }
    if (!isPasswordDifferentFromEmail(input.password, stored.user.email)) {
      throw invalidField("password", PASSWORD_EQUALS_EMAIL_MESSAGE);
    }

    const passwordHash = await this.passwords.hash(input.password);
    // Consommation conditionnelle : deux soumissions simultanées du même lien ne passent pas
    const consumed = await this.prisma.verificationToken.updateMany({
      where: { id: stored.id, usedAt: null },
      data: { usedAt: now },
    });
    if (consumed.count === 0) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        INVALID_RESET_LINK,
      );
    }
    await this.prisma.user.update({
      where: { id: stored.user.id },
      data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
    });
    await this.auth.logoutAll(stored.user.id);
    await this.notifyChanged(stored.user, now, true);
  }

  /**
   * Change le mot de passe de l'utilisateur connecté : mot de passe actuel exigé,
   * autres sessions révoquées (l'appareil courant reste connecté).
   *
   * @param auth - Utilisateur connecté
   * @param input - Mot de passe actuel et nouveau
   * @throws AppException 400 (champ `currentPassword` ou `newPassword`) si refusé
   */
  async change(auth: AuthContext, input: ChangePasswordInput): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: auth.userId },
      select: { id: true, email: true, name: true, passwordHash: true },
    });
    if (!(await this.passwords.verify(user.passwordHash, input.currentPassword))) {
      throw invalidField("currentPassword", "Le mot de passe actuel est incorrect.");
    }
    if (!isPasswordDifferentFromEmail(input.newPassword, user.email)) {
      throw invalidField("newPassword", PASSWORD_EQUALS_EMAIL_MESSAGE);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await this.passwords.hash(input.newPassword) },
    });
    if (auth.sessionId) await this.auth.revokeOtherSessions(user.id, auth.sessionId);
    await this.notifyChanged(user, new Date(), false);
  }

  /** Notification de sécurité après un changement de mot de passe. */
  private async notifyChanged(
    user: { email: string; name: string },
    changedAt: Date,
    viaReset: boolean,
  ): Promise<void> {
    const rendered = await renderPasswordChangedEmail({
      name: user.name,
      changedAt: formatDateTimeFr(changedAt),
      viaReset,
    });
    this.mail.sendInBackground(
      { ...rendered, to: { email: user.email, name: user.name } },
      "notification de changement de mot de passe",
    );
  }
}
