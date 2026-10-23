"use client";

import type { ChangeFilters, ChangeSummary } from "@regie/shared";
import { SquareKanban } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/ui-extended/user-avatar";
import { formatRelative } from "@/lib/format";
import { isTempId } from "@/lib/optimistic";
import { cn } from "@/lib/utils";
import { useChanges } from "../hooks/use-changes";
import { NatureBadge, PriorityIndicator, StatusBadge } from "./change-badges";
import { ChangeLink } from "./change-link";

/**
 * Tableau d'évolutions (vue liste, Ma boîte).
 *
 * @param props.changes - Évolutions à afficher
 * @param props.emptyText - Message quand la liste est vide
 */
export function ChangesTableView({
  changes,
  emptyText,
}: {
  changes: ChangeSummary[];
  emptyText: string;
}) {
  if (changes.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SquareKanban />
          </EmptyMedia>
          <EmptyTitle>Aucune évolution</EmptyTitle>
          <EmptyDescription>{emptyText}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28">Identifiant</TableHead>
          <TableHead>Titre</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Nature</TableHead>
          <TableHead>Priorité</TableHead>
          <TableHead>Assigné</TableHead>
          <TableHead className="text-right">Modifiée</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {changes.map((change) => (
          <TableRow key={change.id} className={cn(isTempId(change.id) && "opacity-60")}>
            <TableCell className="text-muted-foreground font-mono text-xs">{change.key}</TableCell>
            <TableCell className="max-w-md truncate font-medium">
              <ChangeLink changeId={change.id} changeKey={change.key} className="hover:underline">
                {change.title}
              </ChangeLink>
            </TableCell>
            <TableCell>
              <StatusBadge status={change.status} />
            </TableCell>
            <TableCell>
              <NatureBadge nature={change.nature} />
            </TableCell>
            <TableCell>
              <PriorityIndicator priority={change.priority} withLabel />
            </TableCell>
            <TableCell>
              {change.assignee ? (
                <span className="flex items-center gap-2">
                  <UserAvatar user={change.assignee} />
                  <span className="truncate text-sm">{change.assignee.name}</span>
                </span>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground text-right text-xs">
              <time dateTime={change.updatedAt} suppressHydrationWarning>
                {formatRelative(change.updatedAt)}
              </time>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Vue liste de la page Évolutions. */
export function ChangesTable({ filters }: { filters: ChangeFilters }) {
  const changes = useChanges(filters);
  return (
    <div className="p-4">
      <ChangesTableView
        changes={changes}
        emptyText="Aucune évolution ne correspond à ces filtres."
      />
    </div>
  );
}
