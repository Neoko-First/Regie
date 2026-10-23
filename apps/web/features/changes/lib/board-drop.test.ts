import { describe, expect, it } from "vitest";
import { resolveBoardDrop } from "./board-drop";

const author = { id: "auteur" };
const dev = { userId: "dev", roles: ["DEV"] as const };

describe("resolveBoardDrop", () => {
  it("ne fait rien quand la carte revient dans sa colonne", () => {
    expect(resolveBoardDrop({ status: "DRAFT", author }, "DRAFT", dev)).toEqual({ kind: "same" });
  });

  it("applique tout de suite une transition simple vers l'avant", () => {
    const drop = resolveBoardDrop({ status: "IN_DEVELOPMENT", author }, "IN_TESTING", dev);
    expect(drop).toMatchObject({ kind: "move", transition: { id: "start_testing" } });
  });

  it("demande une confirmation pour un gate", () => {
    const po = { userId: "po", roles: ["PO"] as const };
    const drop = resolveBoardDrop({ status: "IN_REVIEW", author }, "DESIGN", po);
    expect(drop).toMatchObject({ kind: "confirm", transition: { gate: "FUNCTIONAL" } });
  });

  it("demande une confirmation pour un renvoi en arrière", () => {
    const tester = { userId: "recette", roles: ["TESTER"] as const };
    const drop = resolveBoardDrop({ status: "IN_TESTING", author }, "IN_DEVELOPMENT", tester);
    expect(drop).toMatchObject({ kind: "confirm", transition: { backward: true } });
  });

  it("refuse un saut sans transition directe, avec un motif lisible", () => {
    const drop = resolveBoardDrop({ status: "DRAFT", author }, "DELIVERED", dev);
    expect(drop).toEqual({
      kind: "forbidden",
      reason: expect.stringContaining("Pas de passage direct") as string,
    });
  });

  it("refuse une transition hors des rôles de l'utilisateur", () => {
    const drop = resolveBoardDrop({ status: "IN_REVIEW", author }, "DESIGN", dev);
    expect(drop).toEqual({
      kind: "forbidden",
      reason: "Votre rôle dans cet espace ne permet pas cette action.",
    });
  });

  it("refuse à l'auteur de valider son propre gate", () => {
    const po = { userId: "auteur", roles: ["PO"] as const };
    const drop = resolveBoardDrop({ status: "IN_REVIEW", author }, "DESIGN", po);
    expect(drop).toMatchObject({ kind: "forbidden", reason: expect.stringContaining("auteur") });
  });
});
