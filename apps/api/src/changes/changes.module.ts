import { Module } from "@nestjs/common";
import { SpacesModule } from "../spaces/spaces.module";
import { ChangeAccessService } from "./change-access.service";
import { ChangeHistoryService } from "./change-history.service";
import { ChangeWorkflowService } from "./change-workflow.service";
import { ChangesController } from "./changes.controller";
import { ChangesService } from "./changes.service";
import { InboxController } from "./inbox.controller";
import { InboxService } from "./inbox.service";

/**
 * Évolutions (« Changes »). `ChangesService` et `ChangeWorkflowService` sont exportés :
 * le serveur MCP (phase 6) les réutilisera, avec les mêmes règles que l'UI.
 */
@Module({
  imports: [SpacesModule],
  controllers: [ChangesController, InboxController],
  providers: [
    ChangesService,
    ChangeWorkflowService,
    ChangeHistoryService,
    ChangeAccessService,
    InboxService,
  ],
  exports: [ChangesService, ChangeWorkflowService],
})
export class ChangesModule {}
