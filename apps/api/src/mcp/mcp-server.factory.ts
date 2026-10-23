import { HttpException, Injectable } from "@nestjs/common";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  APP_NAME,
  CHANGE_NATURES,
  CHANGE_PRIORITIES,
  CHANGE_STATUSES,
  changeFiltersSchema,
  createChangeSchema,
  createCommentSchema,
  TRANSITIONS,
  TRANSITION_IDS,
  updateChangeSchema,
  z,
} from "@regie/shared";
import type { AuthContext } from "../auth/auth.types";
import { ChangeHistoryService } from "../changes/change-history.service";
import { ChangeWorkflowService } from "../changes/change-workflow.service";
import { ChangesService } from "../changes/changes.service";
import { SpacesService } from "../spaces/spaces.service";

/** Version annoncée par le serveur MCP. */
const MCP_SERVER_VERSION = "0.1.0";

/** Consignes lues par l'agent à la connexion : la méthode, et ce qu'il ne peut pas faire. */
const SERVER_INSTRUCTIONS = `Régie centralise les évolutions des produits Xotis, de la spec à la recette.
Cycle : Brouillon → En revue → [Gate 1 PO] → Conception → [Gate 2 Lead tech] → En développement → En recette → [Gate 3 Recetteur] → Recetté → Livré → Archivé.
Tu agis pour le compte de la personne qui t'a donné ton jeton, avec ses droits.
Tu peux proposer et rédiger des évolutions (proposal, plan, tasks), commenter et les faire avancer, mais tu ne peux JAMAIS valider un gate : c'est une décision humaine.
Commence par get_change_context avant de modifier une évolution existante. Les identifiants sont de la forme SOC-12.`;

/** Transitions sans gate, seules utilisables par un agent (D-009). */
const AGENT_TRANSITIONS = TRANSITIONS.filter((transition) => !transition.gate)
  .map((transition) => `${transition.id} (${transition.from} → ${transition.to})`)
  .join(", ");

