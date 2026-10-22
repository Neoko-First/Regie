import { defineConfig } from "tsup";

// Double sortie ESM + CJS : Next.js consomme l'ESM, NestJS (CommonJS) le CJS.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
});
