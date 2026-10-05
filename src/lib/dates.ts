// Dates in the funder data are New Zealand civil dates, so "today" must be the
// Pacific/Auckland date, not UTC (they differ for up to 13 hours a day).
const NZ = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Pacific/Auckland",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD in Pacific/Auckland, offset by whole days from now. */
export function nzDate(offsetDays = 0): string {
  return NZ.format(new Date(Date.now() + offsetDays * 86_400_000));
}
