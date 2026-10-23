"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  type ChangePasswordInput,
  changePasswordSchema,
  type ForgotPasswordInput,
  forgotPasswordSchema,
  type ResetPasswordInput,
  resetPasswordSchema,
} from "@regie/shared";
import { ArrowLeft, KeyRound, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { type Path, useForm, type UseFormReturn, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Callout } from "@/components/ui-extended/callout";
import { FormDialog } from "@/components/ui-extended/form-dialog";
import { PasswordField, TextField } from "@/components/ui-extended/form-fields";
import { isApiError } from "@/lib/api-client";
import {
  useChangePassword,
  useForgotPassword,
  useResetPassword,
} from "../hooks/use-password-flows";
import { LOGIN_PATH } from "../lib/safe-redirect";
import { PasswordStrength } from "./password-strength";

/**
 * Remonte les erreurs de champ renvoyées par l'API dans le formulaire (CLAUDE.md §9).
 *
 * @param form - Formulaire concerné
 * @param error - Erreur reçue
 */
function applyFieldErrors<T extends Record<string, unknown>>(
  form: UseFormReturn<T>,
  error: unknown,
) {
  if (!isApiError(error) || !error.fieldErrors) return;
  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    form.setError(field as Path<T>, { message: messages.join(" ") });
  }
}

/** Lien de retour vers la connexion. */
function BackToLogin() {
  return (
    <Button asChild variant="ghost" size="sm" className="self-start">
      <Link href={LOGIN_PATH}>
        <ArrowLeft /> Retour à la connexion
      </Link>
    </Button>
  );
}

/**
 * Formulaire « Mot de passe oublié ». Après l'envoi, le même message s'affiche que le compte
 * existe ou non (on ne révèle pas quelles adresses ont un compte).
 */
export function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const [sent, setSent] = useState(false);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const { isDirty, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    try {
      await forgot.mutateAsync(values);
      setSent(true);
    } catch {
      // Toast d'erreur affiché par la gestion globale
    }
  });

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <Callout tone="success" title="Demande envoyée">
          Si un compte existe pour cette adresse, vous allez recevoir un email avec un lien de
          réinitialisation, valable 30 minutes. Pensez à vérifier vos courriers indésirables.
        </Callout>
        <BackToLogin />
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <TextField
        control={form.control}
        name="email"
        label="Adresse email"
        type="email"
        autoComplete="username"
        autoFocus
      />
      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />} Recevoir un lien
        </Button>
        <BackToLogin />
      </div>
    </form>
  );
}

/**
 * Formulaire de nouveau mot de passe, depuis le lien reçu par email.
 *
 * @param props.token - Jeton du lien
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const reset = useResetPassword();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", passwordConfirm: "" },
  });
  const password = useWatch({ control: form.control, name: "password" });
  const { isDirty, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    try {
      await reset.mutateAsync(values);
    } catch (error) {
      applyFieldErrors(form, error);
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <PasswordField
          control={form.control}
          name="password"
          label="Nouveau mot de passe"
          autoComplete="new-password"
          autoFocus
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
        {isSubmitting ? <Loader2 className="animate-spin" /> : <KeyRound />} Enregistrer le mot de
        passe
      </Button>
    </form>
  );
}

/** Champs de la modale de changement de mot de passe (indicateur de force compris). */
function ChangePasswordFields({ form }: { form: UseFormReturn<ChangePasswordInput> }) {
  const newPassword = useWatch({ control: form.control, name: "newPassword" });
  return (
    <FieldGroup>
      <PasswordField
        control={form.control}
        name="currentPassword"
        label="Mot de passe actuel"
        autoComplete="current-password"
        autoFocus
      />
      <PasswordField
        control={form.control}
        name="newPassword"
        label="Nouveau mot de passe"
        autoComplete="new-password"
      />
      <PasswordStrength password={newPassword} />
      <PasswordField
        control={form.control}
        name="newPasswordConfirm"
        label="Confirmer le nouveau mot de passe"
        autoComplete="new-password"
      />
    </FieldGroup>
  );
}

/** Bouton et modale « Changer le mot de passe » (attend la réponse du serveur). */
export function ChangePasswordButton() {
  const [open, setOpen] = useState(false);
  const change = useChangePassword();

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <KeyRound /> Changer le mot de passe
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Changer le mot de passe"
        description="Vos autres appareils seront déconnectés ; celui-ci reste connecté."
        schema={changePasswordSchema}
        defaultValues={{ currentPassword: "", newPassword: "", newPasswordConfirm: "" }}
        mode="await"
        submitLabel="Changer le mot de passe"
        onSubmit={(values) => change.mutateAsync(values)}
      >
        {(form) => <ChangePasswordFields form={form} />}
      </FormDialog>
    </>
  );
}
