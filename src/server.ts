import "dotenv/config";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createDb } from "./supabase.js";
import { RateLimiter } from "./lib/ratelimit.js";
import { registerAllTools, type ToolContext } from "./tools/index.js";
import { registerAllPrompts } from "./prompts/index.js";

const VERSION = "1.0.0";
const {
  SUPABASE_URL = "https://data.decentralize.nz",
  SUPABASE_SERVICE_ROLE_KEY,
  PORT = "3103",
  HOST = "0.0.0.0",
  PUBLIC_URL = "https://funding.alltoohuman.nz",
  RATE_LIMIT_PER_MINUTE = "60",
  WRITE_LIMIT_PER_DAY = "20",
} = process.env;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("FATAL: SUPABASE_SERVICE_ROLE_KEY not set");
  process.exit(1);
}

const db = createDb(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const requestLimiter = new RateLimiter(Number(RATE_LIMIT_PER_MINUTE), 60_000);
const writeLimiter = new RateLimiter(Number(WRITE_LIMIT_PER_DAY), 24 * 60 * 60_000);
setInterval(() => {
  requestLimiter.sweep();
  writeLimiter.sweep();
}, 10 * 60_000).unref();

function buildServer(clientIp: string): McpServer {
  const server = new McpServer({ name: "ath-grants", version: VERSION });
  const ctx: ToolContext = { db, writeLimiter, clientIp };
  registerAllTools(server, ctx);
  registerAllPrompts(server);
  return server;
}

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "64kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "grants-mcp", version: VERSION });
});

app.post("/mcp", async (req, res) => {
  const clientIp = req.ip || "unknown";
  if (!requestLimiter.allow(clientIp)) {
    res.status(429).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Too many requests, slow down" },
      id: null,
    });
    return;
  }
  res.setHeader("X-Accel-Buffering", "no");
  const server = buildServer(clientIp);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    console.error("mcp request failed:", e);
    if (!res.headersSent) res.status(500).json({ error: "internal error" });
  }
});

app.all("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed; stateless server accepts POST only" },
    id: null,
  });
});

app.listen(Number(PORT), HOST, () => {
  console.log(`grants-mcp ${VERSION} listening on ${HOST}:${PORT}, public ${PUBLIC_URL}`);
});
