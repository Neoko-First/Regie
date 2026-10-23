import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AppConfigService } from "../config/app-config.service";
import { AuthCookiesService } from "./auth-cookies.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AccessTokenGuard } from "./guards/access-token.guard";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";

/**
 * Authentification maison (D-079) : connexion, jetons, sessions.
 * `AccessTokenGuard` est exporté pour être enregistré comme guard global dans `AppModule`.
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({ secret: config.get("JWT_ACCESS_SECRET") }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthCookiesService, PasswordService, TokenService, AccessTokenGuard],
  exports: [AuthService, PasswordService, TokenService, AccessTokenGuard],
})
export class AuthModule {}
