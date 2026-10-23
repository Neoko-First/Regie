import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components (rendu partiel : coquille statique + contenu dynamique en streaming)
  // et préchargement partiel : options par défaut de Next 16, activées dans la prochaine majeure.
  // Conséquence : tout accès dynamique (cookies, données) doit être sous un <Suspense>.
  cacheComponents: true,
  partialPrefetching: true,
  // N'expose pas la techno du serveur
  poweredByHeader: false,
  // L'indicateur flottant de Next masquait des éléments de l'interface ; les erreurs
  // restent signalées par l'overlay de développement et la console.
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
