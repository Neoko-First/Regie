import type { NestExpressApplication } from "@nestjs/platform-express";
import type { MailSettingsInfo } from "@regie/shared";
import { MailService } from "../src/mail/mail.service";
import { PrismaService } from "../src/prisma/prisma.service";
import {
  createClient,
  createLoggedInUser,
  createTestApp,
  createTestUser,
  deleteTestUsers,
  TEST_PASSWORD,
} from "./utils/test-app";

/** Nouveau mot de passe valide (politique respectée). */
const NEW_PASSWORD = "Clapperboard-2027!";

describe("Mots de passe et emails (e2e)", () => {
  let app: NestExpressApplication;
  let mail: MailService;

  beforeAll(async () => {
    app = await createTestApp();
    mail = app.get(MailService);
  });

  afterAll(async () => {
    await deleteTestUsers(app);
    await app.close();
  });

  /** Attend que les emails envoyés en arrière-plan soient capturés. */
  async function waitForMail(address: string) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const email = mail.captured.lastTo(address);
      if (email) return email;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error(`Aucun email reçu par ${address}`);
  }

  /** Extrait le jeton du lien de réinitialisation. */
  function resetTokenFrom(text: string): string {
    const match = /reset-password\/([\w-]+)/.exec(text);
    if (!match) throw new Error("Lien de réinitialisation absent de l'email");
    return match[1]!;
  }

  describe("mot de passe oublié", () => {
    it("répond pareil qu'un compte existe ou non, et n'envoie un lien qu'au compte existant", async () => {
      const user = await createTestUser(app);
      const client = createClient(app);
      const known = await client.post("/auth/forgot-password", { email: user.email });
      const unknown = await client.post("/auth/forgot-password", { email: "inconnu@regie.test" });
      expect(known.status).toBe(204);
      expect(unknown.status).toBe(204);
      expect(known.body).toEqual(unknown.body);

      const email = await waitForMail(user.email);
      expect(email.subject).toBe("Réinitialisation de votre mot de passe Régie");
      expect(mail.captured.lastTo("inconnu@regie.test")).toBeUndefined();
    });

    it("réinitialise le mot de passe, révoque les sessions et notifie", async () => {
      const { user, client } = await createLoggedInUser(app);
      await createClient(app).post("/auth/forgot-password", { email: user.email });
      const token = resetTokenFrom((await waitForMail(user.email)).text);

      const res = await createClient(app).post("/auth/reset-password", {
        token,
        password: NEW_PASSWORD,
        passwordConfirm: NEW_PASSWORD,
      });
      expect(res.status).toBe(204);

      // Ancienne session coupée, ancien mot de passe refusé, nouveau accepté
      expect((await client.get("/auth/me")).status).toBe(401);
      const old = await createClient(app).post("/auth/login", {
        email: user.email,
        password: TEST_PASSWORD,
      });
      expect(old.status).toBe(401);
      const fresh = await createClient(app).post("/auth/login", {
        email: user.email,
        password: NEW_PASSWORD,
      });
      expect(fresh.status).toBe(200);

      const notification = await waitForMail(user.email);
      expect(notification.subject).toBe("Votre mot de passe Régie a été modifié");
    });

    it("refuse un lien déjà utilisé ou remplacé par une nouvelle demande", async () => {
      const user = await createTestUser(app);
      const client = createClient(app);
      await client.post("/auth/forgot-password", { email: user.email });
      const first = resetTokenFrom((await waitForMail(user.email)).text);
      mail.captured.sent.length = 0;
      await client.post("/auth/forgot-password", { email: user.email });
      const second = resetTokenFrom((await waitForMail(user.email)).text);

      const replaced = await client.post("/auth/reset-password", {
        token: first,
        password: NEW_PASSWORD,
        passwordConfirm: NEW_PASSWORD,
      });
      expect(replaced.status).toBe(400);

      const body = { token: second, password: NEW_PASSWORD, passwordConfirm: NEW_PASSWORD };
      expect((await client.post("/auth/reset-password", body)).status).toBe(204);
      const reused = await client.post("/auth/reset-password", body);
      expect(reused.status).toBe(400);
      expect(reused.body.message).toBe(
        "Ce lien de réinitialisation n'est plus valable. Faites une nouvelle demande.",
      );
    });

    it("refuse un lien expiré", async () => {
      const user = await createTestUser(app);
      await createClient(app).post("/auth/forgot-password", { email: user.email });
      const token = resetTokenFrom((await waitForMail(user.email)).text);
      await app.get(PrismaService).verificationToken.updateMany({
        where: { userId: user.id },
        data: { expiresAt: new Date(0) },
      });

      const res = await createClient(app).post("/auth/reset-password", {
        token,
        password: NEW_PASSWORD,
        passwordConfirm: NEW_PASSWORD,
      });
      expect(res.status).toBe(400);
    });

    it("applique la politique de mot de passe côté serveur", async () => {
      const res = await createClient(app).post("/auth/reset-password", {
        token: "peu-importe",
        password: "faible",
        passwordConfirm: "faible",
      });
      expect(res.status).toBe(400);
      expect(res.body.fieldErrors.password).toBeDefined();
    });
  });

  describe("changement de mot de passe", () => {
    it("exige le mot de passe actuel", async () => {
      const { client } = await createLoggedInUser(app);
      const res = await client.post("/auth/change-password", {
        currentPassword: "Mauvais-mot-de-passe-1",
        newPassword: NEW_PASSWORD,
        newPasswordConfirm: NEW_PASSWORD,
      });
      expect(res.status).toBe(400);
      expect(res.body.fieldErrors.currentPassword).toEqual([
        "Le mot de passe actuel est incorrect.",
      ]);
    });

    it("garde l'appareil courant connecté et déconnecte les autres", async () => {
      const { user, client } = await createLoggedInUser(app);
      const other = createClient(app);
      await other.post("/auth/login", { email: user.email, password: TEST_PASSWORD });

      const res = await client.post("/auth/change-password", {
        currentPassword: TEST_PASSWORD,
        newPassword: NEW_PASSWORD,
        newPasswordConfirm: NEW_PASSWORD,
      });
      expect(res.status).toBe(204);
      expect((await client.get("/auth/me")).status).toBe(200);
      expect((await other.get("/auth/me")).status).toBe(401);
      expect((await waitForMail(user.email)).subject).toBe(
        "Votre mot de passe Régie a été modifié",
      );
    });
  });

  describe("réglages Mailjet", () => {
    /** Connecte un administrateur de la plateforme. */
    async function adminClient() {
      const admin = await createLoggedInUser(app);
      await app
        .get(PrismaService)
        .user.update({ where: { id: admin.user.id }, data: { isPlatformAdmin: true } });
      return admin;
    }

    it("est réservé à l'administrateur de la plateforme", async () => {
      const { client } = await createLoggedInUser(app);
      expect((await client.get("/admin/mail-settings")).status).toBe(403);
    });

    it("chiffre les clés en base et ne les renvoie jamais", async () => {
      const { client } = await adminClient();
      const res = await client.agent
        .put("/api/admin/mail-settings")
        .set("Origin", "http://localhost:3000")
        .send({
          senderEmail: "no-reply@xotis.fr",
          senderName: "Régie",
          enabled: false,
          apiKey: "cle-publique-1234",
          secretKey: "cle-secrete-tres-privee",
        });
      expect(res.status).toBe(200);
      const info = res.body as MailSettingsInfo;
      expect(info.apiKeyHint).toBe("1234");
      expect(info.secretKeyConfigured).toBe(true);
      expect(JSON.stringify(info)).not.toMatch(/cle-publique|cle-secrete/);

      const stored = await app
        .get(PrismaService)
        .mailSettings.findUniqueOrThrow({ where: { id: "default" } });
      expect(stored.apiKeyEncrypted).not.toContain("cle-publique");
      expect(stored.secretKeyEncrypted).not.toContain("cle-secrete");
    });

    it("conserve les clés quand elles ne sont pas ressaisies", async () => {
      const { client } = await adminClient();
      const res = await client.agent
        .put("/api/admin/mail-settings")
        .set("Origin", "http://localhost:3000")
        .send({
          senderEmail: "no-reply@xotis.fr",
          senderName: "Régie Xotis",
          enabled: false,
          apiKey: "",
          secretKey: "",
        });
      expect(res.status).toBe(200);
      expect(res.body.apiKeyHint).toBe("1234");
      expect(res.body.senderName).toBe("Régie Xotis");
    });

    it("envoie un email de test à l'administrateur", async () => {
      const { user, client } = await adminClient();
      const res = await client.post("/admin/mail-settings/test");
      expect(res.status).toBe(200);
      expect((await waitForMail(user.email)).subject).toBe("Test d'envoi d'email depuis Régie");
    });
  });
});
