import { emailSchema } from "../auth/auth.schemas";
import { passwordSchema } from "../auth/password";
import { PASSWORD_MISMATCH_MESSAGE } from "../auth/password-flows";
import { z } from "../zod";
import type { SpaceRole } from "./roles";
import { memberRolesSchema, type SpaceMember, type UserSummary } from "./schemas";

// Ajout de membres et invitations (D-091) : un admin d'espace ajoute ou invite dans son espace,
// l'administrateur de la plateforme partout. Le compte d'un invité est créé à l'acceptation.

/** Durée de validité d'une invitation, en jours. */
export const INVITATION_TTL_DAYS = 7;

/** Longueur maximale du nom choisi par l'invité. */
const USER_NAME_MAX = 100;

/**
 * Ajout d'un membre par son email : rattaché directement s'il a déjà un compte, invité sinon.
 */
export const addMemberSchema = z.object({
  email: emailSchema,
  roles: memberRolesSchema.shape.roles,
});

export type AddMemberInput = z.input<typeof addMemberSchema>;
export type AddMemberData = z.output<typeof addMemberSchema>;

/** Acceptation d'une invitation : l'invité choisit son nom et son mot de passe. */
export const acceptInvitationSchema = z
  .object({
    token: z.string().min(1, { error: "Lien d'invitation invalide." }),
    name: z
      .string()
      .trim()
      .min(2, { error: "Votre nom doit faire au moins 2 caractères." })
      .max(USER_NAME_MAX),
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((input) => input.password === input.passwordConfirm, {
    error: PASSWORD_MISMATCH_MESSAGE,
    path: ["passwordConfirm"],
  });

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

/** Invitation en attente, vue par les admins de l'espace (jamais le jeton). */
export interface InvitationInfo {
  id: string;
  email: string;
  roles: SpaceRole[];
  invitedBy: UserSummary;
  createdAt: string;
  expiresAt: string;
  /** Lien expiré : il faut renvoyer l'invitation */
  expired: boolean;
}

/** Résultat d'un ajout : membre rattaché tout de suite, ou invitation envoyée. */
export type AddMemberResult =
  { status: "ADDED"; member: SpaceMember } | { status: "INVITED"; invitation: InvitationInfo };

/** Ce que voit l'invité avant d'accepter (page publique du lien). */
export interface InvitationPreview {
  email: string;
  spaceName: string;
  invitedByName: string;
  expiresAt: string;
}
