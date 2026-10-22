import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { type AgentTokenInfo, type CreatedAgentToken, createAgentTokenSchema } from "@regie/shared";
import { createZodDto } from "nestjs-zod";
import type { AuthContext } from "../auth/auth.types";
import { CurrentAuth } from "../auth/decorators/current-auth.decorator";
import { AgentTokensService } from "./agent-tokens.service";

/** Corps de `POST /agent-tokens`. */
class CreateAgentTokenDto extends createZodDto(createAgentTokenSchema) {}

/**
 * Gestion des jetons d'agent par leur propriétaire. Routes réservées aux sessions
 * navigateur (guard global) : un agent ne peut pas créer ni révoquer de jeton.
 */
@ApiTags("Jetons d'agent")
@Controller("agent-tokens")
export class AgentTokensController {
  constructor(private readonly agentTokens: AgentTokensService) {}

  @Get()
  list(@CurrentAuth() auth: AuthContext): Promise<AgentTokenInfo[]> {
    return this.agentTokens.list(auth);
  }

  /** Crée un jeton ; sa valeur n'est renvoyée qu'ici, une seule fois. */
  @Post()
  create(
    @CurrentAuth() auth: AuthContext,
    @Body() body: CreateAgentTokenDto,
  ): Promise<CreatedAgentToken> {
    return this.agentTokens.create(auth, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentAuth() auth: AuthContext,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.agentTokens.revoke(auth, id);
  }
}
