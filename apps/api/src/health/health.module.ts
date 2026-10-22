import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";

/** Module de supervision (point de santé). */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
