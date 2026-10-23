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
import type { AddMemberResult, InvitationInfo } from "@regie/shared";
import type { AuthContext } from "../auth/auth.types";
import { CurrentAuth } from "../auth/decorators/current-auth.decorator";
import { SpaceKeyPipe } from "../spaces/space-key.pipe";
import { AddMemberDto } from "./dto/invitation.dto";
import { InvitationsService } from "./invitations.service";

/** Ajout de membres par email et invitations d'un espace (admins de l'espace). */
@ApiTags("Espaces")
@Controller("spaces/:key")
export class SpaceInvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  /** Ajoute une personne par son email : rattachée si elle a un compte, invitée sinon. */
  @Post("members")
  addMember(
    @CurrentAuth() auth: AuthContext,
    @Param("key", SpaceKeyPipe) key: string,
    @Body() body: AddMemberDto,
  ): Promise<AddMemberResult> {
    return this.invitations.addMember(auth.userId, key, body);
  }

  /** Invitations en attente. */
  @Get("invitations")
  list(
    @CurrentAuth() auth: AuthContext,
    @Param("key", SpaceKeyPipe) key: string,
  ): Promise<InvitationInfo[]> {
    return this.invitations.list(auth.userId, key);
  }

  /** Renvoie une invitation avec un nouveau lien. */
  @Post("invitations/:id/resend")
  @HttpCode(HttpStatus.OK)
  resend(
    @CurrentAuth() auth: AuthContext,
    @Param("key", SpaceKeyPipe) key: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<InvitationInfo> {
    return this.invitations.resend(auth.userId, key, id);
  }

  /** Révoque une invitation. */
  @Delete("invitations/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentAuth() auth: AuthContext,
    @Param("key", SpaceKeyPipe) key: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.invitations.revoke(auth.userId, key, id);
  }
}
