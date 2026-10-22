import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateLong,
  formatDateTime,
  formatMonthYear,
  formatNumber,
  formatPercent,
  formatRelative,
  formatTime,
} from "./format";

// 07:35 UTC = 09:35 à Paris (heure d'été, UTC+2, le 22 octobre 2026)
const ISO = "2026-10-22T07:35:00Z";

describe("format", () => {
  it("formate les dates en français dans le fuseau Europe/Paris", () => {
    expect(formatDate(ISO)).toBe("22/10/2026");
    expect(formatDateLong(ISO)).toBe("jeudi 22 octobre 2026");
    expect(formatDateTime(ISO)).toBe("22/10/2026 à 09:35");
    expect(formatTime(ISO)).toBe("09:35");
    expect(formatMonthYear(ISO)).toBe("octobre 2026");
  });

  it("change de jour selon le fuseau de Paris, pas selon UTC", () => {
    // 23:30 UTC le 22 = 01:30 à Paris le 23
    expect(formatDate("2026-10-22T23:30:00Z")).toBe("23/10/2026");
  });

  it("affiche une durée pour une date récente", () => {
    expect(formatRelative("2026-10-22T07:30:00Z", ISO)).toBe("il y a 5 minutes");
  });

  it("affiche une formulation relative pour une date plus ancienne", () => {
    expect(formatRelative("2026-10-21T16:00:00Z", ISO)).toBe("hier à 18:00");
  });

  it("formate nombres et pourcentages à la française", () => {
    // Intl utilise des espaces insécables fines comme séparateurs
    expect(formatNumber(12345.6).replace(/\s/g, " ")).toBe("12 345,6");
    expect(formatPercent(0.425).replace(/\s/g, " ")).toBe("43 %");
  });
});
