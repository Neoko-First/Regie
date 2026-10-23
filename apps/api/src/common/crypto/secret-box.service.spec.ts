import { randomBytes } from "node:crypto";
import type { AppConfigService } from "../../config/app-config.service";
import { SecretBoxService } from "./secret-box.service";

/** Service configuré avec une clé aléatoire. */
function makeBox(key = randomBytes(32).toString("base64")): SecretBoxService {
  return new SecretBoxService({ get: () => key } as unknown as AppConfigService);
}

describe("SecretBoxService", () => {
  it("chiffre puis déchiffre un secret", () => {
    const box = makeBox();
    const encrypted = box.encrypt("cle-mailjet-secrete");
    expect(encrypted).not.toContain("cle-mailjet-secrete");
    expect(box.decrypt(encrypted)).toBe("cle-mailjet-secrete");
  });

  it("produit un chiffré différent à chaque appel (vecteur aléatoire)", () => {
    const box = makeBox();
    expect(box.encrypt("x")).not.toBe(box.encrypt("x"));
  });

  it("refuse de déchiffrer avec une autre clé", () => {
    const encrypted = makeBox().encrypt("secret");
    expect(() => makeBox().decrypt(encrypted)).toThrow();
  });

  it("détecte une altération des données", () => {
    const box = makeBox();
    const [version, iv, tag, data] = box.encrypt("secret").split(":");
    const tampered = Buffer.from(data!, "base64");
    tampered[0] = tampered[0]! ^ 1;
    expect(() => box.decrypt([version, iv, tag, tampered.toString("base64")].join(":"))).toThrow();
  });
});
