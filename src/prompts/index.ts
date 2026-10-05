import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPromptFindFundersForProject } from "./find_funders_for_project.js";
import { registerPromptPrepareApplication } from "./prepare_application.js";
import { registerPromptDraftApplication } from "./draft_application.js";

export function registerAllPrompts(server: McpServer) {
  registerPromptFindFundersForProject(server);
  registerPromptPrepareApplication(server);
  registerPromptDraftApplication(server);
}
