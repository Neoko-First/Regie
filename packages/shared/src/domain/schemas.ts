import { z } from "../zod";
import {
  CHANGE_NATURES,
  CHANGE_PRIORITIES,
  CHANGE_STATUSES,
  type ChangeNature,
  type ChangePriority,
  type ChangeStatus,
} from "./change";
import { SPACE_ROLES, type SpaceRole } from "./roles";
import { type Gate, TRANSITION_IDS, type TransitionId } from "./workflow";

// Schémas d'entrée (formulaires + DTO de l'API) et types de réponse du domaine.

/** Longueurs maximales des champs texte. */
const TITLE_MAX = 200;
const NAME_MAX = 100;
const DESCRIPTION_MAX = 1_000;
const MARKDOWN_MAX = 100_000;
const COMMENT_MAX = 10_000;

// ─── Espaces ─────────────────────────────────────────────────────────────────

/** Clé d'espace : 2 à 6 caractères, majuscules et chiffres, commence par une lettre (ex. SOC). */
export const spaceKeySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9]{1,5}$/, {
    error: "La clé doit faire 2 à 6 caractères (lettres et chiffres, commençant par une lettre).",
  });

export const createSpaceSchema = z.object({
  key: spaceKeySchema,
  name: z
    .string()
    .trim()
    .min(2, { error: "Le nom doit faire au moins 2 caractères." })
    .max(NAME_MAX),
  description: z.string().trim().max(DESCRIPTION_MAX).default(""),
});

export type CreateSpaceInput = z.input<typeof createSpaceSchema>;

/** Rôles d'un membre (au moins un ; cumulables, D-063). */
export const memberRolesSchema = z.object({
  roles: z
    .array(z.enum(SPACE_ROLES))
    .min(1, { error: "Choisissez au moins un rôle." })
    .transform((roles) => [...new Set(roles)]),
});

export type MemberRolesInput = z.input<typeof memberRolesSchema>;

// ─── Évolutions ──────────────────────────────────────────────────────────────

const titleSchema = z
  .string()
  .trim()
  .min(3, { error: "Le titre doit faire au moins 3 caractères." })
  .max(TITLE_MAX, { error: `Le titre ne doit pas dépasser ${TITLE_MAX} caractères.` });

const markdownSchema = z.string().max(MARKDOWN_MAX, { error: "Le texte est trop long." });

export const createChangeSchema = z.object({
  spaceKey: spaceKeySchema,
  title: titleSchema,
  nature: z.enum(CHANGE_NATURES).default("EVOLUTION"),
  priority: z.enum(CHANGE_PRIORITIES).default("MEDIUM"),
  /** Proposal : le pourquoi et le quoi (markdown) */
  proposal: markdownSchema.default(""),
});

export type CreateChangeInput = z.input<typeof createChangeSchema>;

/** Modification partielle (PATCH) : seuls les champs envoyés sont modifiés. */
export const updateChangeSchema = z
  .object({
    title: titleSchema,
    nature: z.enum(CHANGE_NATURES),
    priority: z.enum(CHANGE_PRIORITIES),
    proposal: markdownSchema,
    plan: markdownSchema,
    tasks: markdownSchema,
    assigneeId: z.uuid().nullable(),
  })
  .partial()
  .refine((input) => Object.keys(input).length > 0, { error: "Aucune modification envoyée." });

export type UpdateChangeInput = z.input<typeof updateChangeSchema>;

/**
 * Demande de transition. `fromStatus` est le statut affiché à l'utilisateur au moment du clic :
 * si l'évolution a changé entre-temps, l'API refuse (409) au lieu d'appliquer une action périmée.
 */
export const transitionRequestSchema = z.object({
  transition: z.enum(TRANSITION_IDS),
  fromStatus: z.enum(CHANGE_STATUSES),
  comment: z.string().trim().max(COMMENT_MAX).optional(),
});

export type TransitionRequest = z.input<typeof transitionRequestSchema>;

export const createCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, { error: "Le commentaire est vide." })
    .max(COMMENT_MAX, { error: "Le commentaire est trop long." }),
});

export type CreateCommentInput = z.input<typeof createCommentSchema>;

/** Filtres de la liste des évolutions (query string). */
export const changeFiltersSchema = z.object({
  space: spaceKeySchema.optional(),
  status: z.enum(CHANGE_STATUSES).optional(),
  /** « me » pour les évolutions qui me sont assignées */
  assignee: z.union([z.literal("me"), z.uuid()]).optional(),
});

export type ChangeFilters = z.infer<typeof changeFiltersSchema>;

// ─── Réponses de l'API ───────────────────────────────────────────────────────

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export interface SpaceSummary {
  id: string;
  key: string;
  name: string;
  description: string;
  /** Rôles de l'utilisateur courant dans l'espace */
  myRoles: SpaceRole[];
}

export interface SpaceMember {
  user: UserSummary;
  roles: SpaceRole[];
}

export interface ChangeSummary {
  id: string;
  /** Identifiant lisible, ex. « SOC-12 » */
  key: string;
  spaceKey: string;
  title: string;
  status: ChangeStatus;
  nature: ChangeNature;
  priority: ChangePriority;
  /** Numéro de la dernière révision figée (0 tant qu'aucun gate n'est passé) */
  revision: number;
  author: UserSummary;
  assignee: UserSummary | null;
  updatedAt: string;
}

/** Action proposée à l'utilisateur sur une évolution, avec le motif si elle est refusée. */
export interface AvailableTransition {
  id: TransitionId;
  label: string;
  to: ChangeStatus;
  gate: Gate | null;
  backward: boolean;
  allowed: boolean;
  reason: string | null;
}

export interface ChangeDetail extends ChangeSummary {
  proposal: string;
  plan: string;
  tasks: string;
  createdAt: string;
  myRoles: SpaceRole[];
  transitions: AvailableTransition[];
}

export const ACTIVITY_TYPES = [
  "CREATED",
  "UPDATED",
  "STATUS_CHANGED",
  "GATE_APPROVED",
  "COMMENTED",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface ActivityItem {
  id: string;
  type: ActivityType;
  actor: UserSummary;
  /** Détails : champs modifiés, statuts avant / après, gate et révision… */
  data: Record<string, unknown>;
  createdAt: string;
}

export interface CommentItem {
  id: string;
  author: UserSummary;
  body: string;
  createdAt: string;
}

export interface RevisionItem {
  number: number;
  gate: Gate;
  approvedBy: UserSummary;
  comment: string | null;
  createdAt: string;
}
