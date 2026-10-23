import { z } from "../zod";
import { emailSchema } from "./auth.schemas";
import { passwordSchema } from "./password";

// Parcours « mot de passe oublié », réinitialisation et changement (CLAUDE.md §12.3).

/** Message quand la confirmation ne correspond pas au mot de passe saisi. */
const PASSWORD_MISMATCH = "Les deux mots de passe ne correspondent pas.";

export const forgotPasswordSchema = z.object({ email: emailSchema });

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/** Nouveau mot de passe choisi depuis le lien reçu par email. */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, { error: "Lien de réinitialisation invalide." }),
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((input) => input.password === input.passwordConfirm, {
    error: PASSWORD_MISMATCH,
    path: ["passwordConfirm"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Changement de mot de passe par l'utilisateur connecté. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "Saisissez votre mot de passe actuel." }),
    newPassword: passwordSchema,
    newPasswordConfirm: z.string(),
  })
  .refine((input) => input.newPassword === input.newPasswordConfirm, {
    error: PASSWORD_MISMATCH,
    path: ["newPasswordConfirm"],
  })
  .refine((input) => input.newPassword !== input.currentPassword, {
    error: "Le nouveau mot de passe doit être différent de l'actuel.",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
