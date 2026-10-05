// src/tools/index.ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Db } from "../supabase.js";
import type { RateLimiter } from "../lib/ratelimit.js";

export interface ToolContext {
  db: Db;
  /** Limits feedback writes per client IP per day. */
  writeLimiter: RateLimiter;
  /** Client IP for the current request, set by the server per request. */
  clientIp: string;
}

export function registerAllTools(_server: McpServer, _ctx: ToolContext) {
  // Domains are added in later tasks.
}
