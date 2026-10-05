import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../index.js";
import { ok, fail } from "../../lib/respond.js";
import { REGIONS } from "../../lib/vocab.js";
import { ROUND_COLUMNS, isoDaysFromNow, shapeRound } from "./rounds_closing_soon.js";

export function registerRoundsOpeningSoon(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    "rounds_opening_soon",
    {
      title: "Funding rounds opening soon",
      description:
        "Funding rounds whose opening date falls within the next N days (default 60, max 180), soonest first. Optional region filter. Useful for planning applications ahead of time.",
      inputSchema: {
        days: z.number().int().min(1).max(180).default(60),
        region: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      },
    },
    async ({ days, region, limit }) => {
      if (region && !REGIONS[region]) return fail(`Unknown region '${region}'. Call list_filters.`);
      let q = ctx.db
        .from("funding_rounds")
        .select(ROUND_COLUMNS)
        .neq("status", "cancelled")
        .gte("opens_at", isoDaysFromNow(0))
        .lte("opens_at", isoDaysFromNow(days))
        .eq("funders.is_active", true);
      if (region) {
        q = q.or(`eligible_regions.cs.{${region}},eligible_regions.cs.{national},eligible_regions.eq.{}`, { foreignTable: "funders" });
      }
      const { data, error } = await q.order("opens_at", { ascending: true }).limit(limit);
      if (error) return fail(error.message);
      return ok({ days, region: region ?? null, rounds: (data ?? []).map((r) => shapeRound(r as Record<string, unknown>)) });
    },
  );
}
