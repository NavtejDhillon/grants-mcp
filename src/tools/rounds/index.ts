import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../index.js";
import { registerRoundsClosingSoon } from "./rounds_closing_soon.js";
import { registerRoundsOpeningSoon } from "./rounds_opening_soon.js";

export function registerRoundsTools(server: McpServer, ctx: ToolContext) {
  registerRoundsClosingSoon(server, ctx);
  registerRoundsOpeningSoon(server, ctx);
}
