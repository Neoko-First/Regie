import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { AGENT_TOKENS_PATH, agentTokensQuery } from "@/features/agent-tokens/api";
import {
  AgentTokensList,
  CreateAgentTokenButton,
} from "@/features/agent-tokens/components/agent-tokens-view";
import { Prefetch } from "@/lib/server/prefetch";

export const metadata: Metadata = {
  title: "Jetons d’agent",
  description: "Jetons de délégation des agents IA connectés à Régie via MCP.",
};

/** Jetons d'agent (D-014) : un agent IA agit en votre nom via le serveur MCP. */
export default function AgentTokensPage() {
  return (
    <>
      <PageHeader title="Jetons d’agent" actions={<CreateAgentTokenButton />} />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
        <p className="text-muted-foreground text-sm">
          Un agent connecté avec l’un de ces jetons propose, rédige et fait avancer des évolutions
          avec vos droits. Il ne peut jamais valider un gate : la validation reste humaine.
        </p>
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <Prefetch requests={[{ query: agentTokensQuery(), path: AGENT_TOKENS_PATH }]}>
            <AgentTokensList />
          </Prefetch>
        </Suspense>
      </main>
    </>
  );
}
