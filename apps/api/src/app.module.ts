import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ZodSerializerInterceptor, ZodValidationPipe } from "nestjs-zod";
import { AuthModule } from "./auth/auth.module";
import { AccessTokenGuard } from "./auth/guards/access-token.guard";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { OriginGuard } from "./common/guards/origin.guard";
import { AppConfigModule } from "./config/app-config.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";

/** Fenêtre du rate limiting global. */
const THROTTLE_TTL_MS = 60_000;
/** Requêtes autorisées par IP et par fenêtre (les routes d'auth ont une limite plus stricte). */
const THROTTLE_LIMIT = 300;

/**
 * Module racine : infrastructure transverse. Chaque domaine métier aura son propre module.
 */
@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    ThrottlerModule.forRoot([{ ttl: THROTTLE_TTL_MS, limit: THROTTLE_LIMIT }]),
    AuthModule,
    HealthModule,
  ],
  providers: [
    // Validation des entrées par les DTO Zod partagés (createZodDto)
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    // Validation / filtrage des réponses déclarées avec @ZodResponse ou @ZodSerializerDto
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    // Format d'erreur uniforme, messages en français
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Guards globaux, exécutés dans cet ordre :
    // 1. rate limiting ; 2. origine des requêtes mutantes (CSRF) ; 3. session obligatoire
    //    (sauf routes @Public()).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: OriginGuard },
    { provide: APP_GUARD, useExisting: AccessTokenGuard },
  ],
})
export class AppModule {}
