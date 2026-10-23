"use client";

import { type MailSettingsInfo, mailSettingsSchema } from "@regie/shared";
import { Loader2, Send, Settings2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Callout } from "@/components/ui-extended/callout";
import { FormDialog } from "@/components/ui-extended/form-dialog";
import { PasswordField, SwitchField, TextField } from "@/components/ui-extended/form-fields";
import { formatDateTime } from "@/lib/format";
import { TRANSPORT_LABELS } from "../constants";
import {
  useMailSettings,
  useSendTestEmail,
  useUpdateMailSettings,
} from "../hooks/use-mail-settings";

/** Ligne « libellé : valeur » de la carte de statut. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-label">{label}</dt>
      <dd className="text-body-sm text-muted-foreground">{children}</dd>
    </div>
  );
}

/** Modale de configuration de Mailjet. Les clés ne sont jamais réaffichées. */
function MailSettingsDialog({
  settings,
  open,
  onOpenChange,
}: {
  settings: MailSettingsInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateMailSettings();
  const keyHint = "Laisser vide pour conserver la clé enregistrée.";

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Configurer Mailjet"
      description="Les clés sont chiffrées avant d'être enregistrées et ne seront plus jamais affichées."
      schema={mailSettingsSchema}
      defaultValues={{
        senderEmail: settings.senderEmail,
        senderName: settings.senderName,
        enabled: settings.enabled,
        apiKey: "",
        secretKey: "",
      }}
      mode="await"
      submitLabel="Enregistrer les réglages"
      onSubmit={(values) => update.mutateAsync(values).then(() => undefined)}
    >
      {(form) => (
        <FieldGroup>
          <TextField
            control={form.control}
            name="senderEmail"
            label="Adresse de l'expéditeur"
            type="email"
            description="Elle doit être validée dans votre compte Mailjet."
          />
          <TextField control={form.control} name="senderName" label="Nom de l'expéditeur" />
          <PasswordField
            control={form.control}
            name="apiKey"
            label="Clé API"
            autoComplete="off"
            description={
              settings.apiKeyHint
                ? `Clé enregistrée : …${settings.apiKeyHint}. ${keyHint}`
                : undefined
            }
          />
          <PasswordField
            control={form.control}
            name="secretKey"
            label="Clé secrète"
            autoComplete="off"
            description={settings.secretKeyConfigured ? `Clé enregistrée. ${keyHint}` : undefined}
          />
          <SwitchField
            control={form.control}
            name="enabled"
            label="Envoyer avec Mailjet"
            description="Désactivé : Régie utilise le SMTP de repli s'il est configuré."
          />
        </FieldGroup>
      )}
    </FormDialog>
  );
}

/**
 * Administration de l'envoi des emails : moyen d'envoi actif, configuration Mailjet,
 * email de test. Réservée à l'administrateur de la plateforme (vérifié par l'API).
 */
export function MailSettingsView() {
  const settings = useMailSettings();
  const sendTest = useSendTestEmail();
  const [editing, setEditing] = useState(false);
  const mailjetReady = Boolean(
    settings.apiKeyHint && settings.secretKeyConfigured && settings.senderEmail,
  );

  return (
    <>
      {settings.activeTransport === "NONE" ? (
        <Callout tone="destructive" title="Aucun envoi possible">
          Ni Mailjet ni SMTP de repli ne sont configurés : les invitations et les liens de
          réinitialisation ne partiront pas.
        </Callout>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-h4">Mailjet</CardTitle>
          <CardDescription>
            Service d’envoi des invitations, des liens de réinitialisation et des notifications de
            sécurité.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-3">
            <Row label="Moyen d’envoi actif">
              <Badge variant={settings.activeTransport === "MAILJET" ? "success" : "warning"} dot>
                {TRANSPORT_LABELS[settings.activeTransport]}
              </Badge>
            </Row>
            <Row label="Mailjet">
              {settings.enabled ? "Activé" : "Désactivé"}
              {settings.enabled && !mailjetReady ? " (configuration incomplète)" : ""}
            </Row>
            <Row label="Expéditeur">
              {settings.senderEmail
                ? `${settings.senderName} <${settings.senderEmail}>`
                : "Non renseigné"}
            </Row>
            <Row label="Clés">
              {settings.apiKeyHint ? `Clé API …${settings.apiKeyHint}` : "Clé API absente"} ·{" "}
              {settings.secretKeyConfigured ? "clé secrète enregistrée" : "clé secrète absente"}
            </Row>
            {settings.updatedAt ? (
              <Row label="Dernière modification">{formatDateTime(settings.updatedAt)}</Row>
            ) : null}
          </dl>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2 border-t">
          <Button
            variant="outline"
            size="sm"
            disabled={sendTest.isPending || settings.activeTransport === "NONE"}
            onClick={() => sendTest.mutate()}
          >
            {sendTest.isPending ? <Loader2 className="animate-spin" /> : <Send />} Envoyer un email
            de test
          </Button>
          <Button size="sm" onClick={() => setEditing(true)}>
            <Settings2 /> Configurer
          </Button>
        </CardFooter>
      </Card>
      <MailSettingsDialog settings={settings} open={editing} onOpenChange={setEditing} />
    </>
  );
}
