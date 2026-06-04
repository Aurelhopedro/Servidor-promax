#!/usr/bin/env node
/**
 * Servidor local para desenvolvimento.
 * Em produção (Vercel) este ficheiro NÃO é usado —
 * as funções em api/ são o ponto de entrada.
 *
 * Usa: npm run dev:local
 */
import "dotenv/config";
import http from "http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMcpServer, ALL_TEAMS } from "./server.js";

const PORT = parseInt(process.env.PORT ?? "3000", 10);

// Sessões SSE activas — chave: sessionId
const transports = new Map<
  string,
  { transport: SSEServerTransport; timer: NodeJS.Timeout }
>();

const httpServer = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  // Health check
  if (url.pathname === "/" || url.pathname === "/health") {
    const totalTools = ALL_TEAMS.reduce((sum, t) => sum + t.tools.length, 0);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name: "mcp-agregador", status: "ok",
      teams: ALL_TEAMS.length, tools: totalTools,
    }));
    return;
  }

  // SSE — Claude liga aqui
  if (url.pathname === "/sse") {
    const server    = createMcpServer();
    const transport = new SSEServerTransport("/message", res);
    const sessionId = transport.sessionId;

    // Limpar sessão após 2h (evita memory leak)
    const timer = setTimeout(() => transports.delete(sessionId), 2 * 60 * 60 * 1000);
    transports.set(sessionId, { transport, timer });
    res.on("close", () => { clearTimeout(timer); transports.delete(sessionId); });

    await server.connect(transport);
    return;
  }

  // Messages
  if (url.pathname === "/message" && req.method === "POST") {
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) { res.writeHead(400); res.end(JSON.stringify({ error: "sessionId obrigatório" })); return; }

    const entry = transports.get(sessionId);
    if (!entry)  { res.writeHead(404); res.end(JSON.stringify({ error: "Sessão não encontrada" })); return; }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end",  async () => {
      try   { await entry.transport.handlePostMessage(req, res, JSON.parse(body)); }
      catch { res.writeHead(500); res.end(JSON.stringify({ error: "Erro ao processar mensagem" })); }
    });
    return;
  }

  res.writeHead(404); res.end(JSON.stringify({ error: "Rota não encontrada" }));
});

httpServer.listen(PORT, () => {
  const totalTools = ALL_TEAMS.reduce((sum, t) => sum + t.tools.length, 0);
  console.log(`🚀 MCP local na porta ${PORT}`);
  console.log(`   → SSE:    http://localhost:${PORT}/sse`);
  console.log(`   → ${ALL_TEAMS.length} equipas, ${totalTools} ferramentas`);
  if (!process.env.N8N_WEBHOOK_URL) console.warn("⚠️  N8N_WEBHOOK_URL não configurado");
});
