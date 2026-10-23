import { APP_LOCALE, APP_TIMEZONE } from "@regie/shared";

// Formatage des dates côté API (contenu des emails) : français, fuseau Europe/Paris.

const dateFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Formate une date avec l'heure, comme `formatDateTime` du front.
 *
 * @param date - Date à formater
 * @returns La date, ex. « 23/10/2026 à 14:35 »
 * @example formatDateTimeFr(new Date("2026-10-23T12:35:00Z")) // "23/10/2026 à 14:35"
 */
export function formatDateTimeFr(date: Date): string {
  return `${dateFormatter.format(date)} à ${timeFormatter.format(date)}`;
}
