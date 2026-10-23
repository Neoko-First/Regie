import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { AppConfigService } from "../config/app-config.service";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Client Prisma partagé par toute l'API (un seul pool de connexions par processus).
 * Prisma 7 se connecte à PostgreSQL via le driver adapter `pg`.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: AppConfigService) {
    super({ adapter: new PrismaPg({ connectionString: config.get("DATABASE_URL") }) });
  }

  /** Ouvre la connexion au démarrage : une base injoignable est détectée immédiatement. */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /** Ferme proprement le pool à l'arrêt de l'application. */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
