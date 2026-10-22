"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { meQuery } from "../api";

/**
 * Utilisateur connecté. Suspend jusqu'à disposer des données (préchargées côté serveur
 * dans le layout de l'application) : à utiliser sous un <Suspense>.
 *
 * @returns L'utilisateur connecté
 */
export function useCurrentUser() {
  return useSuspenseQuery(meQuery()).data;
}
