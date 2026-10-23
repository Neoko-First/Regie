import { formatDateTimeFr } from "./format";

describe("formatDateTimeFr", () => {
  it("formate en français dans le fuseau de Paris", () => {
    // 12:35 UTC = 14:35 à Paris (heure d'été)
    expect(formatDateTimeFr(new Date("2026-10-23T12:35:00Z"))).toBe("23/10/2026 à 14:35");
  });
});
