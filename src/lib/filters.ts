// Builders for PostgREST filter strings used inside .or(...). Values are
// double-quoted so braces, quotes and backslashes in user text cannot reach
// the filter grammar; % and _ are stripped first so they cannot act as
// ilike wildcards.

export function quoteValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Lowercased free text with wildcard and separator characters removed. */
export function searchText(value: string): string {
  return value.toLowerCase().replace(/[%_,.()*]/g, " ").replace(/\s+/g, " ").trim();
}

/** Funders with no region list, an empty one, or a nationwide tag fund anywhere. */
export function regionOr(slug: string, column = "eligible_regions"): string {
  return [
    `${column}.cs.{${quoteValue(slug)}}`,
    `${column}.cs.{national}`,
    `${column}.cs.{nationwide}`,
    `${column}.cs.{new-zealand}`,
    `${column}.eq.{}`,
    `${column}.is.null`,
  ].join(",");
}

export function orgTypeOr(value: string): string {
  return `eligible_types.cs.{${quoteValue(value)}},eligible_types.eq.{},eligible_types.is.null`;
}
