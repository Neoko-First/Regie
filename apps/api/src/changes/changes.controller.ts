import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type {
  ActivityItem,
  ChangeDetail,
  ChangeSummary,
  CommentItem,
  RevisionItem,
} from "@regie/shared";
import type { AuthContext } from "../auth/auth.types";
import { CurrentAuth } from "../auth/decorators/current-auth.decorator";
import { ChangeHistoryService } from "./change-history.service";
import { ChangeWorkflowService } from "./change-workflow.service";
import { ChangesService } from "./changes.service";
import {
  ChangeFiltersDto,
  CreateChangeDto,
  CreateCommentDto,
  TransitionRequestDto,
  UpdateChangeDto,
} from "./dto/change.dto";

/**
 * Évolutions : liste (board), détail, édition, workflow, commentaires, historique.
 * Les évolutions sont désignées par leur identifiant lisible (`SOC-12`).
 */
@ApiTags("Évolutions")
@Controller("changes")
export class ChangesController {
  constructor(
    private readonly changes: ChangesService,
    private readonly workflow: ChangeWorkflowService,
    private readonly history: ChangeHistoryService,
  ) {}

  /** Évolutions visibles, filtrables par espace, statut et assigné. */
  @Get()
  list(
    @CurrentAuth() auth: AuthContext,
    @Query() filters: ChangeFiltersDto,
  ): Promise<ChangeSummary[]> {
    return this.changes.list(auth, filters);
  }

  /** Création d'une évolution (en brouillon). */
  @Post()
  create(@CurrentAuth() auth: AuthContext, @Body() body: CreateChangeDto): Promise<ChangeDetail> {
    return this.changes.create(auth, body);
  }

  /** Détail d'une évolution, avec les actions possibles pour l'utilisateur. */
  @Get(":key")
  get(@CurrentAuth() auth: AuthContext, @Param("key") key: string): Promise<ChangeDetail> {
    return this.changes.get(auth, key);
  }

  /** Modification partielle du contenu. */
  @Patch(":key")
  update(
    @CurrentAuth() auth: AuthContext,
    @Param("key") key: string,
    @Body() body: UpdateChangeDto,
  ): Promise<ChangeDetail> {
    return this.changes.update(auth, key, body);
  }

  /** Suppression d'un brouillon. */
  @Delete(":key")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentAuth() auth: AuthContext, @Param("key") key: string): Promise<void> {
    await this.changes.remove(auth, key);
  }

  /** Changement de statut selon le workflow (dont les gates humains). */
  @Post(":key/transitions")
  @HttpCode(HttpStatus.OK)
  transition(
    @CurrentAuth() auth: AuthContext,
    @Param("key") key: string,
    @Body() body: TransitionRequestDto,
  ): Promise<ChangeDetail> {
    return this.workflow.transition(auth, key, body);
  }

  /** Commentaires. */
  @Get(":key/comments")
  comments(@CurrentAuth() auth: AuthContext, @Param("key") key: string): Promise<CommentItem[]> {
    return this.history.listComments(auth, key);
  }

  /** Ajout d'un commentaire. */
  @Post(":key/comments")
  addComment(
    @CurrentAuth() auth: AuthContext,
    @Param("key") key: string,
    @Body() body: CreateCommentDto,
  ): Promise<CommentItem> {
    return this.history.addComment(auth, key, body);
  }

  /** Historique d'activité. */
  @Get(":key/activity")
  activity(@CurrentAuth() auth: AuthContext, @Param("key") key: string): Promise<ActivityItem[]> {
    return this.history.listActivity(auth, key);
  }

  /** Révisions figées par les gates. */
  @Get(":key/revisions")
  revisions(@CurrentAuth() auth: AuthContext, @Param("key") key: string): Promise<RevisionItem[]> {
    return this.history.listRevisions(auth, key);
  }
}
