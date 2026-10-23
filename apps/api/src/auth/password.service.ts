import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";

/**
 * Paramètres argon2id (recommandations OWASP : 19 Mio, 2 itérations, 1 fil au minimum).
 * On prend un peu plus de marge mémoire ; ajuster si la connexion devient lente en production.
 */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 64 * 1024, // en Kio : 64 Mio
  timeCost: 3,
  parallelism: 1,
} as const;

/**
 * Hachage et vérification des mots de passe (argon2id). Un hash est irréversible :
 * le mot de passe n'est jamais stocké, journalisé ni renvoyé.
 */
@Injectable()
export class PasswordService {
  /**
   * Hash factice calculé une fois, vérifié quand l'utilisateur n'existe pas :
   * la réponse prend alors le même temps, ce qui empêche de deviner les comptes existants.
   */
  private readonly dummyHash = argon2.hash("regie-dummy-password", ARGON2_OPTIONS);

  /**
   * Hache un mot de passe.
   *
   * @param password - Mot de passe en clair
   * @returns Le hash argon2id (inclut sel et paramètres)
   */
  hash(password: string): Promise<string> {
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  /**
   * Vérifie un mot de passe. Sans hash (utilisateur inconnu), vérifie contre un hash
   * factice pour garder un temps de réponse constant.
   *
   * @param hash - Hash stocké, ou `null` si l'utilisateur n'existe pas
   * @param password - Mot de passe saisi
   * @returns `true` si le mot de passe correspond
   */
  async verify(hash: string | null, password: string): Promise<boolean> {
    try {
      const valid = await argon2.verify(hash ?? (await this.dummyHash), password);
      return hash !== null && valid;
    } catch {
      // Hash corrompu ou illisible : on refuse sans détail
      return false;
    }
  }

  /**
   * Indique si un hash a été produit avec d'anciens paramètres et doit être recalculé
   * (au moment d'une connexion réussie, quand on dispose du mot de passe en clair).
   *
   * @param hash - Hash stocké
   * @returns `true` si le hash doit être régénéré
   */
  needsRehash(hash: string): boolean {
    return argon2.needsRehash(hash, ARGON2_OPTIONS);
  }
}
