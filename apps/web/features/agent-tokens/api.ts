import type { AgentTokenInfo, CreateAgentTokenInput, CreatedAgentToken } from "@regie/shared";
import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

/** Chemin de l'API des jetons d'agent (client et préchargement serveur). */
export const AGENT_TOKENS_PATH = "/agent-tokens";

/** Requêtes de modification des jetons d'agent. */
export const agentTokensApi = {
  create: (input: CreateAgentTokenInput) =>
    apiClient.post<CreatedAgentToken>(AGENT_TOKENS_PATH, input),
  revoke: (id: string) => apiClient.delete(`${AGENT_TOKENS_PATH}/${id}`),
};

/** Jetons actifs de l'utilisateur. */
export const agentTokensQuery = () =>
  queryOptions({
    queryKey: queryKeys.agentTokens.all,
    queryFn: () => apiClient.get<AgentTokenInfo[]>(AGENT_TOKENS_PATH),
  });
