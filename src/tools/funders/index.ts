import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../index.js";
import { registerFundersListFilters } from "./list_filters.js";
import { registerFundersSearchFunders } from "./search_funders.js";
import { registerFundersGetFunder } from "./get_funder.js";

export function registerFundersTools(server: McpServer, ctx: ToolContext) {
  registerFundersListFilters(server);
  registerFundersSearchFunders(server, ctx);
  registerFundersGetFunder(server, ctx);
}
