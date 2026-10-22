import { loginSchema } from "@regie/shared";
import { createZodDto } from "nestjs-zod";

/** Corps de `POST /auth/login`, validé par le schéma partagé avec le formulaire du front. */
export class LoginDto extends createZodDto(loginSchema) {}
