import { Module } from "@nestjs/common";
import { SpaceAccessService } from "./space-access.service";
import { SpacesController } from "./spaces.controller";
import { SpacesService } from "./spaces.service";

/** Espaces et membres. `SpaceAccessService` est exporté pour les autres domaines. */
@Module({
  controllers: [SpacesController],
  providers: [SpacesService, SpaceAccessService],
  exports: [SpaceAccessService],
})
export class SpacesModule {}
