import { Module } from "@nestjs/common";
import { AgentTokensModule } from "../agent-tokens/agent-tokens.module";
import { ChangesModule } from "../changes/changes.module";
import { SpacesModule } from "../spaces/spaces.module";
import { McpController } from "./mcp.controller";
import { McpServerFactory } from "./mcp-server.factory";

/** Serveur MCP : les agents IA utilisent les mêmes services, avec les mêmes règles, que l'UI. */
@Module({
  imports: [AgentTokensModule, ChangesModule, SpacesModule],
  controllers: [McpController],
  providers: [McpServerFactory],
})
export class McpModule {}
