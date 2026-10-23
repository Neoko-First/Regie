import { acceptInvitationSchema, addMemberSchema } from "@regie/shared";
import { createZodDto } from "nestjs-zod";

/** Corps de `POST /spaces/:key/members` (ajout par email). */
export class AddMemberDto extends createZodDto(addMemberSchema) {}

/** Corps de `POST /invitations/accept`. */
export class AcceptInvitationDto extends createZodDto(acceptInvitationSchema) {}
