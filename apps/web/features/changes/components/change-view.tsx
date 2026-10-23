"use client";

import {
  CONTRIBUTOR_ROLES,
  hasAnyRole,
  LOCKED_CHANGE_STATUSES,
  type ChangeDetail,
} from "@regie/shared";
import { FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui-extended/confirm-dialog";
import { Markdown } from "@/components/ui-extended/markdown";
import { UserAvatar } from "@/components/ui-extended/user-avatar";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { formatDateTime } from "@/lib/format";
import { useChange, useDeleteChange } from "../hooks/use-changes";
import { NatureBadge, PriorityIndicator, StatusBadge } from "./change-badges";
import { CommentsPanel, HistoryPanel } from "./change-history";
import { EditChangeDialog, EditMarkdownDialog, type MarkdownField } from "./edit-change-dialog";
import { TransitionActions } from "./transition-actions";

/** Onglets de contenu markdown, dans l'ordre du cycle Spec Kit. */
const MARKDOWN_TABS: ReadonlyArray<{ field: MarkdownField; label: string; empty: string }> = [
  { field: "proposal", label: "Proposal", empty: "Le pourquoi et le quoi de l’évolution." },
  { field: "plan", label: "Plan", empty: "Le comment technique, rédigé en conception." },
  { field: "tasks", label: "Tasks", empty: "Le plan découpé en étapes exécutables." },
];

/** Contenu d'un onglet markdown, avec son bouton de modification. */
function MarkdownTab({
  change,
  field,
  label,
  empty,
  canEdit,
}: {
  change: ChangeDetail;
  field: MarkdownField;
  label: string;
  empty: string;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const content = change[field];

  return (
    <div className="flex flex-col gap-3">
      {content.trim() ? (
        <>
          {canEdit ? (
            <Button
              variant="outline"
              size="sm"
              className="self-end"
              onClick={() => setEditing(true)}
            >
              <Pencil /> Modifier
            </Button>
          ) : null}
          <Markdown>{content}</Markdown>
        </>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>{label} vide</EmptyTitle>
            <EmptyDescription>{empty}</EmptyDescription>
          </EmptyHeader>
          {canEdit ? (
            <EmptyContent>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil /> Rédiger
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      )}
      <EditMarkdownDialog
        change={change}
        field={field}
        label={label}
        open={editing}
        onOpenChange={setEditing}
      />
    </div>
  );
}

/** Ligne « libellé : valeur » de l'en-tête. */
function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="flex items-center gap-2 text-sm">{children}</dd>
    </div>
  );
}

/** Squelette d'un onglet chargé à la demande. */
function TabSkeleton() {
  return <Skeleton className="h-32 w-full" />;
}

/**
 * Page d'une évolution : en-tête (champs + actions de workflow en haut à droite),
 * onglets Proposal · Plan · Tasks · Discussion · Historique (REGIE.md §11).
 */
export function ChangeView({ changeKey }: { changeKey: string }) {
  const change = useChange(changeKey);
  const me = useCurrentUser();
  const deleteChange = useDeleteChange(changeKey);
  const [editingInfo, setEditingInfo] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isContributor = hasAnyRole(change.myRoles, CONTRIBUTOR_ROLES);
  const canEdit = isContributor && !LOCKED_CHANGE_STATUSES.includes(change.status);
  const canDelete =
    change.status === "DRAFT" && (change.author.id === me.id || change.myRoles.includes("ADMIN"));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-muted-foreground font-mono text-sm">{change.key}</span>
            <h2 className="text-xl font-semibold">{change.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <TransitionActions change={change} />
            {canEdit || canDelete ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Plus d'actions">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit ? (
                    <DropdownMenuItem onSelect={() => setEditingInfo(true)}>
                      <Pencil /> Modifier les informations
                    </DropdownMenuItem>
                  ) : null}
                  {canEdit && canDelete ? <DropdownMenuSeparator /> : null}
                  {canDelete ? (
                    <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                      <Trash2 /> Supprimer le brouillon
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>

        <dl className="bg-muted/40 grid grid-cols-2 gap-4 rounded-lg p-4 sm:grid-cols-3 lg:grid-cols-6">
          <Meta label="Statut">
            <StatusBadge status={change.status} />
          </Meta>
          <Meta label="Nature">
            <NatureBadge nature={change.nature} />
          </Meta>
          <Meta label="Priorité">
            <PriorityIndicator priority={change.priority} withLabel />
          </Meta>
          <Meta label="Assigné">
            {change.assignee ? (
              <>
                <UserAvatar user={change.assignee} /> {change.assignee.name}
              </>
            ) : (
              <span className="text-muted-foreground">Personne</span>
            )}
          </Meta>
          <Meta label="Auteur">
            <UserAvatar user={change.author} /> {change.author.name}
          </Meta>
          <Meta label="Révision">
            {change.revision > 0 ? `r${change.revision}` : "Aucune"}
            <span className="text-muted-foreground text-xs" suppressHydrationWarning>
              · {formatDateTime(change.updatedAt)}
            </span>
          </Meta>
        </dl>
      </header>

      <Tabs defaultValue="proposal">
        {/* Sur petit écran, les onglets défilent au lieu d'élargir la page */}
        <TabsList className="max-w-full justify-start overflow-x-auto">
          {MARKDOWN_TABS.map((tab) => (
            <TabsTrigger key={tab.field} value={tab.field}>
              {tab.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>
        {MARKDOWN_TABS.map((tab) => (
          <TabsContent key={tab.field} value={tab.field} className="pt-4">
            <MarkdownTab change={change} {...tab} canEdit={canEdit} />
          </TabsContent>
        ))}
        <TabsContent value="discussion" className="pt-4">
          <Suspense fallback={<TabSkeleton />}>
            <CommentsPanel changeKey={change.key} canComment={isContributor} />
          </Suspense>
        </TabsContent>
        <TabsContent value="history" className="pt-4">
          <Suspense fallback={<TabSkeleton />}>
            <HistoryPanel changeKey={change.key} />
          </Suspense>
        </TabsContent>
      </Tabs>

      {canEdit ? (
        <EditChangeDialog change={change} open={editingInfo} onOpenChange={setEditingInfo} />
      ) : null}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Supprimer ce brouillon ?"
        description={
          <>
            Le brouillon <strong>{change.key}</strong> « {change.title} » sera supprimé.
          </>
        }
        onConfirm={() => deleteChange.mutateAsync()}
      />
    </main>
  );
}
