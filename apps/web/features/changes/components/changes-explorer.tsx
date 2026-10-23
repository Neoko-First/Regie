"use client";

import { Columns3, List, UserRound } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSpaces } from "@/features/spaces/hooks/use-spaces";
import { cn } from "@/lib/utils";
import { CHANGE_VIEWS, type ChangeView } from "../constants";
import { parseChangeFilters } from "../lib/filters";
import { ChangesBoard } from "./changes-board";
import { ChangesTable } from "./changes-table";

/** Valeur technique de l'option « Tous les espaces » (Radix Select refuse la chaîne vide). */
const ALL_SPACES = "__all__";

/**
 * Page Évolutions côté client : filtres (dans l'URL, partageables), choix de la vue
 * board / liste, et affichage. Les données sont préchargées par le serveur.
 */
export function ChangesExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { filters, view } = parseChangeFilters(searchParams);
  const spaces = useSpaces();
  // Transition React : l'affichage actuel reste visible pendant le chargement des nouveaux filtres
  const [isPending, startTransition] = useTransition();

  /** Met à jour un paramètre d'URL (une valeur vide le retire). */
  function setParam(name: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value);
    else next.delete(name);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
        <Select
          value={filters.space ?? ALL_SPACES}
          onValueChange={(value) => setParam("space", value === ALL_SPACES ? null : value)}
        >
          <SelectTrigger size="sm" className="w-48" aria-label="Filtrer par espace">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SPACES}>Tous les espaces</SelectItem>
            {spaces.map((space) => (
              <SelectItem key={space.key} value={space.key}>
                {space.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Toggle
          size="sm"
          variant="outline"
          pressed={filters.assignee === "me"}
          onPressedChange={(pressed) => setParam("assignee", pressed ? "me" : null)}
        >
          <UserRound /> Assignées à moi
        </Toggle>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          className="ml-auto"
          value={view}
          onValueChange={(value: ChangeView | "") =>
            value && setParam("view", value === CHANGE_VIEWS.board ? null : value)
          }
          aria-label="Affichage"
        >
          <ToggleGroupItem value={CHANGE_VIEWS.board} aria-label="Vue board">
            <Columns3 /> Board
          </ToggleGroupItem>
          <ToggleGroupItem value={CHANGE_VIEWS.list} aria-label="Vue liste">
            <List /> Liste
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div
        className={cn("flex min-h-0 flex-1 flex-col transition-opacity", isPending && "opacity-60")}
      >
        {view === CHANGE_VIEWS.list ? (
          <ChangesTable filters={filters} />
        ) : (
          <ChangesBoard filters={filters} />
        )}
      </div>
    </div>
  );
}
