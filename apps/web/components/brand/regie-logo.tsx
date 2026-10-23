import { APP_NAME } from "@regie/shared";
import { cn } from "@/lib/utils";

// Logo de Régie : le « clap validé » (clap de cinéma, D-024, marqué d'une coche de validation).
// Dessiné sur une grille de 64 × 64. Les couleurs viennent des tokens (`primary`,
// `primary-foreground`) : le logo suit le thème clair / sombre sans variante dédiée.
// Les fichiers statiques (favicon, docs/brand/) reprennent les mêmes tracés.

/** En dessous de cette taille (px), la version compacte reste lisible, la complète non. */
const COMPACT_MAX_SIZE = 32;

/** Tracés de la version complète : clapet incliné, rayures, corps et coche. */
function FullPaths() {
  return (
    <g strokeWidth={4}>
      <path d="M16 30h32v16a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4z" />
      <path d="m15.2 24.4 30.6-8.2a3 3 0 0 1 3.7 2.1l1 3.9-32.8 8.8-1-3.9a3 3 0 0 1 2.1-3.7z" />
      <path d="m24 21.8 4.6 6.2M33.6 19.2l4.6 6.2" />
      <path d="m25 40 5 4 9-9" />
    </g>
  );
}

/** Tracés de la version compacte (favicon, sidebar) : clapet droit, corps et coche épaissis. */
function CompactPaths() {
  return (
    <g strokeWidth={5}>
      <path d="M15 19h34" />
      <path d="M15 27h34v17a5 5 0 0 1-5 5H20a5 5 0 0 1-5-5z" />
      <path d="m24 38 5 4 10-10" />
    </g>
  );
}

/** Propriétés de `RegieMark`. */
export interface RegieMarkProps {
  /** Taille en pixels (carré) */
  size?: number;
  /** Version forcée ; par défaut, compacte jusqu'à 32 px, complète au-delà */
  variant?: "full" | "compact";
  className?: string;
}

/**
 * Icône de Régie (le clap validé), sur fond `primary`.
 * Décorative : le nom de l'application doit être présent à côté (ou via `aria-label` du parent).
 *
 * @example <RegieMark size={40} />
 */
export function RegieMark({ size = COMPACT_MAX_SIZE, variant, className }: RegieMarkProps) {
  const compact = (variant ?? (size <= COMPACT_MAX_SIZE ? "compact" : "full")) === "compact";
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <rect width="64" height="64" rx="14" className="fill-primary" />
      <g className="stroke-primary-foreground" strokeLinecap="round" strokeLinejoin="round">
        {compact ? <CompactPaths /> : <FullPaths />}
      </g>
    </svg>
  );
}

/** Propriétés de `RegieWordmark`. */
export interface RegieWordmarkProps {
  /** Taille de l'icône en pixels */
  size?: number;
  /** Affiche la signature « De la spec à la recette » sous le nom */
  withTagline?: boolean;
  className?: string;
}

/**
 * Logo complet : icône et nom de l'application (pages publiques, en-têtes).
 *
 * @example <RegieWordmark size={40} withTagline />
 */
export function RegieWordmark({ size = 40, withTagline = false, className }: RegieWordmarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <RegieMark size={size} />
      <span className="flex flex-col leading-none">
        <span className="text-h4 font-extrabold tracking-tight">{APP_NAME}</span>
        {withTagline ? (
          <span className="text-caption text-muted-foreground mt-1">De la spec à la recette</span>
        ) : null}
      </span>
    </span>
  );
}
