"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type LoginInput, loginSchema } from "@regie/shared";
import { Loader2, LogIn } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { PasswordField, TextField } from "@/components/ui-extended/form-fields";
import { useLogin } from "../hooks/use-login";
import { NEXT_PARAM } from "../lib/safe-redirect";

/** Valeurs initiales du formulaire (jamais `undefined`, cf. CLAUDE.md §9). */
const EMPTY_LOGIN: LoginInput = { email: "", password: "" };

/**
 * Formulaire de connexion. Validé par le schéma partagé avec l'API ;
 * le bouton reste grisé tant que rien n'est saisi ou qu'une connexion est en cours.
 */
export function LoginForm() {
  const searchParams = useSearchParams();
  const login = useLogin(searchParams.get(NEXT_PARAM));
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: EMPTY_LOGIN,
  });
  const { isDirty, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
    } catch {
      // Message déjà affiché par le toast global ; on vide le mot de passe pour une nouvelle saisie
      form.resetField("password");
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <TextField
          control={form.control}
          name="email"
          label="Adresse email"
          type="email"
          autoComplete="username"
          autoFocus
        />
        <PasswordField
          control={form.control}
          name="password"
          label="Mot de passe"
          autoComplete="current-password"
        />
      </FieldGroup>
      <Button type="submit" disabled={!isDirty || isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : <LogIn />} Se connecter
      </Button>
    </form>
  );
}
