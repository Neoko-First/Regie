import base from "@regie/config/eslint/base";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...base,
  {
    // Composants générés par shadcn : on ne les modifie qu'exceptionnellement (CLAUDE.md §8)
    files: ["components/ui/**"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
