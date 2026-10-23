import { TZDate } from "@date-fns/tz";
import { APP_LOCALE, APP_TIMEZONE } from "@regie/shared";
import {
  differenceInHours,
  format,
  formatDistance,
  formatRelative as dateFnsFormatRelative,
} from "date-fns";
import { fr } from "date-fns/locale";

// Point d'entrée UNIQUE pour formater dates et nombres (CLAUDE.md §2).
// Les dates sont stockées en UTC et toujours affichées dans le fuseau Europe/Paris.

/** Valeur de date acceptée : objet Date ou chaîne ISO renvoyée par l'API. */
export type DateInput = Date | string;

/** En dessous de ce délai, `formatRelative` affiche une durée (« il y a 5 minutes »). */
const RELATIVE_DISTANCE_MAX_HOURS = 12;

/** Convertit une date en date « vue depuis Paris », quel que soit le fuseau du poste ou du serveur. */
function toParis(date: DateInput): TZDate {
  return new TZDate(new Date(date), APP_TIMEZONE);
}

/**
 * Formate une date courte.
 *
 * @param date - Date ou chaîne ISO
 * @returns La date au format jj/mm/aaaa
 * @example formatDate("2026-10-22T09:00:00Z") // "22/10/2026"
 */
export function formatDate(date: DateInput): string {
  return format(toParis(date), "dd/MM/yyyy", { locale: fr });
}

/**
 * Formate une date longue, avec le jour de la semaine (en minuscules, convention française).
 *
 * @param date - Date ou chaîne ISO
 * @returns La date en toutes lettres
 * @example formatDateLong("2026-10-22T09:00:00Z") // "jeudi 22 octobre 2026"
 */
export function formatDateLong(date: DateInput): string {
  return format(toParis(date), "EEEE d MMMM yyyy", { locale: fr });
}

/**
 * Formate une date avec l'heure (24 h).
 *
 * @param date - Date ou chaîne ISO
 * @returns La date et l'heure
 * @example formatDateTime("2026-10-22T07:35:00Z") // "22/10/2026 à 09:35"
 */
export function formatDateTime(date: DateInput): string {
  return format(toParis(date), "dd/MM/yyyy 'à' HH:mm", { locale: fr });
}

/**
 * Formate une heure au format 24 h.
 *
 * @param date - Date ou chaîne ISO
 * @returns L'heure
 * @example formatTime("2026-10-22T07:35:00Z") // "09:35"
 */
export function formatTime(date: DateInput): string {
  return format(toParis(date), "HH:mm", { locale: fr });
}

/**
 * Formate une date relativement à maintenant : durée si elle est récente,
 * sinon formulation relative (« hier à 18:00 », « jeudi dernier à 09:00 »…).
 *
 * @param date - Date ou chaîne ISO
 * @param now - Date de référence (par défaut : maintenant), utile pour les tests
 * @returns La date relative
 * @example formatRelative(dateIlYa5Minutes) // "il y a 5 minutes"
 */
export function formatRelative(date: DateInput, now: DateInput = new Date()): string {
  const target = toParis(date);
  const reference = toParis(now);
  if (Math.abs(differenceInHours(reference, target)) < RELATIVE_DISTANCE_MAX_HOURS) {
    return formatDistance(target, reference, { addSuffix: true, locale: fr });
  }
  return dateFnsFormatRelative(target, reference, { locale: fr });
}

/**
 * Formate un mois et une année.
 *
 * @param date - Date ou chaîne ISO
 * @returns Le mois (en minuscules) et l'année
 * @example formatMonthYear("2026-10-22T09:00:00Z") // "octobre 2026"
 */
export function formatMonthYear(date: DateInput): string {
  return format(toParis(date), "MMMM yyyy", { locale: fr });
}

const numberFormatter = new Intl.NumberFormat(APP_LOCALE);

/**
 * Formate un nombre avec les séparateurs français.
 *
 * @param value - Nombre à formater
 * @returns Le nombre formaté (espace insécable comme séparateur de milliers)
 * @example formatNumber(12345.6) // "12 345,6"
 */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

const percentFormatter = new Intl.NumberFormat(APP_LOCALE, {
  style: "percent",
  maximumFractionDigits: 0,
});

/**
 * Formate un ratio en pourcentage arrondi.
 *
 * @param ratio - Valeur entre 0 et 1
 * @returns Le pourcentage
 * @example formatPercent(0.425) // "43 %"
 */
export function formatPercent(ratio: number): string {
  return percentFormatter.format(ratio);
}
