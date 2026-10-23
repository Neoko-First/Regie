"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type AcceptInvitationInput, acceptInvitationSchema } from "@regie/shared";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui-extended/callout";
import { PasswordField, TextField } from "@/components/ui-extended/form-fields";
import { PasswordStrength } from "@/features/auth/components/password-strength";
import { LOGIN_PATH } from "@/features/auth/lib/safe-redirect";
import { getErrorMessage } from "@/lib/api-client";
import { formatDateLong } from "@/lib/format";
import { applyFieldErrors } from "@/lib/form-errors";
import { useAcceptInvitation, useInvitationPreview } from "../hooks/use-invitation";

/** Formulaire de création du compte (nom et mot de passe). */
function AcceptForm({ token, email }: { token: string; email: string }) {
  const accept = useAcceptInvitation();
  const form = useForm<AcceptInvitationInput>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { token, name: "", password: "", passwordConfirm: "" },
  });
  const password = useWatch({ control: form.control, name: "password" });
  const { isDirty, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    try {
      await accept.mutateAsync(values);
    } catch (error) {
      applyFieldErrors(form, error);
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        {/* Champ caché pour les gestionnaires de mots de passe : l'identifiant du compte */}
        <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
        <TextField
          control={form.control}
          name="name"
          label="Votre nom"
          autoComplete="name"
          description="Il est affiché à vos collègues (auteur, assigné, validations)."
          autoFocus
        />
        <PasswordField
          control={form.control}
          name="password"
          label="Mot de passe"
          autoComplete="new-password"
        />
        <PasswordStrength password={password} />
        <PasswordField
          control={form.control}
          name="passwordConfirm"
          label="Confirmer le mot de passe"
          autoComplete="new-password"
        />
      </FieldGroup>
      <Button type="submit" variant="success" disabled={!isDirty || isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : <UserPlus />} Créer mon compte
      </Button>
    </form>
  );
}

/**
 * Acceptation d'une invitation : aperçu (espace, auteur, adresse) puis création du compte.
 * Un lien inutilisable affiche le motif et un accès à la connexion.
 *
 * @param props.token - Jeton du lien reçu par email
 */
export function AcceptInvitation({ token }: { token: string }) {
  const preview = useInvitationPreview(token);

  if (preview.isPending) return <Skeleton className="h-80 w-full" />;
  if (preview.isError) {
    return (
      <div className="flex flex-col gap-4">
        <Callout tone="warning" title="Invitation inutilisable">
          {getErrorMessage(preview.error)}
        </Callout>
        <Button asChild variant="outline">
          <Link href={LOGIN_PATH}>
            <LogIn /> Aller à la connexion
          </Link>
        </Button>
      </div>
    );
  }

  const invitation = preview.data;
  return (
    <div className="flex flex-col gap-6">
      <Callout tone="info" title={`Espace ${invitation.spaceName}`}>
        {invitation.invitedByName} vous invite à rejoindre cet espace avec l’adresse{" "}
        <strong>{invitation.email}</strong>. Invitation valable jusqu’au{" "}
        {formatDateLong(invitation.expiresAt)}.
      </Callout>
      <AcceptForm token={token} email={invitation.email} />
    </div>
  );
}
