import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AgentTokenGuard } from "./agent-token.guard";
import { AgentTokensController } from "./agent-tokens.controller";
import { AgentTokensService } from "./agent-tokens.service";

/** Jetons de délégation des agents IA. Le guard est exporté pour le serveur MCP. */
@Module({
  imports: [AuthModule],
  controllers: [AgentTokensController],
  providers: [AgentTokensService, AgentTokenGuard],
  exports: [AgentTokensService, AgentTokenGuard],
})
export class AgentTokensModule {}
