import type { Config } from "jest";

// Tests unitaires : fichiers *.spec.ts à côté du code testé.
const config: Config = {
  rootDir: "src",
  testMatch: ["**/*.spec.ts"],
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json" }] },
  moduleFileExtensions: ["ts", "js", "json"],
  testEnvironment: "node",
};

export default config;
