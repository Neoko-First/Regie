import type { Request } from "express";
import type { ClientContext } from "./auth.types";

/** Longueur maximale conservée du user agent (évite de stocker des en-têtes démesurés). */
const USER_AGENT_MAX_LENGTH = 512;

/**
 * Extrait l'appareil et l'IP de la requête (IP réelle transmise par le proxy BFF).
 *
 * @param req - Requête Express
 * @returns L'appareil, enregistré sur la session
 */
export function clientContext(req: Request): ClientContext {
  return {
    userAgent: req.headers["user-agent"]?.slice(0, USER_AGENT_MAX_LENGTH) ?? null,
    ip: req.ip ?? null,
  };
}
