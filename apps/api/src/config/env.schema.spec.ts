import { validateEnv } from "./env.schema";

const VALID_ENV = {
  DATABASE_URL: "postgresql://regie:regie@localhost:5433/regie",
  WEB_ORIGIN: "http://localhost:3000",
  JWT_ACCESS_SECRET: "s".repeat(32),
};

describe("validateEnv", () => {
  it("applique les valeurs par défaut", () => {
    const env = validateEnv(VALID_ENV);
    expect(env.NODE_ENV).toBe("development");
    expect(env.PORT).toBe(4000);
  });

  it("convertit le port en nombre", () => {
    expect(validateEnv({ ...VALID_ENV, PORT: "4100" }).PORT).toBe(4100);
  });

  it("liste les variables invalides sans afficher leurs valeurs", () => {
    const secret = "pas-une-url-mais-un-secret";
    const run = () => validateEnv({ DATABASE_URL: secret });
    expect(run).toThrow(/DATABASE_URL/);
    expect(run).toThrow(/WEB_ORIGIN/);
    expect(run).not.toThrow(new RegExp(secret));
  });
});
