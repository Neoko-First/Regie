import { describe, expect, it } from "vitest";
import { DEFAULT_AFTER_LOGIN, getSafeRedirect } from "./safe-redirect";

describe("getSafeRedirect", () => {
  it("garde un chemin interne, avec sa query string", () => {
    expect(getSafeRedirect("/changes?view=board")).toBe("/changes?view=board");
  });

  it.each([
    [null],
    [""],
    ["https://evil.example"],
    ["//evil.example"],
    ["/\\evil.example"],
    ["javascript:alert(1)"],
    ["/login"],
  ])("refuse %j et renvoie vers la page par défaut", (next) => {
    expect(getSafeRedirect(next)).toBe(DEFAULT_AFTER_LOGIN);
  });
});
