import { Global, Module } from "@nestjs/common";
import { AppConfigService } from "./app-config.service";

/** Module global de configuration : `AppConfigService` est injectable partout. */
@Global()
@Module({
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
