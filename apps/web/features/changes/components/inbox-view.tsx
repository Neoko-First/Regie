"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { inboxQuery } from "../api";
import { ChangesTableView } from "./changes-table";

/**
 * « Ma boîte » : les gates que je peux valider, puis les évolutions qui me sont assignées.
 * Les droits sont calculés par l'API avec le workflow partagé.
 */
export function InboxView() {
  const { toValidate, assigned } = useSuspenseQuery(inboxQuery()).data;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3" aria-labelledby="inbox-validate">
        <h2 id="inbox-validate" className="text-base font-semibold">
          À valider <span className="text-muted-foreground font-normal">({toValidate.length})</span>
        </h2>
        <ChangesTableView changes={toValidate} emptyText="Aucun gate n’attend votre validation." />
      </section>
      <section className="flex flex-col gap-3" aria-labelledby="inbox-assigned">
        <h2 id="inbox-assigned" className="text-base font-semibold">
          Assignées à moi{" "}
          <span className="text-muted-foreground font-normal">({assigned.length})</span>
        </h2>
        <ChangesTableView changes={assigned} emptyText="Aucune évolution ne vous est assignée." />
      </section>
    </div>
  );
}
