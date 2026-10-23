"use client";

import {
  type Active,
  type Announcements,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  CHANGE_STATUS_LABELS,
  type ChangeFilters,
  type ChangeStatus,
  type ChangeSummary,
  type SpaceRole,
} from "@regie/shared";
import { ShieldCheck } from "lucide-react";
import { type ComponentProps, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui-extended/user-avatar";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useSpaces } from "@/features/spaces/hooks/use-spaces";
import { isTempId } from "@/lib/optimistic";
import { cn } from "@/lib/utils";
import { BOARD_STATUSES } from "../constants";
import { useChanges } from "../hooks/use-changes";
import { useBoardTransition } from "../hooks/use-transition";
import { type BoardDrop, resolveBoardDrop } from "../lib/board-drop";
import { NatureBadge, PriorityIndicator } from "./change-badges";
import { ChangeLink } from "./change-link";
import { type ConfirmableTransition, TransitionDialog } from "./transition-dialog";

/** Déplacement minimal (px) avant de démarrer un glisser : en dessous, c'est un clic. */
const DRAG_ACTIVATION_DISTANCE_PX = 6;

/** Décalage vertical de la carte dans la colonne visée au clavier (sous l'en-tête). */
const KEYBOARD_DROP_OFFSET_PX = 48;

/** Touches du glisser au clavier : Espace saisit ; Espace ou Entrée dépose ; Échap annule. */
const KEYBOARD_CODES = { start: ["Space"], end: ["Space", "Enter"], cancel: ["Escape"] };

/** Consigne lue par les lecteurs d'écran sur chaque carte déplaçable. */
const SCREEN_READER_INSTRUCTIONS =
  "Pour changer le statut, appuyez sur Espace, choisissez la colonne avec les flèches gauche et droite, puis appuyez de nouveau sur Espace. Échap annule. Entrée ouvre l'évolution.";

/** Évolution portée par l'élément glissé (données attachées à `useDraggable`). */
function draggedChange(active: Active | null): ChangeSummary | undefined {
  const data: unknown = active?.data.current;
  if (data && typeof data === "object" && "change" in data) {
    return (data as { change: ChangeSummary }).change;
  }
  return undefined;
}

/** Statut d'une colonne de dépôt (identifiant du droppable). */
function columnStatus(id: string | number | undefined): ChangeStatus | undefined {
  return BOARD_STATUSES.find((status) => status === id);
}

/**
 * Glisser au clavier : les flèches gauche et droite sautent d'une colonne à la voisine
 * (le déplacement pixel par pixel par défaut n'a pas de sens sur un board).
 */
const columnKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
  const step = event.code === "ArrowRight" ? 1 : event.code === "ArrowLeft" ? -1 : 0;
  const { active, collisionRect, droppableRects, droppableContainers, over } = context;
  if (step === 0 || !active || !collisionRect) return undefined;
  event.preventDefault();

  const columns = droppableContainers
    .getEnabled()
    .flatMap((container) => {
      const rect = droppableRects.get(container.id);
      return rect ? [{ id: container.id, rect }] : [];
    })
    .sort((a, b) => a.rect.left - b.rect.left);
  const currentId = over?.id ?? draggedChange(active)?.status;
  const next = columns[columns.findIndex((column) => column.id === currentId) + step];
  if (!next) return undefined;
  return {
    x: next.rect.left + (next.rect.width - collisionRect.width) / 2,
    y: next.rect.top + KEYBOARD_DROP_OFFSET_PX,
  };
};

