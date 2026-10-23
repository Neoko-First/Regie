import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes } from "node:crypto";
import { ACCESS_TOKEN_TTL_MS, OPAQUE_TOKEN_BYTES } from "./auth.constants";
import type { AccessTokenPayload } from "./auth.types";

/** Seul algorithme accepté à la vérification (empêche les attaques par changement d'algorithme). */
const JWT_ALGORITHM = "HS256";

const MS_PER_SECOND = 1000;

/**
 * Émission et vérification des jetons :
 * - access token : JWT signé, courte durée ;
 * - jetons opaques (refresh token, jeton d'agent) : chaînes aléatoires dont seul le hash
 *   SHA-256 est stocké en base.
 */
@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  /**
   * Signe un access token.
   *
   * @param payload - Utilisateur et session
   * @returns Le JWT signé
   */
  signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      algorithm: JWT_ALGORITHM,
      expiresIn: ACCESS_TOKEN_TTL_MS / MS_PER_SECOND,
    });
  }

  /**
   * Vérifie un access token (signature, algorithme, expiration).
   *
   * @param token - JWT reçu dans le cookie
   * @returns Le contenu du token, ou `null` s'il est invalide ou expiré
   */
  async verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        algorithms: [JWT_ALGORITHM],
      });
      return typeof payload.sub === "string" && typeof payload.sid === "string" ? payload : null;
    } catch {
      return null;
    }
  }

  /**
   * Génère un jeton opaque aléatoire (256 bits) et son hash : refresh token ou jeton d'agent.
   *
   * @param prefix - Préfixe lisible ajouté au jeton (ex. « regie_pat_ »)
   * @returns Le jeton en clair (à transmettre une seule fois) et son hash (pour la base)
   */
  generateOpaqueToken(prefix = ""): { token: string; hash: string } {
    const token = `${prefix}${randomBytes(OPAQUE_TOKEN_BYTES).toString("base64url")}`;
    return { token, hash: this.hashOpaqueToken(token) };
  }

  /**
   * Hache un jeton opaque. SHA-256 suffit ici : le jeton est aléatoire et long (256 bits),
   * contrairement à un mot de passe qui demande un hachage lent.
   *
   * @param token - Jeton en clair
   * @returns Son empreinte hexadécimale
   */
  hashOpaqueToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
