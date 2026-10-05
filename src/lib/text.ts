/** Strip control characters and collapse whitespace in user-supplied text. */
export function cleanText(value: string | undefined, max: number): string | null {
  if (!value) return null;
  const cleaned = value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  return cleaned.slice(0, max);
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
