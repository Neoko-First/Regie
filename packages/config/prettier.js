// Configuration Prettier partagée. Le plugin Tailwind trie les classes utilitaires.
import { fileURLToPath } from "node:url";

/** @type {import("prettier").Config} */
export default {
  printWidth: 100,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  // Chemin absolu : Prettier résout sinon le plugin depuis le workspace qui l'utilise,
  // où il n'est pas installé.
  plugins: [fileURLToPath(import.meta.resolve("prettier-plugin-tailwindcss"))],
};
