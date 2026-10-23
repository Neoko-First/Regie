import type { MutationFunctionContext, QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "./api-client";
import { notifyError } from "./notify";

// Cycle de mutation optimiste factorisé (CLAUDE.md §6.3) :
// onMutate (snapshot + mise à jour immédiate) → onError (rollback + toast)
// → onSuccess (toast) → onSettled (resynchronisation avec le serveur).

/** Préfixe des identifiants temporaires attribués aux éléments créés de façon optimiste. */
const TEMP_ID_PREFIX = "temp-";

/**
 * Génère un identifiant temporaire pour un élément créé de façon optimiste,
 * remplacé par l'id réel lors de la resynchronisation.
 *
 * @returns Un identifiant unique préfixé
 * @example createTempId() // "temp-3b241101-e2bb-4255-8caf-4136c566a962"
 */
export function createTempId(): string {
  return `${TEMP_ID_PREFIX}${crypto.randomUUID()}`;
}

/**
 * Indique si un identifiant est temporaire (élément en cours de création),
 * pour afficher un état visuel « en cours » discret.
 *
 * @param id - Identifiant à tester
 * @returns `true` si l'élément n'est pas encore confirmé par le serveur
 */
export function isTempId(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX);
}

/** Contexte transmis de `onMutate` aux callbacks suivants : l'état du cache avant la mutation. */
export interface OptimisticSnapshot<TData> {
  previous: TData | undefined;
}

/** Options du helper `optimisticHandlers`. */
export interface OptimisticOptions<TData, TVariables> {
  /** Clé du cache à mettre à jour immédiatement */
  queryKey: QueryKey;
  /** Applique la modification attendue sur les données en cache */
  updater: (old: TData | undefined, variables: TVariables) => TData;
  /** Textes des toasts ; sans `error`, le message renvoyé par l'API est affiché */
  messages: { success: string; error?: string };
  /** Clés supplémentaires à resynchroniser après la mutation (ex. listes dépendantes) */
  invalidateKeys?: QueryKey[];
}

/**
 * Génère les callbacks d'une mutation optimiste standardisée, à étaler dans `useMutation`.
 *
 * @param options - Clé du cache, fonction de mise à jour et messages
 * @returns `meta`, `onMutate`, `onError`, `onSuccess` et `onSettled`
 * @example
 * useMutation({
 *   mutationFn: (input: RenameInput) => apiClient.patch(`/changes/${id}`, input),
 *   ...optimisticHandlers<Change, RenameInput>({
 *     queryKey: queryKeys.changes.detail(id),
 *     updater: (old, input) => ({ ...old!, ...input }),
 *     messages: { success: "Évolution renommée" },
 *   }),
 * });
 */
export function optimisticHandlers<TData, TVariables>({
  queryKey,
  updater,
  messages,
  invalidateKeys = [],
}: OptimisticOptions<TData, TVariables>) {
  return {
    // Le toast d'erreur est géré ici (après rollback) : on coupe le toast global
    meta: { skipGlobalErrorToast: true },

    onMutate: async (
      variables: TVariables,
      { client }: MutationFunctionContext,
    ): Promise<OptimisticSnapshot<TData>> => {
      // Stoppe les refetch en cours pour qu'ils n'écrasent pas la mise à jour optimiste
      await client.cancelQueries({ queryKey });
      // Snapshot pour pouvoir revenir en arrière en cas d'échec
      const previous = client.getQueryData<TData>(queryKey);
      // Mise à jour immédiate de l'UI, avant la réponse du serveur
      client.setQueryData<TData>(queryKey, (old) => updater(old, variables));
      return { previous };
    },

    onError: (
      error: unknown,
      _variables: TVariables,
      snapshot: OptimisticSnapshot<TData> | undefined,
      { client }: MutationFunctionContext,
    ) => {
      // Rollback : on restaure l'état d'avant la mutation
      client.setQueryData(queryKey, snapshot?.previous);
      notifyError(messages.error ?? getErrorMessage(error));
    },

    onSuccess: () => {
      toast.success(messages.success);
    },

    onSettled: async (
      _data: unknown,
      _error: unknown,
      _variables: TVariables,
      _snapshot: OptimisticSnapshot<TData> | undefined,
      { client }: MutationFunctionContext,
    ) => {
      // Dans tous les cas, on resynchronise avec la vérité serveur (id réel, champs calculés…)
      await Promise.all(
        [queryKey, ...invalidateKeys].map((key) => client.invalidateQueries({ queryKey: key })),
      );
    },
  };
}
