import { cva, type VariantProps } from "class-variance-authority";
import { CircleCheck, Info, type LucideIcon, OctagonAlert, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Tons du Callout (design system) : fond du ton à ~9 % et contour à ~35 % sur la surface,
 * texte toujours en `foreground` pour garder le contraste.
 */
const calloutVariants = cva(
  "grid grid-cols-[1.25rem_1fr] gap-x-3 gap-y-1 rounded-control border p-4",
  {
    variants: {
      tone: {
        info: "bg-info/10 border-info/35 [&_[data-slot=callout-icon]]:text-info",
        warning: "bg-warning/10 border-warning/35 [&_[data-slot=callout-icon]]:text-warning",
        success: "bg-success/10 border-success/35 [&_[data-slot=callout-icon]]:text-success",
        destructive:
          "bg-destructive/10 border-destructive/35 [&_[data-slot=callout-icon]]:text-destructive",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

type CalloutTone = NonNullable<VariantProps<typeof calloutVariants>["tone"]>;

/** Titre et icône par défaut de chaque ton (vocabulaire du design system). */
const TONE_DEFAULTS: Record<CalloutTone, { title: string; icon: LucideIcon }> = {
  info: { title: "Astuce", icon: Info },
  warning: { title: "Attention", icon: TriangleAlert },
  success: { title: "Vérifié", icon: CircleCheck },
  destructive: { title: "Risque", icon: OctagonAlert },
};

/** Propriétés du Callout. */
export interface CalloutProps {
  tone?: CalloutTone;
  /** Titre d'un ou deux mots (par défaut : Astuce, Attention, Vérifié, Risque) */
  title?: string;
  /** Une à trois phrases */
  children: ReactNode;
  className?: string;
}

/**
 * Encadré qui fait ressortir une information (design system, composant Callout).
 * Au plus un par section. Le sens est porté par le titre et l'icône, pas par la couleur seule.
 *
 * @example
 * <Callout tone="warning" title="Copiez ce jeton maintenant">Il ne sera plus affiché.</Callout>
 */
export function Callout({ tone = "info", title, children, className }: CalloutProps) {
  const { title: defaultTitle, icon: Icon } = TONE_DEFAULTS[tone];
  return (
    <div
      role={tone === "destructive" || tone === "warning" ? "alert" : "note"}
      className={cn(calloutVariants({ tone }), className)}
    >
      <Icon data-slot="callout-icon" className="row-span-2 mt-0.5 size-5" aria-hidden />
      <p className="text-label text-foreground">{title ?? defaultTitle}</p>
      <div className="text-body-sm text-foreground">{children}</div>
    </div>
  );
}
