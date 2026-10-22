"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  type ActivityItem,
  CHANGE_STATUS_LABELS,
  type ChangeStatus,
  type CreateCommentInput,
  createCommentSchema,
  GATE_LABELS,
  type Gate,
} from "@regie/shared";
import { MessageSquare, RotateCcw, Send, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/ui-extended/form-fields";
import { Markdown } from "@/components/ui-extended/markdown";
import { UserAvatar } from "@/components/ui-extended/user-avatar";
import { formatDateTime, formatRelative } from "@/lib/format";
import { isTempId } from "@/lib/optimistic";
import { cn } from "@/lib/utils";
import { useActivity, useAddComment, useComments, useRevisions } from "../hooks/use-history";

/** Date relative avec la date exacte au survol. */
function When({ date }: { date: string }) {
  return (
    <time dateTime={date} title={formatDateTime(date)} suppressHydrationWarning>
      {formatRelative(date)}
    </time>
  );
}

/**
 * Discussion d'une évolution : commentaires (markdown) et ajout d'un commentaire.
 *
 * @param props.canComment - Faux en lecture seule
 */
export function CommentsPanel({
  changeKey,
  canComment,
}: {
  changeKey: string;
  canComment: boolean;
}) {
  const comments = useComments(changeKey);
  const addComment = useAddComment(changeKey);
  const form = useForm<CreateCommentInput>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: { body: "" },
  });
  const { isDirty } = form.formState;

  const submit = form.handleSubmit((values) => {
    // Optimiste : le commentaire s'affiche tout de suite, le champ est vidé
    addComment.mutate(values);
    form.reset();
  });

  return (
    <div className="flex flex-col gap-4">
      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucun commentaire pour l’instant.</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {comments.map((comment) => (
            <li key={comment.id} className={cn("flex gap-3", isTempId(comment.id) && "opacity-60")}>
              <UserAvatar user={comment.author} className="size-7" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm">
                  <strong className="font-medium">{comment.author.name}</strong>{" "}
                  <span className="text-muted-foreground text-xs">
                    <When date={comment.createdAt} />
                  </span>
                </span>
                <Markdown>{comment.body}</Markdown>
              </div>
            </li>
          ))}
        </ol>
      )}

      {canComment ? (
        <form onSubmit={submit} noValidate className="flex flex-col gap-2">
          <TextareaField
            control={form.control}
            name="body"
            label="Ajouter un commentaire"
            description="Markdown accepté."
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!isDirty}
              onClick={() => form.reset()}
            >
              <RotateCcw /> Annuler
            </Button>
            <Button type="submit" variant="success" size="sm" disabled={!isDirty}>
              <Send /> Publier
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

/** Phrase décrivant un événement de l'historique. */
function describeActivity(activity: ActivityItem): string {
  const data = activity.data;
  switch (activity.type) {
    case "CREATED":
      return "a créé l’évolution";
    case "UPDATED":
      return "a modifié l’évolution";
    case "COMMENTED":
      return "a commenté";
    case "STATUS_CHANGED":
      return `a passé l’évolution de « ${CHANGE_STATUS_LABELS[data.from as ChangeStatus]} » à « ${
        CHANGE_STATUS_LABELS[data.to as ChangeStatus]
      } »`;
    case "GATE_APPROVED":
      return `a validé le ${GATE_LABELS[data.gate as Gate]} (révision r${String(data.revision)})`;
  }
}

/**
 * Historique : révisions figées par les gates, puis journal des événements.
 */
export function HistoryPanel({ changeKey }: { changeKey: string }) {
  const activity = useActivity(changeKey);
  const revisions = useRevisions(changeKey);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Révisions validées</h3>
        {revisions.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun gate validé pour l’instant.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {revisions.map((revision) => (
              <li key={revision.number} className="flex items-start gap-2 text-sm">
                <ShieldCheck className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <strong className="font-medium">r{revision.number}</strong> ·{" "}
                  {GATE_LABELS[revision.gate]} · validé par {revision.approvedBy.name},{" "}
                  <When date={revision.createdAt} />
                  {revision.comment ? (
                    <span className="text-muted-foreground block">« {revision.comment} »</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Activité</h3>
        <ol className="flex flex-col gap-3">
          {activity.map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-sm">
              {item.type === "COMMENTED" ? (
                <MessageSquare
                  className="text-muted-foreground mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
              ) : (
                <UserAvatar user={item.actor} className="size-5" />
              )}
              <span>
                <strong className="font-medium">{item.actor.name}</strong> {describeActivity(item)}
                <span className="text-muted-foreground">
                  {" · "}
                  <When date={item.createdAt} />
                </span>
                {typeof item.data.comment === "string" && item.data.comment ? (
                  <span className="text-muted-foreground block">« {item.data.comment} »</span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