/** Résultat d'outil contenant des données JSON. */
function ok(data: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

/**
 * Convertit une erreur en résultat d'outil lisible par l'agent (au lieu d'une erreur de
 * protocole) : il peut ainsi comprendre un refus (droits, gate humain…) et s'adapter.
 */
function toToolError(error: unknown): CallToolResult {
  let message = "Erreur interne : réessayez plus tard.";
  if (error instanceof z.ZodError) {
    message = `Données invalides : ${error.issues
      .map((issue) => `${issue.path.join(".") || "entrée"} : ${issue.message}`)
      .join(" ; ")}`;
  } else if (error instanceof HttpException) {
    message = error.message;
  }
  return { isError: true, content: [{ type: "text", text: message }] };
}

/**
 * Crée, pour chaque requête, un serveur MCP lié à l'agent authentifié.
 * Les outils sont « métier » (D-019) et appellent les mêmes services que l'interface :
 * contrôles de droits, workflow et traçabilité sont strictement identiques (D-020).
 */
@Injectable()
export class McpServerFactory {
  constructor(
    private readonly spaces: SpacesService,
    private readonly changes: ChangesService,
    private readonly workflow: ChangeWorkflowService,
    private readonly history: ChangeHistoryService,
  ) {}

  /**
   * @param auth - Contexte de l'agent (droits de l'humain qui a délégué, `isAgent: true`)
   * @returns Un serveur MCP prêt à être connecté à un transport
   */
  create(auth: AuthContext): McpServer {
    const server = new McpServer(
      {
        name: APP_NAME.toLowerCase()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, ""),
        version: MCP_SERVER_VERSION,
      },
      { instructions: SERVER_INSTRUCTIONS },
    );

    /** Enregistre un outil dont les erreurs sont renvoyées lisiblement à l'agent. */
    const run = async (action: () => Promise<unknown>): Promise<CallToolResult> => {
      try {
        return ok(await action());
      } catch (error) {
        return toToolError(error);
      }
    };

    server.registerTool(
      "list_spaces",
      {
        title: "Lister les espaces",
        description: "Espaces (Socle, Paie…) accessibles, avec tes rôles dans chacun.",
        annotations: { readOnlyHint: true },
      },
      () => run(() => this.spaces.listForUser(auth.userId)),
    );

    server.registerTool(
      "list_changes",
      {
        title: "Lister les évolutions",
        description:
          "Évolutions visibles, filtrables par espace et statut (archivées exclues par défaut).",
        inputSchema: {
          space: z.string().optional().describe("Clé d'espace, ex. SOC"),
          status: z.enum(CHANGE_STATUSES).optional(),
          assignedToMe: z.boolean().optional().describe("Uniquement celles assignées à ton humain"),
        },
        annotations: { readOnlyHint: true },
      },
      ({ space, status, assignedToMe }) =>
        run(() =>
          this.changes.list(
            auth,
            changeFiltersSchema.parse({ space, status, assignee: assignedToMe ? "me" : undefined }),
          ),
        ),
    );

    server.registerTool(
      "get_change_context",
      {
        title: "Contexte complet d'une évolution",
        description:
          "En un appel : contenu (proposal, plan, tasks), statut, actions possibles et motifs de refus, révisions validées, discussion.",
        inputSchema: { key: z.string().describe("Identifiant, ex. SOC-12") },
        annotations: { readOnlyHint: true },
      },
      ({ key }) =>
        run(async () => {
          const [change, comments, revisions] = await Promise.all([
            this.changes.get(auth, key),
            this.history.listComments(auth, key),
            this.history.listRevisions(auth, key),
          ]);
          return { change, comments, revisions };
        }),
    );

    server.registerTool(
      "propose_change",
      {
        title: "Proposer une évolution",
        description:
          "Crée une évolution en brouillon. La proposal décrit le pourquoi et le quoi (markdown). L'auteur est l'humain qui t'a délégué ses droits.",
        inputSchema: {
          spaceKey: z.string().describe("Clé d'espace, ex. SOC"),
          title: z.string(),
          nature: z.enum(CHANGE_NATURES).optional().describe("Par défaut EVOLUTION"),
          priority: z.enum(CHANGE_PRIORITIES).optional().describe("Par défaut MEDIUM"),
          proposal: z
            .string()
            .optional()
            .describe("Markdown : pourquoi, quoi, critères d'acceptation"),
        },
      },
      (input) => run(() => this.changes.create(auth, createChangeSchema.parse(input))),
    );

    server.registerTool(
      "update_change",
      {
        title: "Modifier une évolution",
        description:
          "Met à jour les champs fournis (titre, nature, priorité, proposal, plan, tasks). Impossible une fois livrée.",
        inputSchema: {
          key: z.string(),
          title: z.string().optional(),
          nature: z.enum(CHANGE_NATURES).optional(),
          priority: z.enum(CHANGE_PRIORITIES).optional(),
          proposal: z.string().optional().describe("Markdown"),
          plan: z.string().optional().describe("Markdown : le comment technique"),
          tasks: z.string().optional().describe("Markdown : étapes exécutables"),
        },
      },
      ({ key, ...fields }) =>
        run(() => this.changes.update(auth, key, updateChangeSchema.parse(fields))),
    );

    server.registerTool(
      "comment_change",
      {
        title: "Commenter une évolution",
        description: "Ajoute un commentaire (markdown) à la discussion.",
        inputSchema: { key: z.string(), body: z.string() },
      },
      ({ key, body }) =>
        run(() => this.history.addComment(auth, key, createCommentSchema.parse({ body }))),
    );

    server.registerTool(
      "move_change",
      {
        title: "Faire avancer une évolution",
        description: `Applique une transition du workflow. Autorisées pour un agent : ${AGENT_TRANSITIONS}. Les validations de gate sont refusées (validation humaine obligatoire).`,
        inputSchema: {
          key: z.string(),
          transition: z.enum(TRANSITION_IDS),
          comment: z.string().optional(),
        },
      },
      ({ key, transition, comment }) =>
        run(async () => {
          // Le statut courant sert de garde-fou contre une action périmée (409 sinon)
          const { status } = await this.changes.get(auth, key);
          return this.workflow.transition(auth, key, { transition, fromStatus: status, comment });
        }),
    );

    server.registerTool(
      "request_review",
      {
        title: "Soumettre en revue",
        description: "Soumet un brouillon en revue : le PO pourra valider le Gate 1.",
        inputSchema: { key: z.string() },
      },
      ({ key }) =>
        run(() =>
          this.workflow.transition(auth, key, {
            transition: "submit_for_review",
            fromStatus: "DRAFT",
          }),
        ),
    );

    return server;
  }
}
