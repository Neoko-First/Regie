import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@regie/shared";
import { createZodDto } from "nestjs-zod";

/** Corps de `POST /auth/login`, validé par le schéma partagé avec le formulaire du front. */
export class LoginDto extends createZodDto(loginSchema) {}

/** Corps de `POST /auth/forgot-password`. */
export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}

/** Corps de `POST /auth/reset-password`. */
export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}

/** Corps de `POST /auth/change-password`. */
export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
