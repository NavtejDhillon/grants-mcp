import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPromptDraftApplication(server: McpServer) {
  server.registerPrompt(
    "draft_application",
    {
      title: "Draft an application",
      description: "Write a grant application in the funder's own priorities and language, using the answers gathered.",
      argsSchema: {
        funder_slug: z.string().describe("Funder slug from search_funders"),
        project: z.string().describe("Short description of the project"),
        answers: z.string().optional().describe("Answers gathered so far, if prepare_application was run"),
      },
    },
    ({ funder_slug, project, answers }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Draft a grant application to the funder with slug '${funder_slug}' for this project: ${project}`,
              answers ? `\nAnswers gathered so far:\n${answers}` : "\nNo answers gathered yet; ask for anything essential before drafting.",
              "",
              "Steps:",
              "1. Call get_funder and read funder_priorities, language_tips, success_factors, common_mistakes, application_sections, application_form and typical_range.",
              "2. Write the application section by section, following the funder's own section headings and question order. Use the funder's language and priorities naturally; do not paste their words back at them.",
              "3. Keep the request inside the typical range and explain the budget plainly.",
              "4. Avoid every item in common_mistakes. Apply the success_factors where they are true of this project.",
              "5. Mark every fact, number or claim that I must verify with [CHECK]. Never invent statistics, names or outcomes.",
              "6. End with a short checklist: required documents, closing date (from upcoming_rounds), and who signs.",
              "",
              "Finally, ask me to come back after the funder decides and call report_outcome, so the next community group benefits.",
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
