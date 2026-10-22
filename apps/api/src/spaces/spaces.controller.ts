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
  Put,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { SpaceMember, SpaceSummary } from "@regie/shared";
import type { AuthContext } from "../auth/auth.types";
import { CurrentAuth } from "../auth/decorators/current-auth.decorator";
import { SpaceKeyPipe } from "./space-key.pipe";
import { CreateSpaceDto, MemberRolesDto } from "./dto/space.dto";
import { SpacesService } from "./spaces.service";

/** Espaces et membres (droits par espace, D-013). */
@ApiTags("Espaces")
@Controller("spaces")
export class SpacesController {
  constructor(private readonly spaces: SpacesService) {}

  /** Espaces de l'utilisateur connecté. */
  @Get()
  list(@CurrentAuth() auth: AuthContext): Promise<SpaceSummary[]> {
    return this.spaces.listForUser(auth.userId);
  }

  /** Création d'un espace (administrateur de la plateforme). */
  @Post()
  create(@CurrentAuth() auth: AuthContext, @Body() body: CreateSpaceDto): Promise<SpaceSummary> {
    return this.spaces.create(auth.userId, body);
  }

  /** Détail d'un espace. */
  @Get(":key")
  get(
    @CurrentAuth() auth: AuthContext,
    @Param("key", SpaceKeyPipe) key: string,
  ): Promise<SpaceSummary> {
    return this.spaces.get(auth.userId, key);
  }

  /** Membres d'un espace. */
  @Get(":key/members")
  members(
    @CurrentAuth() auth: AuthContext,
    @Param("key", SpaceKeyPipe) key: string,
  ): Promise<SpaceMember[]> {
    return this.spaces.listMembers(auth.userId, key);
  }

  /** Ajoute un membre ou remplace ses rôles (admin de l'espace). */
  @Put(":key/members/:userId")
  setMember(
    @CurrentAuth() auth: AuthContext,
    @Param("key", SpaceKeyPipe) key: string,
    @Param("userId", new ParseUUIDPipe()) memberId: string,
    @Body() body: MemberRolesDto,
  ): Promise<SpaceMember> {
    return this.spaces.setMemberRoles(auth.userId, key, memberId, body);
  }

  /** Retire un membre (admin de l'espace). */
  @Delete(":key/members/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @CurrentAuth() auth: AuthContext,
    @Param("key", SpaceKeyPipe) key: string,
    @Param("userId", new ParseUUIDPipe()) memberId: string,
  ): Promise<void> {
    await this.spaces.removeMember(auth.userId, key, memberId);
  }
}
