import { describe, expect, it } from "vitest";
import {
  renderInvitationEmail,
  renderPasswordChangedEmail,
  renderPasswordResetEmail,
} from "./index";

describe("emails", () => {
  it("rend l'email de réinitialisation en HTML et en texte, en français", async () => {
    const email = await renderPasswordResetEmail({
      name: "Paula",
      resetUrl: "http://localhost:3000/reset-password/abc",
      expiresInMinutes: 30,
    });
    expect(email.subject).toBe("Réinitialisation de votre mot de passe Régie");
    expect(email.html).toContain('lang="fr"');
    expect(email.html).toContain("http://localhost:3000/reset-password/abc");
    expect(email.text).toContain("valable 30 minutes");
  });

  it("échappe les données injectées dans le HTML", async () => {
    const email = await renderPasswordChangedEmail({
      name: "<script>alert(1)</script>",
      changedAt: "23/10/2026 à 14:35",
      viaReset: true,
    });
    expect(email.html).not.toContain("<script>alert(1)</script>");
    expect(email.text).toContain("toutes vos sessions ont été fermées");
  });

  it("rend l'invitation avec le lien et l'espace", async () => {
    const email = await renderInvitationEmail({
      inviterName: "Alexandre",
      spaceName: "Socle",
      acceptUrl: "http://localhost:3000/invitation/abc",
      expiresInDays: 7,
    });
    expect(email.subject).toBe("Alexandre vous invite sur Régie (espace Socle)");
    expect(email.html).toContain("http://localhost:3000/invitation/abc");
    expect(email.text).toContain("valable 7 jours");
  });
});
