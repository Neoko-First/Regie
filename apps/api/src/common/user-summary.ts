import type { UserSummary } from "@regie/shared";

/**
 * Sélection Prisma des champs publics d'un utilisateur. À utiliser partout où un utilisateur
 * est renvoyé (auteur, assigné, membre…) : jamais le hash du mot de passe ni les compteurs.
 */
export const USER_SUMMARY_SELECT = { id: true, name: true, email: true } as const;

/**
 * Convertit un utilisateur Prisma (sélection `USER_SUMMARY_SELECT`) en résumé public.
 *
 * @param user - Utilisateur sélectionné
 * @returns Le résumé renvoyé par l'API
 */
export function toUserSummary(user: UserSummary): UserSummary {
  return { id: user.id, name: user.name, email: user.email };
}
