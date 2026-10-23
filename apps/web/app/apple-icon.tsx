import { ImageResponse } from "next/og";

// Icône d'écran d'accueil iOS : PNG obligatoire (iOS ignore les SVG), générée au build.
// Mêmes tracés que components/brand/regie-logo.tsx ; iOS arrondit lui-même les coins,
// d'où le fond plein bord à bord. Couleurs en hex : l'image ne lit pas les variables CSS.

/** Couleur `--primary` (thème clair). */
const PRIMARY = "#4f46e5";
/** Couleur `--primary-foreground` (thème clair). */
const PRIMARY_FOREGROUND = "#ffffff";
/** Le dessin occupe 80 % de l'icône (marge de sécurité). */
const MARK_SIZE = 144;

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Icône Apple (180 × 180) : le clap validé sur fond primaire. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: PRIMARY,
      }}
    >
      <svg width={MARK_SIZE} height={MARK_SIZE} viewBox="0 0 64 64" fill="none">
        <g stroke={PRIMARY_FOREGROUND} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 30h32v16a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4z" />
          <path d="m15.2 24.4 30.6-8.2a3 3 0 0 1 3.7 2.1l1 3.9-32.8 8.8-1-3.9a3 3 0 0 1 2.1-3.7z" />
          <path d="m24 21.8 4.6 6.2M33.6 19.2l4.6 6.2" />
          <path d="m25 40 5 4 9-9" />
        </g>
      </svg>
    </div>,
    size,
  );
}
