"use client";

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { spaceMembersQuery, spacesQuery } from "../api";

/**
 * Espaces de l'utilisateur. À utiliser sous un <Suspense>.
 *
 * @returns Les espaces, avec les rôles de l'utilisateur
 */
export function useSpaces() {
  return useSuspenseQuery(spacesQuery()).data;
}

/**
 * Membres d'un espace (chargés à la demande, ex. à l'ouverture du formulaire d'édition).
 *
 * @param spaceKey - Clé de l'espace
 * @returns La requête TanStack (données, état de chargement)
 */
export function useSpaceMembers(spaceKey: string) {
  return useQuery(spaceMembersQuery(spaceKey));
}
