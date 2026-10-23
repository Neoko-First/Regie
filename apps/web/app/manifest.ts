import { APP_NAME } from "@regie/shared";
import type { MetadataRoute } from "next";

/**
 * Manifeste PWA (CLAUDE.md §15). Le service worker (Serwist) sera ajouté dans une phase dédiée.
 * Les couleurs ne peuvent pas référencer les variables CSS : elles reprennent
 * `--background` (clair) et `--primary`, définis dans app/globals.css.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: "De la spec à la recette, toute la production au même endroit.",
    lang: "fr",
    start_url: "/inbox",
    display: "standalone",
    background_color: "#e7e5e4",
    theme_color: "#4f46e5",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
