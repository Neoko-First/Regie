import type { Config } from "jest";

/** Avertissement ts-jest sur NodeNext sans isolatedModules (incompatible avec les décorateurs Nest). */
const TS_JEST_HYBRID_MODULE_WARNING = 151002;

// Tests unitaires : fichiers *.spec.ts à côté du code testé.
const config: Config = {
  rootDir: "src",
  testMatch: ["**/*.spec.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      { tsconfig: "tsconfig.json", diagnostics: { ignoreCodes: [TS_JEST_HYBRID_MODULE_WARNING] } },
    ],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  testEnvironment: "node",
};

export default config;
