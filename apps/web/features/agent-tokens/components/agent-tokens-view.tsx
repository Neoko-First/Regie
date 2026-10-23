"use client";

import {
  type AgentTokenInfo,
  AGENT_TOKEN_DURATIONS,
  type CreatedAgentToken,
  createAgentTokenSchema,
} from "@regie/shared";
import { Bot, Copy, KeyRound, Plus, ShieldOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FieldGroup } from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui-extended/confirm-dialog";
import { FormDialog } from "@/components/ui-extended/form-dialog";
import { SelectField, TextField } from "@/components/ui-extended/form-fields";
import { IconButton } from "@/components/ui-extended/icon-button";
import { formatDate, formatRelative } from "@/lib/format";
import {
  useAgentTokens,
  useCreateAgentToken,
  useRevokeAgentToken,
} from "../hooks/use-agent-tokens";

/** Chemin du serveur MCP, vu à travers le proxy BFF. */
const MCP_PATH = "/api/mcp";

/** Options de durée de validité. */
const DURATION_OPTIONS = AGENT_TOKEN_DURATIONS.map((days) => ({
  value: String(days),
  label: days === 365 ? "1 an" : `${days} jours`,
}));

/**
 * Copie un texte dans le presse-papiers, avec un toast de confirmation.
 *
 * @param text - Texte à copier
 * @param label - Ce qui a été copié (« Jeton », « Commande »)
 */
async function copy(text: string, label: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copié`);
  } catch {
    toast.error("Copie impossible : sélectionnez le texte et copiez-le manuellement.");
  }
}

/** Bloc de texte à copier (jeton, commande). */
function CopyBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-muted flex items-start gap-2 rounded-md p-2">
      <code className="min-w-0 flex-1 font-mono text-xs break-all">{value}</code>
      <IconButton
        label={`Copier : ${label.toLowerCase()}`}
        size="icon-xs"
        onClick={() => copy(value, label)}
      >
        <Copy />
      </IconButton>
    </div>
  );
}

/**
 * Affiche le jeton créé, UNE seule fois, avec la commande de configuration de Claude Code.
 */
function TokenCreatedDialog({
  created,
  onClose,
}: {
  created: CreatedAgentToken;
  onClose: () => void;
}) {
  const mcpUrl = `${window.location.origin}${MCP_PATH}`;
  const command = `claude mcp add --transport http regie ${mcpUrl} --header "Authorization: Bearer ${created.token}"`;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Jeton créé pour {created.info.name}</DialogTitle>
          <DialogDescription>
            L’agent agira en votre nom, avec vos droits, mais ne pourra jamais valider un gate.
          </DialogDescription>
        </DialogHeader>
        <Alert>
          <KeyRound />
          <AlertTitle>Copiez ce jeton maintenant</AlertTitle>
          <AlertDescription>
            Il ne sera plus jamais affiché. Ne le partagez pas : il donne accès à Régie en votre
            nom.
          </AlertDescription>
        </Alert>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Jeton</span>
          <CopyBlock value={created.token} label="Jeton" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Configuration de Claude Code</span>
          <CopyBlock value={command} label="Commande" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Bouton et modale de création d'un jeton. */
export function CreateAgentTokenButton() {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<CreatedAgentToken | null>(null);
  const createToken = useCreateAgentToken();

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus /> Nouveau jeton
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Nouveau jeton d’agent"
        description="Donnez un nom reconnaissable : il apparaît dans l’historique des évolutions."
        schema={createAgentTokenSchema}
        defaultValues={{ name: "", expiresInDays: "90" }}
        mode="await"
        submitLabel="Créer le jeton"
        onSubmit={async (values) => setCreated(await createToken.mutateAsync(values))}
      >
        {(form) => (
          <FieldGroup>
            <TextField
              control={form.control}
              name="name"
              label="Nom de l’agent"
              placeholder="Ex. Claude Code (poste d’Alexandre)"
              autoFocus
            />
            <SelectField
              control={form.control}
              name="expiresInDays"
              label="Validité"
              options={DURATION_OPTIONS}
              emptyOption={{ label: "Sans expiration", value: null }}
            />
          </FieldGroup>
        )}
      </FormDialog>
      {created ? <TokenCreatedDialog created={created} onClose={() => setCreated(null)} /> : null}
    </>
  );
}

/**
 * Liste des jetons d'agent actifs, avec leur révocation.
 */
export function AgentTokensList() {
  const tokens = useAgentTokens();
  const revoke = useRevokeAgentToken();
  const [toRevoke, setToRevoke] = useState<AgentTokenInfo | null>(null);

  if (tokens.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Bot />
          </EmptyMedia>
          <EmptyTitle>Aucun jeton d’agent</EmptyTitle>
          <EmptyDescription>
            Créez un jeton pour qu’un agent IA (Claude Code…) propose et rédige des évolutions en
            votre nom, via le serveur MCP de Régie.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateAgentTokenButton />
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Jeton</TableHead>
            <TableHead>Dernière utilisation</TableHead>
            <TableHead>Expire le</TableHead>
            <TableHead className="w-10">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map((token) => (
            <TableRow key={token.id}>
              <TableCell className="font-medium">{token.name}</TableCell>
              <TableCell className="text-muted-foreground font-mono text-xs">
                {token.prefix}…
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {token.lastUsedAt ? (
                  <time dateTime={token.lastUsedAt} suppressHydrationWarning>
                    {formatRelative(token.lastUsedAt)}
                  </time>
                ) : (
                  "Jamais"
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {token.expiresAt ? formatDate(token.expiresAt) : "Jamais"}
              </TableCell>
              <TableCell>
                <IconButton
                  label={`Révoquer le jeton ${token.name}`}
                  size="icon-sm"
                  onClick={() => setToRevoke(token)}
                >
                  <ShieldOff />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ConfirmDialog
        open={toRevoke !== null}
        onOpenChange={(open) => !open && setToRevoke(null)}
        title="Révoquer ce jeton ?"
        description={
          toRevoke ? (
            <>
              L’agent <strong>{toRevoke.name}</strong> perdra immédiatement l’accès à Régie.
            </>
          ) : null
        }
        confirmLabel="Révoquer"
        confirmIcon={<ShieldOff />}
        onConfirm={() => revoke.mutateAsync(toRevoke!.id)}
      />
    </>
  );
}
