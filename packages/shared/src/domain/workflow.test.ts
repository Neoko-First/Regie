import { describe, expect, it } from "vitest";
import {
  CHANGE_STATUSES,
  checkTransition,
  getAvailableTransitions,
  parseChangeKey,
  TRANSITIONS,
  type TransitionActor,
} from "../index";

const po: TransitionActor = { roles: ["PO"], isAuthor: false, isAgent: false };

describe("workflow des évolutions", () => {
  it("relie chaque statut au suivant jusqu'à l'archivage (chemin nominal)", () => {
    const forward = TRANSITIONS.filter((transition) => !transition.backward);
    const reached = new Set(forward.map((transition) => transition.to));
    for (const status of CHANGE_STATUSES.slice(1)) expect(reached.has(status)).toBe(true);
  });

  it("place exactement trois gates, chacun réservé à un rôle métier", () => {
    const gates = TRANSITIONS.filter((transition) => transition.gate);
    expect(gates.map((transition) => [transition.gate, transition.roles])).toEqual([
      ["FUNCTIONAL", ["PO"]],
      ["TECHNICAL", ["LEAD_TECH"]],
      ["ACCEPTANCE", ["TESTER"]],
    ]);
  });

  it("autorise le PO à valider le gate fonctionnel", () => {
    expect(checkTransition("approve_functional", "IN_REVIEW", po)).toEqual({ allowed: true });
  });

  it("refuse une transition qui ne part pas du statut actuel", () => {
    expect(checkTransition("approve_functional", "DRAFT", po).allowed).toBe(false);
  });

  it("refuse un gate à un rôle non habilité", () => {
    const dev = { ...po, roles: ["DEV" as const] };
    expect(checkTransition("approve_functional", "IN_REVIEW", dev).allowed).toBe(false);
  });

  it("refuse tout gate à un agent, même avec le bon rôle (D-009)", () => {
    const check = checkTransition("approve_functional", "IN_REVIEW", { ...po, isAgent: true });
    expect(check).toEqual({
      allowed: false,
      reason: "Un agent ne peut pas valider un gate : validation humaine requise.",
    });
  });

  it("laisse un agent faire une transition sans gate", () => {
    const agent = { roles: ["DEV" as const], isAuthor: true, isAgent: true };
    expect(checkTransition("submit_for_review", "DRAFT", agent).allowed).toBe(true);
  });

  it("refuse à l'auteur de valider son propre gate (Q-022)", () => {
    expect(
      checkTransition("approve_functional", "IN_REVIEW", { ...po, isAuthor: true }).allowed,
    ).toBe(false);
  });

  it("cumule les rôles (D-063)", () => {
    const actor = { roles: ["DEV" as const, "TESTER" as const], isAuthor: false, isAgent: false };
    expect(checkTransition("approve_acceptance", "IN_TESTING", actor).allowed).toBe(true);
  });

  it("liste les actions d'un statut avec le motif des refus", () => {
    const actions = getAvailableTransitions("IN_TESTING", { ...po, roles: ["TESTER"] });
    expect(actions.map((action) => [action.id, action.check.allowed])).toEqual([
      ["back_to_development", true],
      ["back_to_review_from_testing", true],
      ["approve_acceptance", true],
    ]);
  });
});

describe("identifiants d'évolution", () => {
  it("décompose une clé valide", () => {
    expect(parseChangeKey("SOC-12")).toEqual({ spaceKey: "SOC", number: 12 });
  });

  it.each(["soc-12", "SOC12", "S-1", "SOC-", "SOC-1a"])("refuse %s", (key) => {
    expect(parseChangeKey(key)).toBeNull();
  });
});
