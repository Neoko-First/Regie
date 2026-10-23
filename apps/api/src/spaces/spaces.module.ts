import { Module } from "@nestjs/common";
import { SpaceAccessService } from "./space-access.service";
import { SpacesController } from "./spaces.controller";
import { SpacesService } from "./spaces.service";

/** Espaces et membres. Services exportés pour les autres domaines (évolutions, MCP). */
@Module({
  controllers: [SpacesController],
  providers: [SpacesService, SpaceAccessService],
  exports: [SpaceAccessService, SpacesService],
})
export class SpacesModule {}
