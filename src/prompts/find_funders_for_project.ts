import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPromptFindFundersForProject(server: McpServer) {
  server.registerPrompt(
    "find_funders_for_project",
    {
      title: "Find funders for my project",
      description: "Match a community project to the New Zealand funders most likely to support it.",
      argsSchema: {
        project: z.string().describe("What the project is, who it helps, roughly how much it needs"),
        region: z.string().optional().describe("Where the project happens, e.g. Tasman"),
        org_type: z.string().optional().describe("Who is applying, e.g. an incorporated society"),
      },
    },
    ({ project, region, org_type }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              "You are helping a New Zealand community group find grant funding using the All Too Human grants tools.",
              "",
              `Project: ${project}`,
              region ? `Region: ${region}` : "Region: not given, ask if it matters",
              org_type ? `Applicant organisation type: ${org_type}` : "Applicant organisation type: not given, ask",
              "",
              "Steps:",
              "1. If the region or organisation type is unclear, call list_filters and ask the user to confirm the right values.",
              "2. Call search_funders two or three times with different combinations: region plus purpose keywords, then org_type plus max_amount set to roughly what the project needs, then a broader query. Note which funders appear more than once.",
              "3. Call get_funder for the four or five strongest candidates and read funder_priorities, ineligible_purposes and typical_range.",
              "4. Call rounds_closing_soon with the region and days set to 90 to spot deadlines in the next three months.",
              "5. Present up to five funders, best first. For each: name, why it fits this project in one or two sentences, typical amount, difficulty, and any closing date. Say clearly if something makes the project ineligible.",
              "6. Ask which funder to pursue, then suggest running the prepare_application prompt for it.",
              "",
              "Be honest about uncertainty. Deadlines and amounts in the database can be out of date; tell the user to confirm on the funder's website.",
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
