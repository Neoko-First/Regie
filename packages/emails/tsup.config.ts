import { defineConfig } from "tsup";

// Double sortie ESM + CJS : l'API NestJS (CommonJS) consomme la version CJS.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  // React et react-email restent des dépendances (pas embarqués dans le bundle)
  external: ["react", "react-dom", "@react-email/components", "@react-email/render"],
});
