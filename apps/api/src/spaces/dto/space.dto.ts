import { createSpaceSchema, memberRolesSchema } from "@regie/shared";
import { createZodDto } from "nestjs-zod";

/** Corps de `POST /spaces`. */
export class CreateSpaceDto extends createZodDto(createSpaceSchema) {}

/** Corps de `PUT /spaces/:key/members/:userId`. */
export class MemberRolesDto extends createZodDto(memberRolesSchema) {}
