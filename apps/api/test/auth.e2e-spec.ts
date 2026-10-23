import type { NestExpressApplication } from "@nestjs/platform-express";
import { AUTH_COOKIES } from "@regie/shared";
import { MAX_FAILED_LOGINS, REFRESH_REUSE_GRACE_MS } from "../src/auth/auth.constants";
import {
  createClient,
  createTestApp,
  createTestUser,
  deleteTestUsers,
  getSetCookie,
  TEST_PASSWORD,
} from "./utils/test-app";

/** Ne simule que l'horloge (Date), pas les timers dont dépendent supertest et pg. */
const FAKE_DATE_ONLY: Parameters<typeof jest.useFakeTimers>[0] = {
  doNotFake: [
    "hrtime",
    "nextTick",
    "performance",
    "queueMicrotask",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "requestIdleCallback",
    "cancelIdleCallback",
    "setImmediate",
    "clearImmediate",
    "setInterval",
    "clearInterval",
    "setTimeout",
    "clearTimeout",
  ],
};

describe("Authentification (e2e)", () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await deleteTestUsers(app);
    await app.close();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /** Crée un utilisateur et connecte un client. */
  async function loggedInClient() {
    const user = await createTestUser(app);
    const client = createClient(app);
    const res = await client.post("/auth/login", { email: user.email, password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    return { user, client, loginResponse: res };
  }

  describe("connexion", () => {
    it("pose les cookies httpOnly sans jamais renvoyer de jeton dans le corps", async () => {
      const { user, loginResponse } = await loggedInClient();

      expect(loginResponse.body).toEqual({
        id: user.id,
        email: user.email,
        name: "Test e2e",
        isPlatformAdmin: false,
      });
      expect(JSON.stringify(loginResponse.body)).not.toMatch(/token/i);
      for (const name of Object.values(AUTH_COOKIES)) {
        expect(getSetCookie(loginResponse.headers, name)).toMatch(/HttpOnly/);
      }
      // Le refresh token n'est envoyé que sur les routes d'auth vues à travers le proxy BFF
      expect(getSetCookie(loginResponse.headers, AUTH_COOKIES.refresh)).toMatch(/Path=\/api\/auth/);
    });

    it("normalise l'email (casse et espaces)", async () => {
      const user = await createTestUser(app);
      const res = await createClient(app).post("/auth/login", {
        email: `  ${user.email.toUpperCase()} `,
        password: TEST_PASSWORD,
      });
      expect(res.status).toBe(200);
    });

    it("renvoie le même message pour un compte inconnu et un mauvais mot de passe", async () => {
      const user = await createTestUser(app);
      const client = createClient(app);
      const wrongPassword = await client.post("/auth/login", {
        email: user.email,
        password: "Mauvais-mot-de-passe-1",
      });
      const unknownUser = await client.post("/auth/login", {
        email: "inconnu@regie.test",
        password: TEST_PASSWORD,
      });

      expect(wrongPassword.status).toBe(401);
      expect(unknownUser.status).toBe(401);
      expect(wrongPassword.body.message).toBe("Identifiants incorrects.");
      expect(unknownUser.body).toEqual(wrongPassword.body);
    });

    it("valide le corps de la requête avec le schéma partagé", async () => {
      const res = await createClient(app).post("/auth/login", { email: "pas-un-email" });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_FAILED");
      expect(Object.keys(res.body.fieldErrors)).toEqual(
        expect.arrayContaining(["email", "password"]),
      );
    });

    it(`verrouille le compte après ${MAX_FAILED_LOGINS} échecs, même avec le bon mot de passe ensuite`, async () => {
      const user = await createTestUser(app);
      const client = createClient(app);
      for (let attempt = 0; attempt < MAX_FAILED_LOGINS; attempt++) {
        await client.post("/auth/login", { email: user.email, password: "Mauvais-mot-de-passe-1" });
      }
      const res = await client.post("/auth/login", { email: user.email, password: TEST_PASSWORD });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Identifiants incorrects.");
    });

    it("limite le nombre de tentatives par IP", async () => {
      const client = createClient(app);
      const statuses: number[] = [];
      for (let attempt = 0; attempt < 11; attempt++) {
        const res = await client.post("/auth/login", {
          email: "inconnu@regie.test",
          password: TEST_PASSWORD,
        });
        statuses.push(res.status);
      }
      expect(statuses.at(-1)).toBe(429);
    });
  });

  describe("routes protégées", () => {
    it("refuse l'accès sans session", async () => {
      const res = await createClient(app).get("/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHENTICATED");
    });

    it("renvoie l'utilisateur connecté", async () => {
      const { user, client } = await loggedInClient();
      const res = await client.get("/auth/me");
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(user.email);
    });

    it("refuse une requête mutante authentifiée sans en-tête Origin (CSRF)", async () => {
      const { client } = await loggedInClient();
      const res = await client.postWithoutOrigin("/auth/logout-all");
      expect(res.status).toBe(403);
    });

    it("laisse passer /health sans session", async () => {
      expect((await createClient(app).get("/health")).status).toBe(200);
    });
  });

  describe("refresh token", () => {
    it("émet un nouveau refresh token à chaque utilisation (rotation)", async () => {
      const { client, loginResponse } = await loggedInClient();
      const res = await client.post("/auth/refresh");
      expect(res.status).toBe(204);
      expect(getSetCookie(res.headers, AUTH_COOKIES.refresh)).toBeDefined();
      expect(getSetCookie(res.headers, AUTH_COOKIES.refresh)).not.toBe(
        getSetCookie(loginResponse.headers, AUTH_COOKIES.refresh),
      );
    });

    it("révoque la session si un token consommé est réutilisé après le délai de grâce", async () => {
      const { client, loginResponse } = await loggedInClient();
      const stolenCookie = getSetCookie(loginResponse.headers, AUTH_COOKIES.refresh)!.split(
        ";",
      )[0]!;
      expect((await client.post("/auth/refresh")).status).toBe(204);

      jest.useFakeTimers(FAKE_DATE_ONLY);
      jest.setSystemTime(Date.now() + REFRESH_REUSE_GRACE_MS + 1000);

      // Un attaquant rejoue l'ancien token volé
      const attacker = createClient(app);
      const replay = await attacker.post("/auth/refresh").set("Cookie", stolenCookie);
      expect(replay.status).toBe(401);

      // La victime est déconnectée elle aussi : toute la session est révoquée
      expect((await client.get("/auth/me")).status).toBe(401);
      expect((await client.post("/auth/refresh")).status).toBe(401);
    });

    it("tolère deux refresh simultanés (plusieurs onglets) dans le délai de grâce", async () => {
      const { client, loginResponse } = await loggedInClient();
      const cookie = getSetCookie(loginResponse.headers, AUTH_COOKIES.refresh)!.split(";")[0]!;
      const other = createClient(app);
      expect((await client.post("/auth/refresh")).status).toBe(204);
      expect((await other.post("/auth/refresh").set("Cookie", cookie)).status).toBe(204);
    });

    it("supprime les cookies quand le refresh échoue", async () => {
      const res = await createClient(app).post("/auth/refresh");
      expect(res.status).toBe(401);
      expect(getSetCookie(res.headers, AUTH_COOKIES.session)).toMatch(/Expires=Thu, 01 Jan 1970/);
    });
  });

  describe("déconnexion et sessions", () => {
    it("révoque la session à la déconnexion", async () => {
      const { client } = await loggedInClient();
      expect((await client.post("/auth/logout")).status).toBe(204);
      expect((await client.get("/auth/me")).status).toBe(401);
      expect((await client.post("/auth/refresh")).status).toBe(401);
    });

    it("liste les sessions et révoque celle d'un autre appareil", async () => {
      const { user, client } = await loggedInClient();
      const otherDevice = createClient(app);
      await otherDevice.post("/auth/login", { email: user.email, password: TEST_PASSWORD });

      const list = await client.get("/auth/sessions");
      expect(list.status).toBe(200);
      expect(list.body).toHaveLength(2);
      const other = list.body.find((session: { current: boolean }) => !session.current);

      expect((await client.delete(`/auth/sessions/${other.id}`)).status).toBe(204);
      expect((await otherDevice.get("/auth/me")).status).toBe(401);
      expect((await client.get("/auth/me")).status).toBe(200);
    });

    it("interdit de révoquer la session d'un autre utilisateur", async () => {
      const alice = await loggedInClient();
      const bob = await loggedInClient();
      const [bobSession] = (await bob.client.get("/auth/sessions")).body;

      const res = await alice.client.delete(`/auth/sessions/${bobSession.id}`);
      expect(res.status).toBe(404);
      expect((await bob.client.get("/auth/me")).status).toBe(200);
    });

    it("déconnecte tous les appareils", async () => {
      const { user, client } = await loggedInClient();
      const otherDevice = createClient(app);
      await otherDevice.post("/auth/login", { email: user.email, password: TEST_PASSWORD });

      expect((await client.post("/auth/logout-all")).status).toBe(204);
      expect((await client.get("/auth/me")).status).toBe(401);
      expect((await otherDevice.get("/auth/me")).status).toBe(401);
    });
  });
});
