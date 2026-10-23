// Configuration ESLint (flat config) commune à tous les workspaces.
// Chaque app l'étend avec ses règles propres (Next, Nest…).
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

/**
 * Configuration ESLint de base : règles recommandées JS + TypeScript,
 * interdiction de `any`, et désactivation des règles de style gérées par Prettier.
 *
 * @example
 * // eslint.config.js d'un workspace
 * import base from "@regie/config/eslint/base";
 * export default [...base];
 */
export default tseslint.config(
  { ignores: ["dist/**", ".next/**", "coverage/**", ".turbo/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      // Pas de console.log oublié ; warn/error restent autorisés pour les vrais logs
      "no-console": ["error", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always"],
    },
  },
  prettier,
);
