import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ok } from "../../lib/respond.js";
import { REGIONS, ORG_TYPES, DIFFICULTIES } from "../../lib/vocab.js";

export function registerFundersListFilters(server: McpServer) {
  server.registerTool(
    "list_filters",
    {
      title: "List valid search filters",
      description:
        "Returns the exact region slugs, organisation type values and difficulty levels accepted by search_funders. Call this first if you are unsure which value to use.",
      inputSchema: {},
    },
    async () =>
      ok({
        regions: REGIONS,
        org_types: ORG_TYPES,
        difficulties: DIFFICULTIES,
        notes: [
          "Funders with eligible_regions containing 'national' fund anywhere in New Zealand.",
          "Amounts are New Zealand dollars.",
        ],
      }),
  );
}
