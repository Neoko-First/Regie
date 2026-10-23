import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { AuthUser, InvitationPreview } from "@regie/shared";
import type { Request, Response } from "express";
import { AUTH_THROTTLE } from "../auth/auth.constants";
import { AuthCookiesService } from "../auth/auth-cookies.service";
import { clientContext } from "../auth/client-context";
import { Public } from "../auth/decorators/public.decorator";
import { AcceptInvitationDto } from "./dto/invitation.dto";
import { InvitationsService } from "./invitations.service";

/**
 * Routes publiques du lien d'invitation : aperçu, puis acceptation qui crée le compte
 * et connecte l'invité (les jetons ne transitent que par des cookies httpOnly).
 */
@ApiTags("Invitations")
@Controller("invitations")
export class InvitationsController {
  constructor(
    private readonly invitations: InvitationsService,
    private readonly cookies: AuthCookiesService,
  ) {}

  /** Aperçu d'une invitation (adresse, espace, auteur). */
  @Public()
  @Throttle(AUTH_THROTTLE.invitation)
  @Get(":token")
  @ApiOkResponse({ description: "Invitation utilisable." })
  preview(@Param("token") token: string): Promise<InvitationPreview> {
    return this.invitations.preview(token);
  }

  /** Acceptation : crée le compte, rattache aux espaces et ouvre une session. */
  @Public()
  @Throttle(AUTH_THROTTLE.invitation)
  @Post("accept")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: "Compte créé : cookies de session posés, utilisateur renvoyé." })
  async accept(
    @Body() body: AcceptInvitationDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUser> {
    const { tokens, user } = await this.invitations.accept(body, clientContext(req));
    this.cookies.set(res, tokens);
    return user;
  }
}
