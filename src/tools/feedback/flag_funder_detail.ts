import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../index.js";
import { ok, fail, dbFail } from "../../lib/respond.js";
import { cleanText } from "../../lib/text.js";
import { FLAGGABLE_FIELDS } from "../../lib/vocab.js";

export function registerFeedbackFlagFunderDetail(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    "flag_funder_detail",
    {
      title: "Flag a wrong funder detail",
      description:
        "Report that a field on a funder profile is wrong or out of date, with the correction. Reviewed by All Too Human before any change is applied.",
      inputSchema: {
        funder_slug: z.string().min(1).max(120),
        field: z.enum(FLAGGABLE_FIELDS),
        correction: z.string().min(3).max(2000).describe("What the correct value is, and where you saw it if possible"),
      },
    },
    async (args) => {
      if (!ctx.writeLimiter.allow(ctx.clientIp)) return fail("Feedback limit reached for this connection; try again within 24 hours");

      const { data: funder, error: lookupError } = await ctx.db
        .from("funders")
        .select("slug,name,website_url")
        .eq("slug", args.funder_slug)
        .maybeSingle();
      if (lookupError) return dbFail("flag_funder_detail", lookupError);
      if (!funder) return fail(`No funder with slug '${args.funder_slug}'`);

      const correction = cleanText(args.correction, 2000);
      if (!correction) return fail("correction is required");
      const { error } = await ctx.db.from("discovery_log").insert({
        funder_name: funder.name,
        funder_slug: funder.slug,
        funder_url: funder.website_url,
        // enrichment_data is intentionally empty: the admin review tools apply it
        // verbatim to the funders table, so anonymous prose must never go there.
        // The suggested correction lives in funder_description for a human to read.
        funder_description: `Flagged field: ${args.field}. Suggested correction: ${correction}`,
        funder_data: {},
        is_enrichment: true,
        enrichment_target_slug: funder.slug,
        enrichment_data: {},
        source_type: "mcp_user",
        source_url: null,
        source_name: "mcp",
        ai_model: "user",
        status: "pending",
      });
      if (error) return dbFail("flag_funder_detail", error);
      return ok({ recorded: true, funder_slug: funder.slug, field: args.field, note: "Thank you. Corrections are reviewed before being applied." });
    },
  );
}
