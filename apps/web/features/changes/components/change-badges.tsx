import {
  CHANGE_NATURE_LABELS,
  CHANGE_PRIORITY_LABELS,
  CHANGE_STATUS_LABELS,
  type ChangeNature,
  type ChangePriority,
  type ChangeStatus,
} from "@regie/shared";
import { ArrowDown, ArrowUp, ChevronsUp, Equal, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Badge du statut d'une évolution. */
export function StatusBadge({ status }: { status: ChangeStatus }) {
  return (
    <Badge variant={status === "DRAFT" ? "outline" : "secondary"}>
      {CHANGE_STATUS_LABELS[status]}
    </Badge>
  );
}

/** Badge de la nature d'une évolution (évolution, correction…). */
export function NatureBadge({ nature }: { nature: ChangeNature }) {
  return (
    <Badge variant="outline" title={CHANGE_NATURE_LABELS[nature].hint}>
      {CHANGE_NATURE_LABELS[nature].label}
    </Badge>
  );
}

/** Icône de chaque priorité (la couleur reste neutre, sauf l'urgence). */
const PRIORITY_ICONS: Record<ChangePriority, LucideIcon> = {
  LOW: ArrowDown,
  MEDIUM: Equal,
  HIGH: ArrowUp,
  URGENT: ChevronsUp,
};

/**
 * Indicateur de priorité : icône + libellé pour les lecteurs d'écran.
 *
 * @param props.withLabel - Affiche aussi le libellé en clair
 */
export function PriorityIndicator({
  priority,
  withLabel = false,
}: {
  priority: ChangePriority;
  withLabel?: boolean;
}) {
  const Icon = PRIORITY_ICONS[priority];
  const label = CHANGE_PRIORITY_LABELS[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        priority === "URGENT" ? "text-destructive" : "text-muted-foreground",
      )}
      title={`Priorité ${label.toLowerCase()}`}
    >
      <Icon className="size-3.5" aria-hidden />
      {withLabel ? label : <span className="sr-only">Priorité {label.toLowerCase()}</span>}
    </span>
  );
}
