import { Injectable } from "@nestjs/common";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { AppConfigService } from "../../config/app-config.service";

/** Algorithme : AES-256-GCM (chiffrement authentifié : toute altération est détectée). */
const ALGORITHM = "aes-256-gcm";
/** Taille du vecteur d'initialisation recommandée pour GCM. */
const IV_BYTES = 12;
/** Version du format, pour pouvoir changer d'algorithme plus tard sans casser l'existant. */
const FORMAT_VERSION = "v1";

/**
 * Chiffre les secrets à stocker en base (clés Mailjet saisies dans l'administration).
 * La clé de chiffrement reste en variable d'environnement (`SETTINGS_ENCRYPTION_KEY`) :
 * une copie de la base seule ne suffit pas à lire les secrets.
 */
@Injectable()
export class SecretBoxService {
  private readonly key: Buffer;

  constructor(config: AppConfigService) {
    this.key = Buffer.from(config.get("SETTINGS_ENCRYPTION_KEY"), "base64");
  }

  /**
   * Chiffre un secret.
   *
   * @param plaintext - Secret en clair
   * @returns Le secret chiffré, au format `v1:iv:tag:données` (base64)
   */
  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [FORMAT_VERSION, iv, tag, data]
      .map((part) => (typeof part === "string" ? part : part.toString("base64")))
      .join(":");
  }

  /**
   * Déchiffre un secret produit par `encrypt`.
   *
   * @param payload - Secret chiffré
   * @returns Le secret en clair
   * @throws Error si le format est inconnu, la clé différente ou les données altérées
   */
  decrypt(payload: string): string {
    const [version, iv, tag, data] = payload.split(":");
    if (version !== FORMAT_VERSION || !iv || !tag || !data) {
      throw new Error("Secret chiffré illisible (format inconnu).");
    }
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString(
      "utf8",
    );
  }
}
