// Region slugs used in funders.eligible_regions. "national" means the funder
// gives anywhere in New Zealand.
export const REGIONS: Record<string, string> = {
  national: "Nationwide",
  northland: "Northland",
  auckland: "Auckland",
  waikato: "Waikato",
  "bay-of-plenty": "Bay of Plenty",
  gisborne: "Gisborne / Tairawhiti",
  "hawkes-bay": "Hawke's Bay",
  taranaki: "Taranaki",
  "manawatu-wanganui": "Manawatu / Whanganui",
  wellington: "Wellington",
  tasman: "Tasman",
  nelson: "Nelson",
  marlborough: "Marlborough",
  "west-coast": "West Coast",
  canterbury: "Canterbury",
  otago: "Otago",
  southland: "Southland",
  "chatham-islands": "Chatham Islands",
};

// Organisation types used in funders.eligible_types.
export const ORG_TYPES: Record<string, string> = {
  charitable_trust: "Registered charitable trust",
  incorporated_society: "Incorporated society",
  community_group: "Informal community group",
  marae: "Marae, hapu or iwi organisation",
  school: "School, kura or early childhood centre",
  sports_club: "Sports club",
  individual: "Individual",
  business: "Business or social enterprise",
};

export const OUTCOMES = ["approved", "partial", "declined", "waiting"] as const;

export function isRegion(value: string): boolean {
  return Object.hasOwn(REGIONS, value);
}

export function isOrgType(value: string): boolean {
  return Object.hasOwn(ORG_TYPES, value);
}

export const DIFFICULTIES = ["simple", "moderate", "detailed"] as const;

export const PUBLIC_FUNDER_COLUMNS = [
  "slug", "name", "parent_org", "logo_url", "website_url", "description",
  "eligible_types", "eligible_regions", "eligible_purposes", "ineligible_purposes",
  "min_amount", "max_amount", "typical_range", "funding_type",
  "application_sections", "required_documents", "application_method", "application_url",
  "deadlines", "typical_decision_time", "funder_priorities", "language_tips",
  "common_mistakes", "success_factors", "difficulty", "submission_email",
  "accepts_email_submission", "is_recurring", "recurrence_pattern", "application_form",
].join(",");

/** Fields a user may flag as wrong via flag_funder_detail. */
export const FLAGGABLE_FIELDS = [
  "name", "website_url", "description", "eligible_types", "eligible_regions",
  "eligible_purposes", "ineligible_purposes", "min_amount", "max_amount", "typical_range",
  "required_documents", "application_method", "application_url", "deadlines",
  "funder_priorities", "language_tips", "common_mistakes", "success_factors", "difficulty",
] as const;
