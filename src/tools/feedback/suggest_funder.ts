import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../index.js";
import { ok, fail, dbFail } from "../../lib/respond.js";
import { cleanText, isHttpUrl } from "../../lib/text.js";
import { isRegion } from "../../lib/vocab.js";

export function registerFeedbackSuggestFunder(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    "suggest_funder",
    {
      title: "Suggest a missing funder",
      description:
        "Suggest a New Zealand grant funder that is not in the database. All Too Human researches and reviews suggestions before adding them. Check search_funders first to avoid duplicates.",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      inputSchema: {
        name: z.string().min(3).max(200),
        url: z.string().max(500).optional().describe("The funder's website or funding page"),
        region: z.string().optional().describe("Region slug if the funder is regional"),
        notes: z.string().max(2000).optional().describe("What they fund, who is eligible, deadlines, anything you know"),
      },
    },
    async (args) => {
      if (!ctx.writeLimiter.allow(ctx.clientIp)) return fail("Feedback limit reached for this connection; try again within 24 hours");
      const url = args.url?.trim();
      if (url && !isHttpUrl(url)) return fail("url must start with http:// or https://");
      if (args.region && !isRegion(args.region)) return fail(`Unknown region '${args.region}'. Call list_filters.`);

      const name = cleanText(args.name, 200);
      if (!name) return fail("name is required");
      const notes = cleanText(args.notes, 2000);
      const { error } = await ctx.db.from("funder_submissions").insert({
        funder_name: name,
        funder_url: url || null,
        funder_description: `[via MCP] ${notes ?? "No notes provided"}`,
        region: args.region ?? null,
        status: "pending",
      });
      if (error) return dbFail("suggest_funder", error);
      return ok({ recorded: true, name, note: "Thank you. Suggestions are researched and reviewed before publication." });
    },
  );
}
