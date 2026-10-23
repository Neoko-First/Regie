import type { MailSettingsData, MailSettingsInfo, MailTransportKind } from "@regie/shared";
import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

/** Chemin de l'API des réglages d'email (client et préchargement serveur). */
export const MAIL_SETTINGS_PATH = "/admin/mail-settings";

/** Requêtes de modification de l'administration. */
export const adminApi = {
  updateMailSettings: (input: MailSettingsData) =>
    apiClient.put<MailSettingsInfo>(MAIL_SETTINGS_PATH, input),
  sendTestEmail: () =>
    apiClient.post<{ transport: MailTransportKind }>(`${MAIL_SETTINGS_PATH}/test`),
};

/** Réglages d'envoi des emails (sans les clés). */
export const mailSettingsQuery = () =>
  queryOptions({
    queryKey: queryKeys.admin.mailSettings(),
    queryFn: () => apiClient.get<MailSettingsInfo>(MAIL_SETTINGS_PATH),
  });
