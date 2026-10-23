import { Module } from "@nestjs/common";
import { SecretBoxService } from "../common/crypto/secret-box.service";
import { SpacesModule } from "../spaces/spaces.module";
import { MailAdminController } from "./mail-admin.controller";
import { MailSettingsService } from "./mail-settings.service";
import { MailService } from "./mail.service";

/** Envoi des emails transactionnels et administration de Mailjet. */
@Module({
  imports: [SpacesModule],
  controllers: [MailAdminController],
  providers: [MailService, MailSettingsService, SecretBoxService],
  exports: [MailService],
})
export class MailModule {}
