import type { IncomingMessage, ServerResponse } from "http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "../src/server.js";

// Tempo máximo da função Vercel (segundos)
export const config = { maxDuration: 60 };

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,mcp-session-id,Authorization",
    });
    res.end();
    return;
  }

  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,mcp-session-id,Authorization");

  // Cada pedido cria um servidor e transporte independentes
  // (stateless — perfeito para Vercel serverless)
  const server    = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // modo stateless
  });

  await server.connect(transport);
  await transport.handleRequest(req as any, res as any);
}
