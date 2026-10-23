import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { renderTestEmail } from "@regie/emails";
import {
  ErrorCode,
  type MailSettingsInfo,
  mailSettingsSchema,
  type MailTransportKind,
} from "@regie/shared";
import { createZodDto } from "nestjs-zod";
import type { AuthContext } from "../auth/auth.types";
import { CurrentAuth } from "../auth/decorators/current-auth.decorator";
import { AppException } from "../common/errors/app.exception";
import type { MailSettings } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SpaceAccessService } from "../spaces/space-access.service";
import { MailSettingsService } from "./mail-settings.service";
import { MailService, TRANSPORT_LABELS } from "./mail.service";

/** Corps de `PUT /admin/mail-settings`. */
class MailSettingsDto extends createZodDto(mailSettingsSchema) {}

/** Réglages renvoyés à l'interface : jamais les clés, seulement un indice. */
function toInfo(
  settings: MailSettings | null,
  activeTransport: MailTransportKind,
): MailSettingsInfo {
  return {
    senderEmail: settings?.senderEmail ?? "",
    senderName: settings?.senderName ?? "Régie",
    enabled: settings?.enabled ?? false,
    apiKeyHint: settings?.apiKeyHint ?? null,
    secretKeyConfigured: Boolean(settings?.secretKeyEncrypted),
    activeTransport,
    updatedAt: settings?.updatedAt.toISOString() ?? null,
  };
}

/**
 * Administration de l'envoi d'emails (Mailjet). Réservée à l'administrateur de la plateforme,
 * et aux sessions navigateur (un agent ne peut pas l'atteindre : il n'a accès qu'à /mcp).
 */
@ApiTags("Administration")
@Controller("admin/mail-settings")
export class MailAdminController {
  constructor(
    private readonly access: SpaceAccessService,
    private readonly settings: MailSettingsService,
    private readonly mail: MailService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async get(@CurrentAuth() auth: AuthContext): Promise<MailSettingsInfo> {
    await this.access.assertPlatformAdmin(auth.userId);
    return toInfo(await this.settings.find(), await this.mail.activeTransport());
  }

  @Put()
  async update(
    @CurrentAuth() auth: AuthContext,
    @Body() body: MailSettingsDto,
  ): Promise<MailSettingsInfo> {
    await this.access.assertPlatformAdmin(auth.userId);
    const saved = await this.settings.update(auth, body);
    return toInfo(saved, await this.mail.activeTransport());
  }

  /** Envoie un email de test à l'administrateur, avec la configuration actuelle. */
  @Post("test")
  @HttpCode(HttpStatus.OK)
  async test(@CurrentAuth() auth: AuthContext): Promise<{ transport: MailTransportKind }> {
    await this.access.assertPlatformAdmin(auth.userId);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: auth.userId },
      select: { email: true, name: true },
    });
    const transport = await this.mail.activeTransport();
    try {
      const rendered = await renderTestEmail({
        name: user.name,
        transport: TRANSPORT_LABELS[transport],
      });
      return { transport: await this.mail.send({ ...rendered, to: user }) };
    } catch {
      throw new AppException(
        HttpStatus.BAD_GATEWAY,
        ErrorCode.SERVICE_UNAVAILABLE,
        "L'envoi a échoué : vérifiez les clés Mailjet, l'expéditeur (adresse validée chez Mailjet) et l'activation.",
      );
    }
  }
}
