import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";
import { SpacesModule } from "../spaces/spaces.module";
import { InvitationsController } from "./invitations.controller";
import { InvitationsService } from "./invitations.service";
import { SpaceInvitationsController } from "./space-invitations.controller";

/** Ajout de membres par email et invitations (D-091). */
@Module({
  imports: [AuthModule, MailModule, SpacesModule],
  controllers: [SpaceInvitationsController, InvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
