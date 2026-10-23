"use client";

import {
  addMemberSchema,
  type InvitationInfo,
  memberRolesSchema,
  SPACE_ROLE_LABELS,
  type SpaceMember,
  type SpaceRole,
} from "@regie/shared";
import { Mail, Pencil, RefreshCw, ShieldOff, UserMinus, UserPlus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
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
import { MultiToggleField, TextField } from "@/components/ui-extended/form-fields";
import { IconButton } from "@/components/ui-extended/icon-button";
import { UserAvatar } from "@/components/ui-extended/user-avatar";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { formatDate } from "@/lib/format";
import { ROLE_OPTIONS } from "../constants";
import {
  useAddMember,
  useRemoveMember,
  useResendInvitation,
  useRevokeInvitation,
  useSetMemberRoles,
  useSpaceInvitations,
  useSpaceMemberList,
} from "../hooks/use-space-admin";

/** Aide affichée sous le choix des rôles. */
const ROLES_HINT =
  "Les rôles se cumulent. Admin : gère les membres et les invitations de l’espace.";

/** Rôles d'un membre ou d'une invitation, sous forme de pastilles. */
function RoleBadges({ roles }: { roles: readonly SpaceRole[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge key={role} variant={role === "ADMIN" ? "default" : "secondary"}>
          {SPACE_ROLE_LABELS[role]}
        </Badge>
      ))}
    </div>
  );
}

/**
 * Bouton et modale « Ajouter un membre » : par email, la personne est rattachée si elle a
 * déjà un compte, invitée sinon. La modale attend la réponse (le résultat est annoncé).
 *
 * @param props.spaceKey - Clé de l'espace
 */
export function AddMemberButton({ spaceKey }: { spaceKey: string }) {
  const [open, setOpen] = useState(false);
  const addMember = useAddMember(spaceKey);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus /> Ajouter un membre
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Ajouter un membre"
        description="Sans compte Régie, la personne reçoit une invitation valable 7 jours pour créer le sien."
        schema={addMemberSchema}
        defaultValues={{ email: "", roles: [] }}
        mode="await"
        submitLabel="Ajouter"
        onSubmit={(values) => addMember.mutateAsync(values).then(() => undefined)}
      >
        {(form) => (
          <FieldGroup>
            <TextField
              control={form.control}
              name="email"
              label="Adresse email"
              type="email"
              autoComplete="off"
              autoFocus
            />
            <MultiToggleField
              control={form.control}
              name="roles"
              label="Rôles"
              description={ROLES_HINT}
              options={ROLE_OPTIONS}
            />
          </FieldGroup>
        )}
      </FormDialog>
    </>
  );
}

