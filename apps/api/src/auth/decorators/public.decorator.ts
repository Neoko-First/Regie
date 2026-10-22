import { SetMetadata } from "@nestjs/common";

/** Clé de métadonnée lue par `AccessTokenGuard`. */
export const IS_PUBLIC_KEY = "isPublic";

/**
 * Marque une route (ou un contrôleur) comme accessible sans être connecté.
 * Par défaut, TOUTES les routes exigent une session : il faut l'opt-out explicite.
 *
 * @example @Public() @Post("login") login() {}
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
