import type { NestExpressApplication } from "@nestjs/platform-express";
import type { ActivityItem, ChangeDetail, CreatedAgentToken } from "@regie/shared";
import request from "supertest";
import {
  createLoggedInUser,
  createTestApp,
  createTestSpace,
  deleteTestUsers,
} from "./utils/test-app";

type LoggedIn = Awaited<ReturnType<typeof createLoggedInUser>>;

/** Résultat d'un appel d'outil MCP. */
interface ToolResult {
  isError?: boolean;
  content: Array<{ type: string; text: string }>;
}

describe("Serveur MCP (e2e)", () => {
  let app: NestExpressApplication;
  let dev: LoggedIn;
  let po: LoggedIn;
  let spaceKey: string;
  let poToken: string;
  let requestId = 0;

  /** Envoie une requête JSON-RPC au serveur MCP, comme un client Claude Code. */
  function mcp(token: string | null, method: string, params: object = {}) {
    const req = request(app.getHttpServer())
      .post("/api/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Content-Type", "application/json");
    if (token) req.set("Authorization", `Bearer ${token}`);
    return req.send({ jsonrpc: "2.0", id: ++requestId, method, params });
  }

  /** Appelle un outil et renvoie son résultat. */
  async function callTool(token: string, name: string, args: object): Promise<ToolResult> {
    const res = await mcp(token, "tools/call", { name, arguments: args });
    expect(res.status).toBe(200);
    return res.body.result as ToolResult;
  }

  /** Parse le JSON renvoyé par un outil en succès. */
  function data<T>(result: ToolResult): T {
    expect(result.isError).toBeFalsy();
    return JSON.parse(result.content[0]!.text) as T;
  }

  beforeAll(async () => {
    app = await createTestApp();
    [dev, po] = await Promise.all([createLoggedInUser(app), createLoggedInUser(app)]);
    const space = await createTestSpace(app, [
      { userId: dev.user.id, roles: ["DEV"] },
      { userId: po.user.id, roles: ["PO"] },
    ]);
    spaceKey = space.key;
    const created = await po.client.post("/agent-tokens", { name: "Helix", expiresInDays: 30 });
    expect(created.status).toBe(201);
    poToken = (created.body as CreatedAgentToken).token;
  });

  afterAll(async () => {
    await deleteTestUsers(app);
    await app.close();
  });

  describe("jetons d'agent", () => {
    it("ne renvoie la valeur du jeton qu'à la création", async () => {
      expect(poToken).toMatch(/^regie_pat_/);
      const list = await po.client.get("/agent-tokens");
      expect(list.body).toHaveLength(1);
      expect(JSON.stringify(list.body)).not.toContain(poToken);
      expect(list.body[0].prefix).toBe(poToken.slice(0, 14));
    });

    it("refuse le MCP sans jeton ou avec un jeton invalide", async () => {
      expect((await mcp(null, "tools/list")).status).toBe(401);
      expect((await mcp("regie_pat_inventé", "tools/list")).status).toBe(401);
    });

    it("n'ouvre pas l'API REST à un jeton d'agent (sessions navigateur uniquement)", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/changes")
        .set("Authorization", `Bearer ${poToken}`);
      expect(res.status).toBe(401);
    });

    it("rejette un jeton révoqué", async () => {
      const created = await dev.client.post("/agent-tokens", {
        name: "Jetable",
        expiresInDays: null,
      });
      const { token, info } = created.body as CreatedAgentToken;
      expect((await mcp(token, "tools/list")).status).toBe(200);
      expect((await dev.client.delete(`/agent-tokens/${info.id}`)).status).toBe(204);
      expect((await mcp(token, "tools/list")).status).toBe(401);
    });
  });

  describe("outils", () => {
    it("expose les outils métier", async () => {
      const res = await mcp(poToken, "tools/list");
      const names = res.body.result.tools.map((tool: { name: string }) => tool.name);
      expect(names).toEqual(
        expect.arrayContaining([
          "list_spaces",
          "list_changes",
          "get_change_context",
          "propose_change",
          "update_change",
          "comment_change",
          "move_change",
          "request_review",
        ]),
      );
    });

    it("crée une évolution par délégation et trace l'agent dans l'historique", async () => {
      const change = data<ChangeDetail>(
        await callTool(poToken, "propose_change", {
          spaceKey,
          title: "Proposée par un agent",
          proposal: "## Pourquoi\n\nDémonstration.",
        }),
      );
      expect(change.status).toBe("DRAFT");
      expect(change.author.id).toBe(po.user.id);

      const review = data<ChangeDetail>(
        await callTool(poToken, "request_review", { key: change.key }),
      );
      expect(review.status).toBe("IN_REVIEW");

      const activity = (await po.client.get(`/changes/${change.key}/activity`))
        .body as ActivityItem[];
      expect(activity.every((item) => item.data.agent === "Helix")).toBe(true);
    });

    it("refuse à un agent de valider un gate, même avec le rôle de son humain", async () => {
      // Évolution écrite par le dev : le PO pourrait la valider lui-même, pas son agent
      const created = await dev.client.post("/changes", { spaceKey, title: "Écrite par le dev" });
      const key = (created.body as ChangeDetail).key;
      await dev.client.post(`/changes/${key}/transitions`, {
        transition: "submit_for_review",
        fromStatus: "DRAFT",
      });

      const result = await callTool(poToken, "move_change", {
        key,
        transition: "approve_functional",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0]!.text).toBe(
        "Un agent ne peut pas valider un gate : validation humaine requise.",
      );

      // L'humain, lui, peut valider depuis l'interface
      const human = await po.client.post(`/changes/${key}/transitions`, {
        transition: "approve_functional",
        fromStatus: "IN_REVIEW",
      });
      expect(human.status).toBe(200);
    });

    it("renvoie le contexte complet en un appel", async () => {
      const { key } = data<ChangeDetail>(
        await callTool(poToken, "propose_change", { spaceKey, title: "Contexte complet" }),
      );
      await callTool(poToken, "comment_change", { key, body: "Premier jet." });
      const context = data<{ change: ChangeDetail; comments: unknown[]; revisions: unknown[] }>(
        await callTool(poToken, "get_change_context", { key }),
      );
      expect(context.change.key).toBe(key);
      expect(context.comments).toHaveLength(1);
      expect(context.change.transitions.length).toBeGreaterThan(0);
    });

    it("signale lisiblement des données invalides", async () => {
      const result = await callTool(poToken, "propose_change", { spaceKey, title: "x" });
      expect(result.isError).toBe(true);
      expect(result.content[0]!.text).toMatch(/titre/i);
    });
  });
});
