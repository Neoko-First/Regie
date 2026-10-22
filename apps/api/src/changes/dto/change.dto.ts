import {
  changeFiltersSchema,
  createChangeSchema,
  createCommentSchema,
  transitionRequestSchema,
  updateChangeSchema,
} from "@regie/shared";
import { createZodDto } from "nestjs-zod";

// DTO générés depuis les schémas partagés avec les formulaires du front (CLAUDE.md §1).

/** Corps de `POST /changes`. */
export class CreateChangeDto extends createZodDto(createChangeSchema) {}

/** Corps de `PATCH /changes/:key`. */
export class UpdateChangeDto extends createZodDto(updateChangeSchema) {}

/** Corps de `POST /changes/:key/transitions`. */
export class TransitionRequestDto extends createZodDto(transitionRequestSchema) {}

/** Corps de `POST /changes/:key/comments`. */
export class CreateCommentDto extends createZodDto(createCommentSchema) {}

/** Query string de `GET /changes`. */
export class ChangeFiltersDto extends createZodDto(changeFiltersSchema) {}
