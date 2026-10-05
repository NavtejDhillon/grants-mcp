# grants-mcp

Open MCP server for All Too Human's database of New Zealand community grant funders.
Connect your AI to `https://funding.alltoohuman.nz/mcp` (Streamable HTTP, no login).

Tools: search_funders, get_funder, list_filters, rounds_closing_soon, rounds_opening_soon,
report_outcome, suggest_funder, flag_funder_detail. Prompts: find_funders_for_project,
prepare_application, draft_application.

Run locally: copy `.env.example` to `.env`, fill the key, `npm install`, `npm run build`, `npm start`.

Every request to `/mcp` must send `Accept: application/json, text/event-stream` (the SDK returns 406 otherwise), for example:

```
curl -s -X POST http://localhost:3103/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
