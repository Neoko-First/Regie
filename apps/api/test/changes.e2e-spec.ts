import type { NestExpressApplication } from "@nestjs/platform-express";
import type { ChangeDetail, SpaceRole, TransitionId } from "@regie/shared";
import {
  createLoggedInUser,
  createTestApp,
  createTestSpace,
  deleteTestUsers,
} from "./utils/test-app";

type LoggedIn = Awaited<ReturnType<typeof createLoggedInUser>>;

describe("Évolutions et workflow (e2e)", () => {
  let app: NestExpressApplication;
  /** Équipe d'un espace de test : un membre par rôle. */
  let team: Record<"dev" | "po" | "lead" | "tester" | "reader" | "outsider", LoggedIn>;
  let spaceKey: string;

  beforeAll(async () => {
    app = await createTestApp();
    const [dev, po, lead, tester, reader, outsider] = await Promise.all(
      Array.from({ length: 6 }, () => createLoggedInUser(app)),
    );
    team = {
      dev: dev!,
      po: po!,
      lead: lead!,
      tester: tester!,
      reader: reader!,
      outsider: outsider!,
    };
    const roles: Array<[LoggedIn, SpaceRole[]]> = [
      [team.dev, ["DEV"]],
      [team.po, ["PO"]],
      [team.lead, ["LEAD_TECH"]],
      [team.tester, ["TESTER"]],
      [team.reader, ["READER"]],
    ];
    const space = await createTestSpace(
      app,
      roles.map(([member, memberRoles]) => ({ userId: member.user.id, roles: memberRoles })),
    );
    spaceKey = space.key;
  });

  afterAll(async () => {
    await deleteTestUsers(app);
    await app.close();
  });

  /** Crée une évolution en tant que dev. */
  async function createChange(title = "Nouvelle évolution de test"): Promise<ChangeDetail> {
    const res = await team.dev.client.post("/changes", { spaceKey, title });
    expect(res.status).toBe(201);
    return res.body as ChangeDetail;
  }

  /** Demande une transition au nom d'un membre. */
  function transition(
    member: LoggedIn,
    change: ChangeDetail,
    id: TransitionId,
    from = change.status,
  ) {
    return member.client.post(`/changes/${change.key}/transitions`, {
      transition: id,
      fromStatus: from,
    });
  }

  describe("création et accès", () => {
    it("numérote les évolutions dans l'espace et les crée en brouillon", async () => {
      const first = await createChange();
      const second = await createChange();
      expect(first.key).toMatch(new RegExp(`^${spaceKey}-\\d+$`));
      expect(Number(second.key.split("-")[1])).toBe(Number(first.key.split("-")[1]) + 1);
      expect(first.status).toBe("DRAFT");
      expect(first.author.id).toBe(team.dev.user.id);
    });

    it("refuse la création à un membre en lecture seule", async () => {
      const res = await team.reader.client.post("/changes", { spaceKey, title: "Interdit" });
      expect(res.status).toBe(403);
    });

    it("masque l'évolution à un non-membre (404, et absente de sa liste)", async () => {
      const change = await createChange();
      expect((await team.outsider.client.get(`/changes/${change.key}`)).status).toBe(404);
      const list = await team.outsider.client.get(`/changes?space=${spaceKey}`);
      expect(list.body).toEqual([]);
    });

    it("valide les données avec le schéma partagé", async () => {
      const res = await team.dev.client.post("/changes", { spaceKey, title: "x" });
      expect(res.status).toBe(400);
      expect(res.body.fieldErrors.title).toBeDefined();
    });
  });

  describe("workflow et gates", () => {
    it("parcourt tout le cycle avec les trois gates humains et fige trois révisions", async () => {
      let change = await createChange("Cycle complet");
      const steps: Array<[LoggedIn, TransitionId]> = [
        [team.dev, "submit_for_review"],
        [team.po, "approve_functional"],
        [team.lead, "approve_technical"],
        [team.dev, "start_testing"],
        [team.tester, "approve_acceptance"],
        [team.lead, "mark_delivered"],
        [team.po, "archive"],
      ];
      for (const [member, id] of steps) {
        const res = await transition(member, change, id);
        expect({ id, status: res.status }).toEqual({ id, status: 200 });
        change = res.body as ChangeDetail;
      }
      expect(change.status).toBe("ARCHIVED");
      expect(change.revision).toBe(3);

      const revisions = await team.dev.client.get(`/changes/${change.key}/revisions`);
      expect(revisions.body.map((revision: { gate: string }) => revision.gate)).toEqual([
        "ACCEPTANCE",
        "TECHNICAL",
        "FUNCTIONAL",
      ]);
      expect(revisions.body[2].approvedBy.id).toBe(team.po.user.id);

      const activity = await team.dev.client.get(`/changes/${change.key}/activity`);
      const types = activity.body.map((item: { type: string }) => item.type);
      expect(types.filter((type: string) => type === "GATE_APPROVED")).toHaveLength(3);
      expect(types.at(-1)).toBe("CREATED");
    });

    it("refuse un gate à un rôle non habilité, avec un motif lisible", async () => {
      const change = await createChange();
      await transition(team.dev, change, "submit_for_review");
      const res = await transition(team.dev, change, "approve_functional", "IN_REVIEW");
      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Votre rôle dans cet espace ne permet pas cette action.");
    });

    it("interdit à l'auteur de valider le gate de sa propre évolution", async () => {
      const res = await team.po.client.post("/changes", { spaceKey, title: "Écrite par le PO" });
      const change = res.body as ChangeDetail;
      await transition(team.po, change, "submit_for_review");
      const gate = await transition(team.po, change, "approve_functional", "IN_REVIEW");
      expect(gate.status).toBe(403);
      expect(gate.body.message).toBe(
        "L'auteur d'une évolution ne peut pas valider ses propres gates.",
      );
    });

    it("refuse une action basée sur un statut périmé (409)", async () => {
      const change = await createChange();
      await transition(team.dev, change, "submit_for_review");
      // Le PO agit sur la version « brouillon » qu'il avait affichée
      const res = await transition(team.po, change, "approve_functional", "DRAFT");
      expect(res.status).toBe(409);
    });

    it("ne valide qu'une fois un gate demandé deux fois en même temps", async () => {
      const change = await createChange();
      await transition(team.dev, change, "submit_for_review");
      const results = await Promise.all([
        transition(team.po, change, "approve_functional", "IN_REVIEW"),
        transition(team.po, change, "approve_functional", "IN_REVIEW"),
      ]);
      expect(results.map((res) => res.status).sort()).toEqual([200, 409]);
      const revisions = await team.dev.client.get(`/changes/${change.key}/revisions`);
      expect(revisions.body).toHaveLength(1);
    });

    it("permet le renvoi en développement depuis la recette", async () => {
      let change = await createChange();
      for (const [member, id] of [
        [team.dev, "submit_for_review"],
        [team.po, "approve_functional"],
        [team.lead, "approve_technical"],
        [team.dev, "start_testing"],
      ] as Array<[LoggedIn, TransitionId]>) {
        change = (await transition(member, change, id)).body;
      }
      const res = await transition(team.tester, change, "back_to_development");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("IN_DEVELOPMENT");
    });

    it("indique dans le détail les actions possibles pour chaque utilisateur", async () => {
      const change = await createChange();
      await transition(team.dev, change, "submit_for_review");
      const asPo = (await team.po.client.get(`/changes/${change.key}`)).body as ChangeDetail;
      const asDev = (await team.dev.client.get(`/changes/${change.key}`)).body as ChangeDetail;
      const gateFor = (detail: ChangeDetail) =>
        detail.transitions.find((action) => action.id === "approve_functional");
      expect(gateFor(asPo)?.allowed).toBe(true);
      expect(gateFor(asDev)?.allowed).toBe(false);
      expect(gateFor(asDev)?.reason).toBeTruthy();
    });
  });

  describe("modification, suppression et commentaires", () => {
    it("modifie le contenu et trace les champs modifiés", async () => {
      const change = await createChange();
      const res = await team.dev.client.patch(`/changes/${change.key}`, {
        title: "Titre corrigé",
        proposal: "## Pourquoi",
      });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Titre corrigé");
      const activity = await team.dev.client.get(`/changes/${change.key}/activity`);
      expect(activity.body[0]).toMatchObject({
        type: "UPDATED",
        data: { fields: ["title", "proposal"] },
      });
    });

    it("refuse d'assigner une personne extérieure à l'espace", async () => {
      const change = await createChange();
      const res = await team.dev.client.patch(`/changes/${change.key}`, {
        assigneeId: team.outsider.user.id,
      });
      expect(res.status).toBe(400);
      expect(res.body.fieldErrors.assigneeId).toBeDefined();
    });

    it("ne supprime qu'un brouillon", async () => {
      const draft = await createChange();
      expect((await team.dev.client.delete(`/changes/${draft.key}`)).status).toBe(204);
      expect((await team.dev.client.get(`/changes/${draft.key}`)).status).toBe(404);

      const submitted = await createChange();
      await transition(team.dev, submitted, "submit_for_review");
      expect((await team.dev.client.delete(`/changes/${submitted.key}`)).status).toBe(409);
    });

    it("ajoute et liste les commentaires, refusés en lecture seule", async () => {
      const change = await createChange();
      const created = await team.po.client.post(`/changes/${change.key}/comments`, {
        body: "Pensez au cas multi-sociétés.",
      });
      expect(created.status).toBe(201);
      const readerAttempt = await team.reader.client.post(`/changes/${change.key}/comments`, {
        body: "Je ne peux pas",
      });
      expect(readerAttempt.status).toBe(403);
      const list = await team.reader.client.get(`/changes/${change.key}/comments`);
      expect(list.body).toHaveLength(1);
      expect(list.body[0].author.id).toBe(team.po.user.id);
    });
  });
});
