import { describe, expect, it } from "vitest";
import {
  emailSchema,
  evaluatePassword,
  isPasswordDifferentFromEmail,
  mailSettingsSchema,
  passwordSchema,
  changePasswordSchema,
  resetPasswordSchema,
} from "../index";

describe("politique de mot de passe", () => {
  it("accepte un mot de passe qui respecte tous les critères", () => {
    expect(passwordSchema.safeParse("Clapperboard-2026").success).toBe(true);
  });

  it("refuse un mot de passe trop court avec un message en français", () => {
    const result = passwordSchema.safeParse("Ab1!");
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      "Le mot de passe doit contenir au moins 12 caractères.",
    );
  });

  it("signale chaque critère manquant", () => {
    const result = passwordSchema.safeParse("toutenminuscules");
    expect(result.error?.issues).toHaveLength(3); // majuscule, chiffre, caractère spécial
  });

  it("accepte les lettres accentuées comme minuscules et majuscules", () => {
    expect(evaluatePassword("éÉ").passed).toEqual(["lowercase", "uppercase"]);
  });

  it("évalue la force au fil de la saisie", () => {
    expect(evaluatePassword("").score).toBe(0);
    expect(evaluatePassword("Clapperboard-2026").score).toBe(5);
  });

  it("refuse un mot de passe identique à l'email, sans tenir compte de la casse", () => {
    expect(isPasswordDifferentFromEmail("Alice@Xotis.fr", "alice@xotis.fr")).toBe(false);
    expect(isPasswordDifferentFromEmail("Clapperboard-2026", "alice@xotis.fr")).toBe(true);
  });
});

describe("emailSchema", () => {
  it("normalise l'adresse avant validation", () => {
    expect(emailSchema.parse("  Alice@Xotis.FR ")).toBe("alice@xotis.fr");
  });

  it("refuse une adresse invalide", () => {
    expect(emailSchema.safeParse("alice").error?.issues[0]?.message).toBe(
      "Saisissez une adresse email valide.",
    );
  });
});

describe("parcours de mot de passe", () => {
  it("exige que la confirmation corresponde", () => {
    const result = resetPasswordSchema.safeParse({
      token: "t",
      password: "Clapperboard-2026",
      passwordConfirm: "Clapperboard-2027",
    });
    expect(result.error?.issues[0]?.path).toEqual(["passwordConfirm"]);
  });

  it("refuse un nouveau mot de passe identique à l'actuel", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "Clapperboard-2026",
      newPassword: "Clapperboard-2026",
      newPasswordConfirm: "Clapperboard-2026",
    });
    expect(result.error?.issues[0]?.message).toBe(
      "Le nouveau mot de passe doit être différent de l'actuel.",
    );
  });
});

describe("réglages Mailjet", () => {
  it("considère une clé vide comme « ne pas modifier »", () => {
    const parsed = mailSettingsSchema.parse({
      senderEmail: "no-reply@xotis.fr",
      senderName: "Régie",
      enabled: true,
      apiKey: "",
      secretKey: "   ",
    });
    expect(parsed.apiKey).toBeUndefined();
    expect(parsed.secretKey).toBeUndefined();
  });
});
