import type { IncomingMessage, ServerResponse } from "http";

// Teste mínimo — sem imports do SDK
export const config = { maxDuration: 60 };

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,mcp-session-id,Authorization",
    });
    res.end();
    return;
  }

  res.setHeader("Content-Type", "application/json");
  res.writeHead(200);
  res.end(JSON.stringify({ status: "ok", message: "MCP handler a funcionar" }));
}
