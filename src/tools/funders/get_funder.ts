import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../index.js";
import { ok, fail } from "../../lib/respond.js";
import { PUBLIC_FUNDER_COLUMNS } from "../../lib/vocab.js";

export function registerFundersGetFunder(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    "get_funder",
    {
      title: "Get full funder profile",
      description:
        "Full profile for one funder by slug: what they prioritise, language tips, common mistakes, success factors, required documents, application sections, the extracted application form questions, and upcoming funding rounds. Use this before preparing or drafting an application.",
      inputSchema: {
        slug: z.string().min(1).max(120).describe("Funder slug from search_funders"),
      },
    },
    async ({ slug }) => {
      const { data: funderRow, error } = await ctx.db
        .from("funders")
        .select(`id,${PUBLIC_FUNDER_COLUMNS}`)
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) return fail(error.message);
      const funder = funderRow as unknown as ({ id: string } & Record<string, unknown>) | null;
      if (!funder) return fail(`No active funder with slug '${slug}'`);

      const today = new Date().toISOString().slice(0, 10);
      const { data: rounds, error: roundsError } = await ctx.db
        .from("funding_rounds")
        .select("round_name,opens_at,closes_at,decision_by,amount_available,notes,source_url,is_recurring,recurrence_pattern,status")
        .eq("funder_id", funder.id)
        .neq("status", "cancelled")
        .or(`closes_at.gte.${today},closes_at.is.null`)
        .order("closes_at", { ascending: true, nullsFirst: false })
        .limit(10);
      if (roundsError) return fail(roundsError.message);

      const { id: _id, ...publicFunder } = funder;
      return ok({ ...publicFunder, upcoming_rounds: rounds ?? [] });
    },
  );
}
