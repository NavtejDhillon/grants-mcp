import type { Db } from "../supabase.js";
import { nzDate } from "./dates.js";
import { regionOr } from "./filters.js";

export const ROUND_COLUMNS =
  "round_name,opens_at,closes_at,decision_by,amount_available,notes,source_url,status,funders!inner(slug,name)";

export interface RoundRow {
  round_name: string;
  opens_at: string | null;
  closes_at: string | null;
  decision_by: string | null;
  amount_available: number | null;
  notes: string | null;
  source_url: string | null;
  status: string | null;
  funders: { slug: string; name: string } | null;
}

export function shapeRound(r: RoundRow) {
  return {
    funder_slug: r.funders?.slug ?? null,
    funder_name: r.funders?.name ?? null,
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

/** Rounds whose `column` date falls within the next `days` NZ days. */
export async function queryRounds(
  db: Db,
  opts: { column: "closes_at" | "opens_at"; days: number; region?: string; limit: number },
) {
  let q = db
    .from("funding_rounds")
    .select(ROUND_COLUMNS)
    .or("status.is.null,status.neq.cancelled")
    .gte(opts.column, nzDate(0))
    .lte(opts.column, nzDate(opts.days))
    .eq("funders.is_active", true);
  if (opts.region) q = q.or(regionOr(opts.region), { referencedTable: "funders" });
  const { data, error } = await q.order(opts.column, { ascending: true }).limit(opts.limit).returns<RoundRow[]>();
  if (error) return { error };
  return { rounds: (data ?? []).map(shapeRound) };
}
