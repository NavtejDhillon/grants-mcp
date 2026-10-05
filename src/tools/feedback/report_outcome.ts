import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../index.js";
import { ok, fail, dbFail } from "../../lib/respond.js";
import { cleanText } from "../../lib/text.js";
import { OUTCOMES } from "../../lib/vocab.js";

export function registerFeedbackReportOutcome(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    "report_outcome",
    {
      title: "Report an application outcome",
      description:
        "Tell us how an application to a funder went. Outcomes are stored for All Too Human to analyse which funders say yes and are never published as-is.",
      inputSchema: {
        funder_slug: z.string().min(1).max(120),
        outcome: z.enum(OUTCOMES).describe("approved = funded in full, partial = funded less than asked, declined, waiting = no decision yet"),
        amount_received: z.number().int().min(0).max(50_000_000).optional().describe("Whole NZ dollars received, if funded"),
        notes: z.string().max(2000).optional().describe("Anything useful: what they asked for, timing, feedback received"),
      },
    },
    async (args) => {
      if (!ctx.writeLimiter.allow(ctx.clientIp)) return fail("Feedback limit reached for this connection; try again within 24 hours");

      const { data: funder, error: lookupError } = await ctx.db
        .from("funders")
        .select("slug")
        .eq("slug", args.funder_slug)
        .maybeSingle();
      if (lookupError) return dbFail("report_outcome", lookupError);
      if (!funder) return fail(`No funder with slug '${args.funder_slug}'`);

      const notes = cleanText(args.notes, 2000);
      const { error } = await ctx.db.from("grant_outcomes").insert({
        session_id: "mcp",
        funder_slug: args.funder_slug,
        outcome: args.outcome,
        amount_received: args.amount_received ?? null,
        feedback: notes ? `[via MCP] ${notes}` : "[via MCP]",
      });
      if (error) return dbFail("report_outcome", error);
      return ok({ recorded: true, funder_slug: args.funder_slug, outcome: args.outcome, note: "Thank you. Outcomes help us see which funders actually fund which kinds of work." });
    },
  );
}
