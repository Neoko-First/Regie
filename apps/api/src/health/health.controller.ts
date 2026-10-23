import { Controller, Get, HttpStatus } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { ErrorCode } from "@regie/shared";
import { Public } from "../auth/decorators/public.decorator";
import { AppException } from "../common/errors/app.exception";
import { PrismaService } from "../prisma/prisma.service";

/** Réponse du point de santé. */
interface HealthStatus {
  status: "ok";
  database: "up";
}

/**
 * Point de santé, utilisé par la supervision et le déploiement.
 * Route publique (sans session), exclue du rate limiting.
 */
@ApiTags("Santé")
@Public()
@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Vérifie que l'API répond et que la base de données est joignable.
   *
   * @returns `{ status: "ok", database: "up" }`
   * @throws AppException 503 si la base de données ne répond pas
   */
  @Get()
  @ApiOkResponse({ description: "L'API et la base de données sont opérationnelles." })
  async check(): Promise<HealthStatus> {
    try {
      // SQL brut justifié : simple ping de la base, sans modèle Prisma associé
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new AppException(
        HttpStatus.SERVICE_UNAVAILABLE,
        ErrorCode.SERVICE_UNAVAILABLE,
        "La base de données est indisponible.",
      );
    }
    return { status: "ok", database: "up" };
  }
}