/** Modale de modification des rôles d'un membre (optimiste). */
function EditRolesDialog({
  spaceKey,
  member,
  onClose,
}: {
  spaceKey: string;
  member: SpaceMember;
  onClose: () => void;
}) {
  const setRoles = useSetMemberRoles(spaceKey);
  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Rôles de ${member.user.name}`}
      schema={memberRolesSchema}
      defaultValues={{ roles: member.roles }}
      submitLabel="Enregistrer les rôles"
      onSubmit={({ roles }) => setRoles.mutate({ userId: member.user.id, roles })}
    >
      {(form) => (
        <MultiToggleField
          control={form.control}
          name="roles"
          label="Rôles"
          description={ROLES_HINT}
          options={ROLE_OPTIONS}
        />
      )}
    </FormDialog>
  );
}

/**
 * Membres d'un espace, avec la modification des rôles et le retrait.
 * À rendre sous un <Suspense>.
 *
 * @param props.spaceKey - Clé de l'espace
 */
export function MembersTable({ spaceKey }: { spaceKey: string }) {
  const members = useSpaceMemberList(spaceKey);
  const me = useCurrentUser();
  const removeMember = useRemoveMember(spaceKey);
  const [editing, setEditing] = useState<SpaceMember | null>(null);
  const [toRemove, setToRemove] = useState<SpaceMember | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Membre</TableHead>
            <TableHead>Rôles</TableHead>
            <TableHead className="w-24">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.user.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <UserAvatar user={member.user} />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">
                      {member.user.name}
                      {member.user.id === me.id ? (
                        <span className="text-muted-foreground font-normal"> (vous)</span>
                      ) : null}
                    </span>
                    <span className="text-caption text-muted-foreground truncate">
                      {member.user.email}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <RoleBadges roles={member.roles} />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <IconButton
                    label={`Modifier les rôles de ${member.user.name}`}
                    size="icon-sm"
                    onClick={() => setEditing(member)}
                  >
                    <Pencil />
                  </IconButton>
                  <IconButton
                    label={`Retirer ${member.user.name} de l’espace`}
                    size="icon-sm"
                    onClick={() => setToRemove(member)}
                  >
                    <UserMinus />
                  </IconButton>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing ? (
        <EditRolesDialog spaceKey={spaceKey} member={editing} onClose={() => setEditing(null)} />
      ) : null}
      <ConfirmDialog
        open={toRemove !== null}
        onOpenChange={(open) => !open && setToRemove(null)}
        title="Retirer ce membre ?"
        description={
          toRemove ? (
            <>
              <strong>{toRemove.user.name}</strong> n’aura plus accès aux évolutions de cet espace.
              Son historique (évolutions, commentaires, validations) est conservé.
            </>
          ) : null
        }
        confirmLabel="Retirer"
        confirmIcon={<UserMinus />}
        onConfirm={async () => removeMember.mutate(toRemove!.user.id)}
      />
    </>
  );
}

/**
 * Invitations en attente d'un espace, avec le renvoi et la révocation.
 * À rendre sous un <Suspense>.
 *
 * @param props.spaceKey - Clé de l'espace
 */
export function InvitationsTable({ spaceKey }: { spaceKey: string }) {
  const invitations = useSpaceInvitations(spaceKey);
  const resend = useResendInvitation(spaceKey);
  const revoke = useRevokeInvitation(spaceKey);
  const [toRevoke, setToRevoke] = useState<InvitationInfo | null>(null);

  if (invitations.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Mail />
          </EmptyMedia>
          <EmptyTitle>Aucune invitation en attente</EmptyTitle>
          <EmptyDescription>
            Les personnes invitées apparaissent ici jusqu’à ce qu’elles créent leur compte.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Adresse</TableHead>
            <TableHead>Rôles</TableHead>
            <TableHead className="hidden md:table-cell">Invitée par</TableHead>
            <TableHead>Validité</TableHead>
            <TableHead className="w-24">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => (
            <TableRow key={invitation.id}>
              <TableCell className="font-medium">{invitation.email}</TableCell>
              <TableCell>
                <RoleBadges roles={invitation.roles} />
              </TableCell>
              <TableCell className="text-muted-foreground hidden md:table-cell">
                {invitation.invitedBy.name}
              </TableCell>
              <TableCell>
                {invitation.expired ? (
                  <Badge variant="warning" dot>
                    Expirée
                  </Badge>
                ) : (
                  <span className="text-body-sm text-muted-foreground">
                    Jusqu’au {formatDate(invitation.expiresAt)}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <IconButton
                    label={`Renvoyer l’invitation à ${invitation.email}`}
                    size="icon-sm"
                    disabled={resend.isPending}
                    onClick={() => resend.mutate(invitation)}
                  >
                    <RefreshCw className={resend.isPending ? "animate-spin" : undefined} />
                  </IconButton>
                  <IconButton
                    label={`Révoquer l’invitation de ${invitation.email}`}
                    size="icon-sm"
                    onClick={() => setToRevoke(invitation)}
                  >
                    <ShieldOff />
                  </IconButton>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ConfirmDialog
        open={toRevoke !== null}
        onOpenChange={(open) => !open && setToRevoke(null)}
        title="Révoquer cette invitation ?"
        description={
          toRevoke ? (
            <>
              Le lien envoyé à <strong>{toRevoke.email}</strong> ne fonctionnera plus. Vous pourrez
              l’inviter de nouveau plus tard.
            </>
          ) : null
        }
        confirmLabel="Révoquer"
        confirmIcon={<ShieldOff />}
        onConfirm={async () => revoke.mutate(toRevoke!.id)}
      />
    </>
  );
}
