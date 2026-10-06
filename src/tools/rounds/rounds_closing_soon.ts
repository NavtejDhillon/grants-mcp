import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../index.js";
import { ok, fail, dbFail } from "../../lib/respond.js";
import { isRegion } from "../../lib/vocab.js";
import { queryRounds } from "../../lib/rounds.js";

export function registerRoundsClosingSoon(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    "rounds_closing_soon",
    {
      title: "Funding rounds closing soon",
      description:
        "Funding rounds whose closing date falls within the next N days (default 30, max 180), soonest first. Optional region filter (slug from list_filters). Dates are New Zealand dates. Always confirm the date on the funder's own site before relying on it.",
      annotations: { title: "Funding rounds closing soon", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        days: z.number().int().min(1).max(180).default(30),
        region: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      },
    },
    async ({ days, region, limit }) => {
      if (region && !isRegion(region)) return fail(`Unknown region '${region}'. Call list_filters.`);
      const { rounds, error } = await queryRounds(ctx.db, { column: "closes_at", days, region, limit });
      if (error) return dbFail("rounds_closing_soon", error);
      return ok({ days, region: region ?? null, rounds });
    },
  );
}
