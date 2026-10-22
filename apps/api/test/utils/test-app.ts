import { Test } from "@nestjs/testing";
import type { SpaceRole } from "@regie/shared";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { randomInt, randomUUID } from "node:crypto";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { configureApp } from "../../src/app.setup";
import { PasswordService } from "../../src/auth/password.service";
import { AppConfigService } from "../../src/config/app-config.service";
import { PrismaService } from "../../src/prisma/prisma.service";

/** Mot de passe des comptes créés par les tests (respecte la politique). */
export const TEST_PASSWORD = "Clapperboard-2026";

/**
 * Démarre l'application complète, configurée comme en production. Les routes sont servies
 * sous le préfixe public (`/api`), comme le navigateur les voit à travers le proxy BFF :
 * le cookie de refresh, limité à `/api/auth`, est ainsi envoyé exactement comme en réel.
 */
export async function createTestApp(): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  configureApp(app);
  app.setGlobalPrefix(app.get(AppConfigService).get("PUBLIC_API_PREFIX"));
  await app.init();
  return app;
}

/** Crée un utilisateur de test unique ; à supprimer avec `deleteTestUsers`. */
export async function createTestUser(
  app: NestExpressApplication,
): Promise<{ id: string; email: string }> {
  const prisma = app.get(PrismaService);
  const email = `e2e-${randomUUID()}@regie.test`;
  const passwordHash = await app.get(PasswordService).hash(TEST_PASSWORD);
  const user = await prisma.user.create({ data: { email, name: "Test e2e", passwordHash } });
  return { id: user.id, email };
}

/**
 * Supprime les données créées par les tests : évolutions et espaces de test d'abord
 * (ils référencent les utilisateurs), puis les utilisateurs (sessions et tokens en cascade).
 */
export async function deleteTestUsers(app: NestExpressApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  const testSpaces = { description: TEST_SPACE_DESCRIPTION };
  await prisma.change.deleteMany({ where: { space: testSpaces } });
  await prisma.space.deleteMany({ where: testSpaces });
  await prisma.user.deleteMany({ where: { email: { startsWith: "e2e-" } } });
}

/** Marqueur des espaces créés par les tests (pour le nettoyage). */
const TEST_SPACE_DESCRIPTION = "Espace de test e2e";

/** Caractères possibles d'une clé d'espace de test. */
const KEY_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * Crée un espace de test (clé aléatoire « E + 5 caractères ») avec ses membres.
 *
 * @param members - Utilisateurs et rôles dans l'espace
 * @returns L'espace créé
 */
export async function createTestSpace(
  app: NestExpressApplication,
  members: Array<{ userId: string; roles: SpaceRole[] }>,
): Promise<{ id: string; key: string }> {
  const key = `E${Array.from({ length: 5 }, () => KEY_CHARS[randomInt(KEY_CHARS.length)]).join("")}`;
  return app.get(PrismaService).space.create({
    data: {
      key,
      name: `Test ${key}`,
      description: TEST_SPACE_DESCRIPTION,
      memberships: { create: members },
    },
    select: { id: true, key: true },
  });
}

/**
 * Crée un utilisateur de test connecté (client HTTP prêt à l'emploi).
 *
 * @returns L'utilisateur et son client
 */
export async function createLoggedInUser(app: NestExpressApplication) {
  const user = await createTestUser(app);
  const client = createClient(app);
  const res = await client.post("/auth/login", { email: user.email, password: TEST_PASSWORD });
  if (res.status !== 200) throw new Error(`Connexion de test impossible (${res.status})`);
  return { user, client };
}

/**
 * Client HTTP qui se comporte comme le proxy BFF : même origine que le front,
 * IP distincte par client (le rate limiting est calculé par IP), cookies conservés.
 */
export function createClient(app: NestExpressApplication) {
  const agent = request.agent(app.getHttpServer());
  const config = app.get(AppConfigService);
  const origin = config.get("WEB_ORIGIN");
  const prefix = config.get("PUBLIC_API_PREFIX");
  // IP privée aléatoire : chaque client a son propre compteur de rate limiting
  const ip = `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
  return {
    agent,
    get: (url: string) => agent.get(prefix + url).set("X-Forwarded-For", ip),
    post: (url: string, body?: object) =>
      agent
        .post(prefix + url)
        .set("Origin", origin)
        .set("X-Forwarded-For", ip)
        .send(body),
    patch: (url: string, body?: object) =>
      agent
        .patch(prefix + url)
        .set("Origin", origin)
        .set("X-Forwarded-For", ip)
        .send(body),
    delete: (url: string) =>
      agent
        .delete(prefix + url)
        .set("Origin", origin)
        .set("X-Forwarded-For", ip),
    /** Requête mutante SANS en-tête Origin (simulation d'une attaque CSRF) */
    postWithoutOrigin: (url: string) => agent.post(prefix + url).set("X-Forwarded-For", ip),
  };
}

/** Extrait la valeur d'un cookie d'une réponse `Set-Cookie`. */
export function getSetCookie(headers: Record<string, unknown>, name: string): string | undefined {
  const raw = headers["set-cookie"];
  const cookies = Array.isArray(raw) ? (raw as string[]) : [];
  return cookies.find((cookie) => cookie.startsWith(`${name}=`));
}
