export function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function fail(message: string) {
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

/** Trim long text so one tool call cannot return a whole page of prose. */
export function clip(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  if (max < 4) return value.slice(0, Math.max(0, max));
  return value.length <= max ? value : value.slice(0, max - 3) + "...";
}
