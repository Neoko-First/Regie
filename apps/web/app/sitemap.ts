import type { MetadataRoute } from "next";

/**
 * Plan du site (exigé par CLAUDE.md §4). Régie étant privé et non indexé (cf. robots.ts),
 * il reste volontairement vide : aucune page publique à référencer.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
