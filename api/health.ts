import type { IncomingMessage, ServerResponse } from "http";
import { ALL_TEAMS } from "../src/server";

export const config = { maxDuration: 10 };

export default function handler(
  _req: IncomingMessage,
  res: ServerResponse
): void {
  const totalTools = ALL_TEAMS.reduce((sum, t) => sum + t.tools.length, 0);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    name:    "mcp-agregador",
    version: "1.0.0",
    status:  "ok",
    teams:   ALL_TEAMS.length,
    tools:   totalTools,
    n8n:     !!process.env.N8N_WEBHOOK_URL,
  }));
}
