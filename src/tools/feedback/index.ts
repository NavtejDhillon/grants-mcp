import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../index.js";
import { registerFeedbackReportOutcome } from "./report_outcome.js";
import { registerFeedbackSuggestFunder } from "./suggest_funder.js";
import { registerFeedbackFlagFunderDetail } from "./flag_funder_detail.js";

export function registerFeedbackTools(server: McpServer, ctx: ToolContext) {
  registerFeedbackReportOutcome(server, ctx);
  registerFeedbackSuggestFunder(server, ctx);
  registerFeedbackFlagFunderDetail(server, ctx);
}
