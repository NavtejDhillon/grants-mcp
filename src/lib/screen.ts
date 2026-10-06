// Screening for text submitted by anonymous users. Everything a user writes is
// later read by a reviewer's AI, so instruction-like text is a prompt-injection
// risk. We do not reject it (that only teaches an attacker what to avoid); we
// strip markup, flag it, and let the reviewer see the flag next to the text.

import { cleanText } from "./text.js";

const INSTRUCTION_PATTERNS: RegExp[] = [
  /\bignore (all|any|the|your|previous|prior|earlier|above)\b/i,
  /\bdisregard (all|any|the|your|previous|prior|earlier|above)\b/i,
  /\bsystem prompt\b/i,
  /\byou are (now|an?|the) (ai|assistant|model|reviewer|admin)/i,
  /\bact as\b/i,
  /\bnew instructions?\b/i,
  /\b(assistant|system|user|human)\s*:/i,
  /<\|[a-z_]+\|>/i,
  /\[(inst|\/inst|system)\]/i,
  /\bapprove (all|every|this|the)\b/i,
  /\bmark (this|it|all) (as )?(approved|verified)\b/i,
  /\bdo not (tell|show|mention)\b/i,
];

export interface ScreenResult {
  /** Cleaned text with markup removed, or null if nothing is left. */
  text: string | null;
  /** True when the text looks like instructions aimed at an AI reviewer. */
  flagged: boolean;
  reasons: string[];
}

function stripMarkup(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]{1,200}>/g, " ")
    .replace(/[*_`#>]{2,}/g, " ");
}

export function screenText(value: string | undefined, max: number): ScreenResult {
  if (!value) return { text: null, flagged: false, reasons: [] };
  const reasons: string[] = [];
  if (/```|<[a-z!/][^>]*>/i.test(value)) reasons.push("markup");
  const urls = value.match(/https?:\/\//gi);
  if (urls && urls.length > 2) reasons.push("many links");
  for (const pattern of INSTRUCTION_PATTERNS) {
    if (pattern.test(value)) {
      reasons.push("instruction-like text");
      break;
    }
  }
  const text = cleanText(stripMarkup(value), max);
  return { text, flagged: reasons.length > 0, reasons };
}

/** Prefix stored text with a marker the reviewer can see. */
export function markIfFlagged(result: ScreenResult): string | null {
  if (!result.text) return null;
  return result.flagged ? `[screened: ${result.reasons.join(", ")}] ${result.text}` : result.text;
}
