import { All, Controller, HttpStatus, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Request, Response } from "express";
import { AgentTokenGuard } from "../agent-tokens/agent-token.guard";
import { Public } from "../auth/decorators/public.decorator";
import { sessionExpired } from "../auth/auth.service";
import { McpServerFactory } from "./mcp-server.factory";

/**
 * Serveur MCP de Régie (D-004, D-081), transport HTTP « streamable » en mode sans état :
 * chaque requête crée son serveur, lié à l'agent authentifié par son jeton.
 * `@Public()` désactive le guard des sessions navigateur ; c'est `AgentTokenGuard` qui protège.
 */
@ApiExcludeController()
@Public()
@UseGuards(AgentTokenGuard)
@Controller("mcp")
export class McpController {
  constructor(private readonly factory: McpServerFactory) {}

  @Post()
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    if (!req.authContext) throw sessionExpired();
    const server = this.factory.create(req.authContext);
    // Réponses JSON (pas de flux SSE) : plus simple à relayer par le proxy BFF
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }

  /** Sans état : pas de flux serveur (GET) ni de fin de session (DELETE). */
  @All()
  methodNotAllowed(@Res() res: Response): void {
    res.status(HttpStatus.METHOD_NOT_ALLOWED).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Méthode non autorisée : utilisez POST." },
      id: null,
    });
  }
}
