import { Injectable } from "@nestjs/common";
import { type Env, validateEnv } from "./env.schema";

/**
 * Accès typé à la configuration de l'API. Les variables sont validées une seule fois,
 * à la construction du service (donc au démarrage de l'application).
 */
@Injectable()
export class AppConfigService {
  private readonly env: Env = validateEnv();

  /**
   * Renvoie la valeur d'une variable d'environnement validée.
   *
   * @param key - Nom de la variable
   * @returns Sa valeur typée
   * @example config.get("PORT") // 4000
   */
  get<TKey extends keyof Env>(key: TKey): Env[TKey] {
    return this.env[key];
  }

  /** Vrai en production : désactive Swagger, durcit les logs d'erreur. */
  get isProduction(): boolean {
    return this.env.NODE_ENV === "production";
  }
}
