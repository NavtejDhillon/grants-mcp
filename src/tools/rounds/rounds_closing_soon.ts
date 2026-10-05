import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../index.js";
import { ok, fail } from "../../lib/respond.js";
import { REGIONS } from "../../lib/vocab.js";

export const ROUND_COLUMNS =
  "round_name,opens_at,closes_at,decision_by,amount_available,notes,source_url,status,funders!inner(slug,name,eligible_regions)";

export function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

export function shapeRound(r: Record<string, unknown>) {
  const funder = r.funders as { slug: string; name: string; eligible_regions: string[] } | null;
  return {
    funder_slug: funder?.slug ?? null,
    funder_name: funder?.name ?? null,
    round_name: r.round_name,
    opens_at: r.opens_at,
    closes_at: r.closes_at,
    decision_by: r.decision_by,
    amount_available: r.amount_available,
    notes: r.notes,
    source_url: r.source_url,
    status: r.status,
  };
}

export function registerRoundsClosingSoon(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    "rounds_closing_soon",
    {
      title: "Funding rounds closing soon",
      description:
        "Funding rounds whose closing date falls within the next N days (default 30, max 180), soonest first. Optional region filter (slug from list_filters). Dates are New Zealand dates. Always confirm the closing date on the funder's own site before relying on it.",
      inputSchema: {
        days: z.number().int().min(1).max(180).default(30),
        region: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      },
    },
    async ({ days, region, limit }) => {
      if (region && !REGIONS[region]) return fail(`Unknown region '${region}'. Call list_filters.`);
      const today = isoDaysFromNow(0);
      let q = ctx.db
        .from("funding_rounds")
        .select(ROUND_COLUMNS)
        .neq("status", "cancelled")
        .gte("closes_at", today)
        .lte("closes_at", isoDaysFromNow(days))
        .eq("funders.is_active", true);
      if (region) {
        q = q.or(`eligible_regions.cs.{${region}},eligible_regions.cs.{national},eligible_regions.eq.{}`, { foreignTable: "funders" });
      }
      const { data, error } = await q.order("closes_at", { ascending: true }).limit(limit);
      if (error) return fail(error.message);
      return ok({ days, region: region ?? null, rounds: (data ?? []).map((r) => shapeRound(r as Record<string, unknown>)) });
    },
  );
}
