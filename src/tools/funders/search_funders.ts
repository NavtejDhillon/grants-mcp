import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../index.js";
import { ok, fail, dbFail, clip } from "../../lib/respond.js";
import { isRegion, isOrgType, DIFFICULTIES } from "../../lib/vocab.js";
import { quoteValue, searchText, regionOr, orgTypeOr } from "../../lib/filters.js";

const SUMMARY_COLUMNS =
  "slug,name,parent_org,description,typical_range,min_amount,max_amount,eligible_regions,eligible_types,eligible_purposes,difficulty,application_method,website_url";

interface FunderSummaryRow {
  slug: string;
  name: string;
  parent_org: string | null;
  description: string | null;
  typical_range: string | null;
  min_amount: number | null;
  max_amount: number | null;
  eligible_regions: string[] | null;
  eligible_types: string[] | null;
  eligible_purposes: string[] | null;
  difficulty: string | null;
  application_method: string | null;
  website_url: string | null;
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
      if (args.region && !isRegion(args.region)) {
        return fail(`Unknown region '${args.region}'. Call list_filters for valid slugs.`);
      }
      if (args.org_type && !isOrgType(args.org_type)) {
        return fail(`Unknown org_type '${args.org_type}'. Call list_filters for valid values.`);
      }

      let q = ctx.db
        .from("funders")
        .select(SUMMARY_COLUMNS, { count: "exact" })
        .eq("is_active", true);

      if (args.query) {
        const text = searchText(args.query);
        if (text) q = q.or(`name.ilike.${quoteValue("%" + text + "%")},description.ilike.${quoteValue("%" + text + "%")}`);
      }
      if (args.region) q = q.or(regionOr(args.region));
      if (args.org_type) q = q.or(orgTypeOr(args.org_type));
      if (args.purpose) {
        const text = searchText(args.purpose);
        const tag = text.replace(/ /g, "_");
        if (text) {
          q = q.or(
            `funder_priorities.ilike.${quoteValue("%" + text + "%")},description.ilike.${quoteValue("%" + text + "%")},eligible_purposes.cs.{${quoteValue(tag)}},eligible_purposes.cs.{${quoteValue(text)}}`,
          );
        }
      }
      if (args.max_amount) {
        q = q.or(`min_amount.is.null,min_amount.lte.${args.max_amount}`);
      }
      if (args.difficulty) q = q.eq("difficulty", args.difficulty);

      const { data, error, count } = await q
        .order("name", { ascending: true })
        .range(args.offset, args.offset + args.limit - 1)
        .returns<FunderSummaryRow[]>();
      if (error) return dbFail("search_funders", error);

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
