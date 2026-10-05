import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPromptPrepareApplication(server: McpServer) {
  server.registerPrompt(
    "prepare_application",
    {
      title: "Prepare an application",
      description: "Interview the user through a funder's actual application questions and required documents.",
      argsSchema: {
        funder_slug: z.string().describe("Funder slug from search_funders"),
        project: z.string().describe("Short description of the project"),
      },
    },
    ({ funder_slug, project }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Help me prepare an application to the funder with slug '${funder_slug}' for this project: ${project}`,
              "",
              "Steps:",
              "1. Call get_funder for that slug. Read application_form (the extracted form questions), application_sections, required_documents, funder_priorities and common_mistakes.",
              "2. Check eligibility first: compare the project against eligible_types, eligible_regions, eligible_purposes and ineligible_purposes. If there is a problem, say so before going further.",
              "3. Interview me one question at a time, following the funder's own form questions in order (or application_sections if there is no form). Keep each question short and explain why the funder asks it when that helps. Do not invent facts; if I do not know something, note it as missing.",
              "4. After the questions, list the required_documents and ask which I already have.",
              "5. Finish with a summary: answers gathered, gaps to fill, documents still needed, and the closing date from upcoming_rounds if there is one.",
              "",
              "When the summary is complete, offer to run the draft_application prompt.",
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