/** Carte d'une évolution sur le board. */
function ChangeCard({
  change,
  linkProps,
}: {
  change: ChangeSummary;
  /** Écouteurs et attributs du glisser, posés sur le lien (un seul arrêt de tabulation) */
  linkProps?: Partial<ComponentProps<typeof ChangeLink>>;
}) {
  const pending = isTempId(change.id);
  return (
    <ChangeLink
      changeId={change.id}
      changeKey={change.key}
      // Sans cela, le navigateur lance son propre glisser de lien et coupe celui du board
      draggable={false}
      className="focus-visible:ring-ring/50 block rounded-lg outline-none focus-visible:ring-3"
      {...linkProps}
    >
      <Card
        className={cn(
          "hover:border-primary/40 gap-2 p-3 transition-colors",
          // Création en cours (optimiste) : état visuel discret
          pending && "opacity-60",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-code-sm">{change.key}</span>
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

/** Carte déplaçable. Une carte en cours de création (id temporaire) ne se déplace pas. */
function DraggableCard({ change }: { change: ChangeSummary }) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: change.id,
    data: { change },
    disabled: isTempId(change.id),
  });
  return (
    <li ref={setNodeRef} className={cn("touch-manipulation", isDragging && "opacity-40")}>
      <ChangeCard
        change={change}
        linkProps={{
          ref: setActivatorNodeRef,
          ...listeners,
          // Le lien garde son rôle de lien : on ne reprend que la description du glisser
          "aria-describedby": attributes["aria-describedby"],
          "aria-roledescription": "évolution déplaçable",
        }}
      />
    </li>
  );
}

/** Colonne d'un statut, zone de dépôt. Pendant un glisser, indique si le dépôt y est permis. */
function BoardColumn({
  status,
  count,
  drop,
  children,
}: {
  status: ChangeStatus;
  count: number;
  /** Effet d'un dépôt dans cette colonne pour la carte en cours de glisser (sinon `null`) */
  drop: BoardDrop | null;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const accepts = drop?.kind === "move" || drop?.kind === "confirm";
  const isGate = drop?.kind === "confirm" && Boolean(drop.transition.gate);

  return (
    <section
      ref={setNodeRef}
      aria-label={CHANGE_STATUS_LABELS[status]}
      className={cn(
        "bg-muted rounded-card flex w-72 shrink-0 flex-col gap-2 p-2 outline-2 -outline-offset-2 outline-transparent transition-[outline-color,background-color,opacity] motion-reduce:transition-none",
        accepts && "outline-primary/40 outline-dashed",
        accepts && isOver && "bg-accent outline-primary outline-solid",
        drop?.kind === "forbidden" && "opacity-50",
      )}
    >
      <header className="flex items-center justify-between gap-2 px-1 py-0.5">
        <h2 className="text-label">{CHANGE_STATUS_LABELS[status]}</h2>
        {isGate ? (
          <span className="text-caption text-primary flex items-center gap-1">
            <ShieldCheck className="size-3.5" aria-hidden /> Validation
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">{count}</span>
        )}
      </header>
      <ul className="flex min-h-16 flex-col gap-2">{children}</ul>
    </section>
  );
}

/** Transition à confirmer après un dépôt (gate ou renvoi). */
interface PendingConfirmation {
  change: ChangeSummary;
  transition: ConfirmableTransition;
}

/**
 * Board kanban : une colonne par statut. Glisser une carte dans une autre colonne change son
 * statut, à la souris, au doigt ou au clavier. Seules les colonnes autorisées par le workflow
 * (et les rôles de l'utilisateur) acceptent la carte. Une transition simple est appliquée
 * tout de suite (optimiste, avec retour en arrière si l'API refuse) ; un gate ou un renvoi
 * ouvre d'abord une confirmation. Un clic ouvre toujours l'évolution.
 *
 * @param props.filters - Filtres de la liste affichée
 */
export function ChangesBoard({ filters }: { filters: ChangeFilters }) {
  const changes = useChanges(filters);
  const me = useCurrentUser();
  const spaces = useSpaces();
  const move = useBoardTransition(filters);
  const [active, setActive] = useState<ChangeSummary | null>(null);
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE_PX } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: columnKeyboardCoordinates,
      keyboardCodes: KEYBOARD_CODES,
    }),
  );

  /** Effet du dépôt d'une évolution dans une colonne, pour l'utilisateur connecté. */
  const resolve = useMemo(() => {
    const rolesBySpace = new Map<string, readonly SpaceRole[]>(
      spaces.map((space) => [space.key, space.myRoles]),
    );
    return (change: ChangeSummary, target: ChangeStatus) =>
      resolveBoardDrop(change, target, {
        userId: me.id,
        roles: rolesBySpace.get(change.spaceKey) ?? [],
      });
  }, [me.id, spaces]);

  /** Annonces des lecteurs d'écran, en français. */
  const announcements = useMemo<Announcements>(() => {
    const describeOver = (change: ChangeSummary, overId: string | number) => {
      const status = columnStatus(overId);
      if (!status) return "";
      const drop = resolve(change, status);
      const label = `« ${CHANGE_STATUS_LABELS[status]} »`;
      if (drop.kind === "forbidden") return `${label} : ${drop.reason}`;
      if (drop.kind === "confirm") return `${label} : confirmation demandée au dépôt.`;
      return label;
    };
    return {
      onDragStart: ({ active: item }) => {
        const change = draggedChange(item);
        return change
          ? `${change.key} saisie, colonne « ${CHANGE_STATUS_LABELS[change.status]} ».`
          : "";
      },
      onDragOver: ({ active: item, over }) => {
        const change = draggedChange(item);
        if (!change) return "";
        return over
          ? `${change.key} au-dessus de ${describeOver(change, over.id)}`
          : `${change.key} hors des colonnes.`;
      },
      onDragEnd: ({ active: item, over }) => {
        const change = draggedChange(item);
        if (!change) return "";
        const status = columnStatus(over?.id);
        return status
          ? `${change.key} déposée dans « ${CHANGE_STATUS_LABELS[status]} ».`
          : `${change.key} relâchée hors des colonnes.`;
      },
      onDragCancel: ({ active: item }) => {
        const change = draggedChange(item);
        return change ? `Déplacement de ${change.key} annulé.` : "";
      },
    };
  }, [resolve]);

  function handleDragStart({ active: item }: DragStartEvent) {
    setActive(draggedChange(item) ?? null);
  }

  function handleDragEnd({ active: item, over }: DragEndEvent) {
    setActive(null);
    const change = draggedChange(item);
    const target = columnStatus(over?.id);
    if (!change || !target) return;

    const drop = resolve(change, target);
    if (drop.kind === "forbidden") toast.warning(drop.reason);
    if (drop.kind === "move") move.mutate({ change, transition: drop.transition });
    if (drop.kind === "confirm") setConfirmation({ change, transition: drop.transition });
  }

  return (
    <DndContext
      sensors={sensors}
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: SCREEN_READER_INSTRUCTIONS },
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActive(null)}
    >
      {/* relative : les textes sr-only (absolus) des cartes restent dans la zone qui défile,
          sinon ils élargissent toute la page */}
      <div className="relative flex min-h-0 flex-1 gap-3 overflow-x-auto p-4">
        {BOARD_STATUSES.map((status) => {
          const column = changes.filter((change) => change.status === status);
          return (
            <BoardColumn
              key={status}
              status={status}
              count={column.length}
              drop={active ? resolve(active, status) : null}
            >
              {column.map((change) => (
                <DraggableCard key={change.id} change={change} />
              ))}
            </BoardColumn>
          );
        })}
      </div>
      {/* Copie de la carte qui suit le pointeur ; la carte d'origine reste en place, estompée */}
      <DragOverlay dropAnimation={null}>
        {active ? (
          <div className="rotate-2 cursor-grabbing shadow-lg motion-reduce:rotate-0">
            <ChangeCard change={active} />
          </div>
        ) : null}
      </DragOverlay>
      {confirmation ? (
        <TransitionDialog
          change={confirmation.change}
          transition={confirmation.transition}
          onClose={() => setConfirmation(null)}
        />
      ) : null}
    </DndContext>
  );
}
