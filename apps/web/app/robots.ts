import type { MetadataRoute } from "next";

/** Outil interne et privé : aucune page ne doit être indexée. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
