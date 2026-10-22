"use client";

import { CHANGE_STATUS_LABELS, type ChangeFilters, type ChangeSummary } from "@regie/shared";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui-extended/user-avatar";
import { isTempId } from "@/lib/optimistic";
import { cn } from "@/lib/utils";
import { BOARD_STATUSES } from "../constants";
import { useChanges } from "../hooks/use-changes";
import { NatureBadge, PriorityIndicator } from "./change-badges";
import { ChangeLink } from "./change-link";

/** Carte d'une évolution sur le board. */
function ChangeCard({ change }: { change: ChangeSummary }) {
  const pending = isTempId(change.id);
  return (
    <ChangeLink
      changeId={change.id}
      changeKey={change.key}
      className="focus-visible:ring-ring/50 block rounded-lg outline-none focus-visible:ring-3"
    >
      <Card
        className={cn(
          "hover:border-primary/40 gap-2 p-3 transition-colors",
          // Création en cours (optimiste) : état visuel discret
          pending && "opacity-60",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-mono text-xs">{change.key}</span>
          <PriorityIndicator priority={change.priority} />
        </div>
        <p className="line-clamp-3 text-sm font-medium">{change.title}</p>
        <div className="flex items-center justify-between gap-2">
          <NatureBadge nature={change.nature} />
          {change.assignee ? <UserAvatar user={change.assignee} /> : null}
        </div>
      </Card>
    </ChangeLink>
  );
}

/**
 * Board kanban : une colonne par statut. Les changements de statut se font depuis la page
 * de l'évolution (les gates demandent une confirmation explicite).
 *
 * @param props.filters - Filtres de la liste affichée
 */
export function ChangesBoard({ filters }: { filters: ChangeFilters }) {
  const changes = useChanges(filters);

  return (
    <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-4">
      {BOARD_STATUSES.map((status) => {
        const column = changes.filter((change) => change.status === status);
        return (
          <section
            key={status}
            aria-label={CHANGE_STATUS_LABELS[status]}
            className="bg-muted/40 flex w-72 shrink-0 flex-col gap-2 rounded-xl p-2"
          >
            <header className="flex items-center justify-between px-1 py-0.5">
              <h2 className="text-sm font-medium">{CHANGE_STATUS_LABELS[status]}</h2>
              <span className="text-muted-foreground text-xs">{column.length}</span>
            </header>
            <ul className="flex flex-col gap-2">
              {column.map((change) => (
                <li key={change.id}>
                  <ChangeCard change={change} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
