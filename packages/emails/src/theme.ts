// Couleurs du design system converties en hexadécimal pour les emails : les clients mail
// (Outlook, Gmail…) ne comprennent ni les variables CSS ni oklch. Exception assumée à la règle
// « pas de couleur en dur », limitée à ce fichier. Source : apps/web/app/globals.css (thème clair).

/** Palette des emails (thème clair du design system). */
export const EMAIL_COLORS = {
  background: "#e7e5e4",
  card: "#f5f5f4",
  foreground: "#1e293b",
  mutedForeground: "#5a6371",
  primary: "#4f46e5",
  primaryForeground: "#ffffff",
  border: "#d6d3d1",
  warning: "#973c00",
} as const;

/** Polices : Plus Jakarta Sans si disponible, sinon une police système équivalente. */
export const EMAIL_FONT_FAMILY =
  "'Plus Jakarta Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Arrondis du design system (carte, bouton). */
export const EMAIL_RADIUS = { card: "20px", button: "16px" } as const;
