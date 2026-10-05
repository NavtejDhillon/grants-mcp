import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../index.js";
import { ok, fail, dbFail } from "../../lib/respond.js";
import { cleanText } from "../../lib/text.js";

export const OUTCOMES = ["won", "declined", "withdrawn", "no_response"] as const;

export function registerFeedbackReportOutcome(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    "report_outcome",
    {
      title: "Report an application outcome",
      description:
        "Tell us how an application to a funder went. This improves the data for the next community group. Nothing is published automatically; All Too Human reviews every report.",
      inputSchema: {
        funder_slug: z.string().min(1).max(120),
        outcome: z.enum(OUTCOMES),
        amount_received: z.number().int().min(0).optional().describe("NZD received, whole dollars, if won"),
        notes: z.string().max(2000).optional().describe("Anything useful: what they asked for, timing, feedback received"),
      },
    },
    async (args) => {
      if (!ctx.writeLimiter.allow(ctx.clientIp)) return fail("Daily feedback limit reached for this connection; try again tomorrow");

      const { data: funder, error: lookupError } = await ctx.db
        .from("funders")
        .select("slug")
        .eq("slug", args.funder_slug)
        .maybeSingle();
      if (lookupError) return dbFail("report_outcome", lookupError);
      if (!funder) return fail(`No funder with slug '${args.funder_slug}'`);

      const { error } = await ctx.db.from("grant_outcomes").insert({
        session_id: "mcp",
        funder_slug: args.funder_slug,
        outcome: args.outcome,
        amount_received: args.amount_received ?? null,
        feedback: cleanText(args.notes, 2000),
      });
      if (error) return dbFail("report_outcome", error);
      return ok({ recorded: true, funder_slug: args.funder_slug, outcome: args.outcome, note: "Thank you. Outcomes are reviewed before they influence funder profiles." });
    },
  );
}
