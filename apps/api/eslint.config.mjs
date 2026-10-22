import base from "@regie/config/eslint/base";
import globals from "globals";

export default [
  { ignores: ["src/generated/**"] },
  ...base,
  {
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
    rules: {
      // Les DTO, services et modules Nest sont injectés via les métadonnées des décorateurs :
      // un import « type only » casserait l'injection de dépendances.
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
];
