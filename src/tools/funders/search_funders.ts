import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../index.js";
import { ok, fail, clip } from "../../lib/respond.js";
import { REGIONS, ORG_TYPES, DIFFICULTIES } from "../../lib/vocab.js";

const SUMMARY_COLUMNS =
  "slug,name,parent_org,description,typical_range,min_amount,max_amount,eligible_regions,eligible_types,eligible_purposes,difficulty,application_method,website_url";

/** Escape characters that have meaning in PostgREST filter strings. */
function escapeLike(value: string): string {
  return value.replace(/[%_,.()]/g, " ").trim();
}

export function registerFundersSearchFunders(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    "search_funders",
    {
      title: "Search grant funders",
      description:
        "Search New Zealand community grant funders. Returns up to 25 compact rows per call with a total count; use offset to page. Combine filters: region (slug from list_filters), org_type, purpose keywords, max_amount in NZD, difficulty. Use get_funder for the full profile of a result.",
      inputSchema: {
        query: z.string().max(200).optional().describe("Free text matched against funder name and description"),
        region: z.string().optional().describe("Region slug, e.g. tasman. Funders tagged national always match."),
        org_type: z.string().optional().describe("Applicant organisation type, e.g. charitable_trust"),
        purpose: z.string().max(100).optional().describe("Keyword matched against eligible purposes and priorities, e.g. youth, environment, marae"),
        max_amount: z.number().int().positive().optional().describe("Only funders whose minimum grant is at or below this NZD amount"),
        difficulty: z.enum(DIFFICULTIES).optional(),
        limit: z.number().int().min(1).max(25).default(10),
        offset: z.number().int().min(0).default(0),
      },
    },
    async (args) => {
      if (args.region && !REGIONS[args.region]) {
        return fail(`Unknown region '${args.region}'. Call list_filters for valid slugs.`);
      }
      if (args.org_type && !ORG_TYPES[args.org_type]) {
        return fail(`Unknown org_type '${args.org_type}'. Call list_filters for valid values.`);
      }

      let q = ctx.db
        .from("funders")
        .select(SUMMARY_COLUMNS, { count: "exact" })
        .eq("is_active", true);

      if (args.query) {
        const term = escapeLike(args.query);
        if (term) q = q.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
      }
      if (args.region) {
        q = q.or(`eligible_regions.cs.{${args.region}},eligible_regions.cs.{national},eligible_regions.eq.{}`);
      }
      if (args.org_type) {
        q = q.or(`eligible_types.cs.{${args.org_type}},eligible_types.eq.{}`);
      }
      if (args.purpose) {
        const term = escapeLike(args.purpose);
        if (term) q = q.or(`funder_priorities.ilike.%${term}%,description.ilike.%${term}%,eligible_purposes.cs.{${term}}`);
      }
      if (args.max_amount) {
        q = q.or(`min_amount.is.null,min_amount.lte.${args.max_amount}`);
      }
      if (args.difficulty) q = q.eq("difficulty", args.difficulty);

      const { data, error, count } = await q
        .order("name", { ascending: true })
        .range(args.offset, args.offset + args.limit - 1);
      if (error) return fail(error.message);

      const rows = (data ?? []).map((f) => ({
        slug: f.slug,
        name: f.name,
        parent_org: f.parent_org,
        description: clip(f.description, 300),
        typical_range: f.typical_range,
        min_amount: f.min_amount,
        max_amount: f.max_amount,
        eligible_regions: f.eligible_regions,
        eligible_types: f.eligible_types,
        eligible_purposes: f.eligible_purposes,
        difficulty: f.difficulty,
        application_method: f.application_method,
        website_url: f.website_url,
      }));
      const total = count ?? rows.length;
      const nextOffset = args.offset + rows.length;
      return ok({
        total,
        returned: rows.length,
        next_offset: nextOffset < total ? nextOffset : null,
        funders: rows,
      });
    },
  );
}
