"use client";

import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api";
import { LOGIN_PATH } from "../lib/safe-redirect";

/** Quitte l'application : navigation complète, qui vide le cache de la session terminée. */
function leaveToLogin(): void {
  window.location.assign(LOGIN_PATH);
}

/**
 * Déconnexion de l'appareil courant. Aboutit toujours côté client, même si l'API échoue :
 * l'utilisateur qui veut se déconnecter ne doit jamais rester bloqué.
 *
 * @returns La mutation de déconnexion
 */
export function useLogout() {
  return useMutation({
    mutationFn: authApi.logout,
    meta: { skipGlobalErrorToast: true },
    onSettled: leaveToLogin,
  });
}

/**
 * Déconnexion de tous les appareils (révocation de toutes les sessions). Action critique,
 * non optimiste : déclenchée depuis une `ConfirmDialog` qui attend sa fin.
 *
 * @returns La mutation de déconnexion globale
 */
export function useLogoutAll() {
  return useMutation({
    mutationFn: authApi.logoutAll,
    onSuccess: leaveToLogin,
  });
}
