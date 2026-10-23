import { describe, expect, it } from "vitest";
import { z } from "./index";

describe("configuration Zod", () => {
  it("renvoie des messages d'erreur en français", () => {
    const result = z.string().safeParse(42);
    expect(result.success).toBe(false);
    // La locale fr de Zod v4 formule les erreurs de type en français
    expect(result.error?.issues[0]?.message).toMatch(/attendu/i);
  });
});
