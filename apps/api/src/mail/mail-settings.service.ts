import { Injectable } from "@nestjs/common";
import type { MailSettingsData } from "@regie/shared";
import type { AuthContext } from "../auth/auth.types";
import { SecretBoxService } from "../common/crypto/secret-box.service";
import type { MailSettings } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/** Identifiant de l'unique ligne de réglages. */
const SETTINGS_ID = "default";

/** Nombre de caractères de la clé API gardés en clair pour la reconnaître. */
const API_KEY_HINT_LENGTH = 4;

/** Configuration Mailjet prête à l'emploi (clés déchiffrées, à ne jamais journaliser). */
export interface MailjetConfig {
  sender: { email: string; name: string };
  credentials: { apiKey: string; secretKey: string };
}

/**
 * Réglages d'envoi des emails, modifiés depuis l'administration. Les clés Mailjet sont
 * chiffrées en base et ne sortent de ce service que déchiffrées pour un envoi.
 */
@Injectable()
export class MailSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly secrets: SecretBoxService,
  ) {}

  /**
   * Réglages enregistrés.
   *
   * @returns La ligne de réglages, ou `null` si rien n'a encore été configuré
   */
  find(): Promise<MailSettings | null> {
    return this.prisma.mailSettings.findUnique({ where: { id: SETTINGS_ID } });
  }

  /**
   * Enregistre les réglages. Une clé non fournie conserve la valeur enregistrée.
   *
   * @param auth - Administrateur qui modifie
   * @param input - Expéditeur, activation, clés éventuelles
   * @returns Les réglages enregistrés
   */
  async update(auth: AuthContext, input: MailSettingsData): Promise<MailSettings> {
    const secretsData = {
      ...(input.apiKey
        ? {
            apiKeyEncrypted: this.secrets.encrypt(input.apiKey),
            apiKeyHint: input.apiKey.slice(-API_KEY_HINT_LENGTH),
          }
        : {}),
      ...(input.secretKey ? { secretKeyEncrypted: this.secrets.encrypt(input.secretKey) } : {}),
    };
    const data = {
      senderEmail: input.senderEmail,
      senderName: input.senderName,
      enabled: input.enabled,
      updatedById: auth.userId,
      ...secretsData,
    };
    return this.prisma.mailSettings.upsert({
      where: { id: SETTINGS_ID },
      update: data,
      create: { id: SETTINGS_ID, ...data },
    });
  }

  /**
   * Configuration Mailjet utilisable, si l'envoi par Mailjet est activé et complet.
   *
   * @returns Expéditeur et clés déchiffrées, ou `null`
   */
  async mailjetConfig(): Promise<MailjetConfig | null> {
    const settings = await this.find();
    if (!settings?.enabled || !settings.apiKeyEncrypted || !settings.secretKeyEncrypted) {
      return null;
    }
    return {
      sender: { email: settings.senderEmail, name: settings.senderName },
      credentials: {
        apiKey: this.secrets.decrypt(settings.apiKeyEncrypted),
        secretKey: this.secrets.decrypt(settings.secretKeyEncrypted),
      },
    };
  }
}
