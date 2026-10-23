import type { Config } from "jest";

/** Avertissement ts-jest sur NodeNext sans isolatedModules (incompatible avec les décorateurs Nest). */
const TS_JEST_HYBRID_MODULE_WARNING = 151002;

// Tests e2e : l'application complète contre une vraie base PostgreSQL (DATABASE_URL),
// migrations appliquées au préalable (`pnpm db:deploy`).
const config: Config = {
  rootDir: ".",
  testMatch: ["<rootDir>/**/*.e2e-spec.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/../tsconfig.json",
        diagnostics: { ignoreCodes: [TS_JEST_HYBRID_MODULE_WARNING] },
      },
    ],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  testEnvironment: "node",
  setupFiles: ["dotenv/config"],
  // Une seule base partagée : on évite les exécutions parallèles qui se marcheraient dessus
  maxWorkers: 1,
  testTimeout: 30_000,
};

export default config;
