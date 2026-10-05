import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../index.js";
import { ok, fail, dbFail } from "../../lib/respond.js";
import { REGIONS } from "../../lib/vocab.js";
import { queryRounds } from "../../lib/rounds.js";

export function registerRoundsOpeningSoon(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    "rounds_opening_soon",
    {
      title: "Funding rounds opening soon",
      description:
        "Funding rounds whose opening date falls within the next N days (default 60, max 180), soonest first. Optional region filter (slug from list_filters). Useful for planning applications ahead of time. Dates are New Zealand dates. Always confirm the date on the funder's own site before relying on it.",
      inputSchema: {
        days: z.number().int().min(1).max(180).default(60),
        region: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      },
    },
    async ({ days, region, limit }) => {
      if (region && !REGIONS[region]) return fail(`Unknown region '${region}'. Call list_filters.`);
      const { rounds, error } = await queryRounds(ctx.db, { column: "opens_at", days, region, limit });
      if (error) return dbFail("rounds_opening_soon", error);
      return ok({ days, region: region ?? null, rounds });
    },
  );
}
