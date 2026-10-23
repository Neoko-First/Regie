import { randomUUID } from "node:crypto";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { AddMemberResult, InvitationInfo, SpaceMember, SpaceSummary } from "@regie/shared";
import { MailService } from "../src/mail/mail.service";
import { PrismaService } from "../src/prisma/prisma.service";
import {
  createClient,
  createLoggedInUser,
  createTestApp,
  createTestSpace,
  createTestUser,
  deleteTestUsers,
} from "./utils/test-app";

/** Mot de passe choisi par les invités (politique respectée). */
const INVITEE_PASSWORD = "Clapperboard-2028!";

type LoggedIn = Awaited<ReturnType<typeof createLoggedInUser>>;

describe("Membres et invitations (e2e)", () => {
  let app: NestExpressApplication;
  let mail: MailService;
  let admin: LoggedIn;
  let dev: LoggedIn;
  let spaceKey: string;

  beforeAll(async () => {
    app = await createTestApp();
    mail = app.get(MailService);
    admin = await createLoggedInUser(app);
    dev = await createLoggedInUser(app);
    const space = await createTestSpace(app, [
      { userId: admin.user.id, roles: ["ADMIN"] },
      { userId: dev.user.id, roles: ["DEV"] },
    ]);
    spaceKey = space.key;
  });

  afterAll(async () => {
    await deleteTestUsers(app);
    await app.close();
  });

  /** Adresse d'invité unique (préfixe e2e- : supprimée en fin de test). */
  const inviteeEmail = () => `e2e-${randomUUID()}@regie.test`;

  /** Attend l'email envoyé en arrière-plan à une adresse. */
  async function waitForMail(address: string, subjectPart: string) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const email = mail.captured.lastTo(address);
      if (email?.subject.includes(subjectPart)) return email;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error(`Aucun email « ${subjectPart} » reçu par ${address}`);
  }

  /** Extrait le jeton du lien d'invitation. */
  function invitationTokenFrom(text: string): string {
    const match = /invitation\/([\w-]+)/.exec(text);
    if (!match) throw new Error("Lien d'invitation absent de l'email");
    return match[1]!;
  }

  /** Invite une adresse et renvoie le jeton reçu par email. */
  async function invite(email: string, roles = ["TESTER"], key = spaceKey) {
    const res = await admin.client.post(`/spaces/${key}/members`, { email, roles });
    expect(res.status).toBe(201);
    expect((res.body as AddMemberResult).status).toBe("INVITED");
    return invitationTokenFrom((await waitForMail(email, "vous invite")).text);
  }

  /** Accepte une invitation avec un client neuf. */
  function accept(token: string, client = createClient(app)) {
    return client.post("/invitations/accept", {
      token,
      name: "Invitée e2e",
      password: INVITEE_PASSWORD,
      passwordConfirm: INVITEE_PASSWORD,
    });
  }

  describe("ajout par email", () => {
    it("rattache directement une personne qui a déjà un compte et la prévient", async () => {
      const existing = await createTestUser(app);
      const res = await admin.client.post(`/spaces/${spaceKey}/members`, {
        email: existing.email.toUpperCase(),
        roles: ["PO"],
      });
      expect(res.status).toBe(201);
      const result = res.body as AddMemberResult;
      expect(result.status).toBe("ADDED");

      const members = (await admin.client.get(`/spaces/${spaceKey}/members`)).body as SpaceMember[];
      expect(members.find((m) => m.user.id === existing.id)?.roles).toEqual(["PO"]);
      await waitForMail(existing.email, "Vous avez rejoint");

      const again = await admin.client.post(`/spaces/${spaceKey}/members`, {
        email: existing.email,
        roles: ["DEV"],
      });
      expect(again.status).toBe(409);
    });

    it("refuse l'ajout à qui n'est pas admin de l'espace", async () => {
      const res = await dev.client.post(`/spaces/${spaceKey}/members`, {
        email: inviteeEmail(),
        roles: ["DEV"],
      });
      expect(res.status).toBe(403);
      expect((await dev.client.get(`/spaces/${spaceKey}/invitations`)).status).toBe(403);
    });

    it("ne révèle pas un espace dont on n'est pas membre", async () => {
      const outsider = await createLoggedInUser(app);
      const res = await outsider.client.post(`/spaces/${spaceKey}/members`, {
        email: inviteeEmail(),
        roles: ["DEV"],
      });
      expect(res.status).toBe(404);
    });
  });

  describe("invitation", () => {
    it("crée le compte à l'acceptation, connecte l'invité et le rattache à l'espace", async () => {
      const email = inviteeEmail();
      const token = await invite(email, ["TESTER", "DEV"]);

      // Le jeton n'est jamais stocké en clair
      const stored = await app.get(PrismaService).invitation.findFirstOrThrow({ where: { email } });
      expect(stored.tokenHash).not.toBe(token);

      const preview = await createClient(app).get(`/invitations/${token}`);
      expect(preview.status).toBe(200);
      expect(preview.body).toMatchObject({ email, invitedByName: "Test e2e" });

      const client = createClient(app);
      const res = await accept(token, client);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ email, name: "Invitée e2e", isPlatformAdmin: false });

      const spaces = (await client.get("/spaces")).body as SpaceSummary[];
      expect(spaces.find((s) => s.key === spaceKey)?.myRoles.sort()).toEqual(["DEV", "TESTER"]);

      // Usage unique
      expect((await accept(token)).status).toBe(400);
      expect((await createClient(app).get(`/invitations/${token}`)).status).toBe(400);
    });

    it("rattache aussi aux autres espaces où une invitation attend la même adresse", async () => {
      const other = await createTestSpace(app, [{ userId: admin.user.id, roles: ["ADMIN"] }]);
      const email = inviteeEmail();
      const first = await invite(email, ["DEV"]);
      await invite(email, ["READER"], other.key);

      const client = createClient(app);
      expect((await accept(first, client)).status).toBe(200);
      const keys = ((await client.get("/spaces")).body as SpaceSummary[]).map((s) => s.key);
      expect(keys).toEqual(expect.arrayContaining([spaceKey, other.key]));
    });

    it("un renvoi remplace le lien, une révocation le désactive", async () => {
      const email = inviteeEmail();
      const oldToken = await invite(email);
      const list = (await admin.client.get(`/spaces/${spaceKey}/invitations`))
        .body as InvitationInfo[];
      const invitation = list.find((i) => i.email === email)!;
      expect(invitation).toMatchObject({ roles: ["TESTER"], expired: false });
      expect(JSON.stringify(list)).not.toContain("token");

      const resent = await admin.client.post(
        `/spaces/${spaceKey}/invitations/${invitation.id}/resend`,
      );
      expect(resent.status).toBe(200);
      const newToken = invitationTokenFrom((await waitForMail(email, "vous invite")).text);
      expect(newToken).not.toBe(oldToken);
      expect((await accept(oldToken)).status).toBe(400);

      const pending = (await admin.client.get(`/spaces/${spaceKey}/invitations`))
        .body as InvitationInfo[];
      const current = pending.find((i) => i.email === email)!;
      expect(pending.filter((i) => i.email === email)).toHaveLength(1);

      const revoked = await admin.client.delete(`/spaces/${spaceKey}/invitations/${current.id}`);
      expect(revoked.status).toBe(204);
      expect((await accept(newToken)).status).toBe(400);
    });

    it("refuse un lien expiré", async () => {
      const email = inviteeEmail();
      const token = await invite(email);
      await app
        .get(PrismaService)
        .invitation.updateMany({ where: { email }, data: { expiresAt: new Date(Date.now() - 1) } });
      expect((await accept(token)).status).toBe(400);
    });

    it("applique la politique de mot de passe côté serveur", async () => {
      const email = inviteeEmail();
      const token = await invite(email);
      const weak = await createClient(app).post("/invitations/accept", {
        token,
        name: "Invitée",
        password: "court",
        passwordConfirm: "court",
      });
      expect(weak.status).toBe(400);
      expect(weak.body.fieldErrors).toHaveProperty("password");
    });
  });

  describe("garde-fous", () => {
    it("refuse de retirer ou de rétrograder le dernier admin de l'espace", async () => {
      const removed = await admin.client.delete(`/spaces/${spaceKey}/members/${admin.user.id}`);
      expect(removed.status).toBe(409);
      const demoted = await admin.client.put(`/spaces/${spaceKey}/members/${admin.user.id}`, {
        roles: ["PO"],
      });
      expect(demoted.status).toBe(409);

      // Avec un second admin, la rétrogradation devient possible
      const promoted = await admin.client.put(`/spaces/${spaceKey}/members/${dev.user.id}`, {
        roles: ["ADMIN", "DEV"],
      });
      expect(promoted.status).toBe(200);
      const ok = await admin.client.put(`/spaces/${spaceKey}/members/${admin.user.id}`, {
        roles: ["ADMIN", "PO"],
      });
      expect(ok.status).toBe(200);
    });
  });
});
