#!/usr/bin/env node
import "dotenv/config";
import http from "http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMcpServer, ALL_TEAMS } from "./server";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const SELF_URL = process.env.RENDER_EXTERNAL_URL ?? `http://localhost:${PORT}`;

const transports = new Map<string, { transport: SSEServerTransport; timer: NodeJS.Timeout }>();

const httpServer = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname === "/" || url.pathname === "/health") {
    const totalTools = ALL_TEAMS.reduce((sum, t) => sum + t.tools.length, 0);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name: "mcp-agregador", status: "ok",
      teams: ALL_TEAMS.length, tools: totalTools,
    }));
    return;
  }

  if (url.pathname === "/sse") {
    const server = createMcpServer();
    const transport = new SSEServerTransport("/message", res);
    const sessionId = transport.sessionId;
    const timer = setTimeout(() => transports.delete(sessionId), 2 * 60 * 60 * 1000);
    transports.set(sessionId, { transport, timer });
    res.on("close", () => { clearTimeout(timer); transports.delete(sessionId); });
    await server.connect(transport);
    return;
  }

  if (url.pathname === "/message" && req.method === "POST") {
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) { res.writeHead(400); res.end(JSON.stringify({ error: "sessionId obrigatório" })); return; }
    const entry = transports.get(sessionId);
    if (!entry) { res.writeHead(404); res.end(JSON.stringify({ error: "Sessão não encontrada" })); return; }
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try { await entry.transport.handlePostMessage(req, res, JSON.parse(body)); }
      catch { res.writeHead(500); res.end(JSON.stringify({ error: "Erro ao processar mensagem" })); }
    });
    return;
  }

  res.writeHead(404); res.end(JSON.stringify({ error: "Rota não encontrada" }));
});

httpServer.listen(PORT, () => {
  const totalTools = ALL_TEAMS.reduce((sum, t) => sum + t.tools.length, 0);
  console.log(`🚀 MCP servidor na porta ${PORT}`);
  console.log(`   → SSE:    ${SELF_URL}/sse`);
  console.log(`   → Health: ${SELF_URL}/health`);
  console.log(`   → ${ALL_TEAMS.length} equipas, ${totalTools} ferramentas`);

  // Ping a cada 10 minutos para evitar hibernação no Render free tier
  setInterval(async () => {
    try {
      const res = await fetch(`${SELF_URL}/health`);
      console.log(`🏓 Ping OK — ${new Date().toISOString()}`);
    } catch (err) {
      console.warn(`⚠️ Ping falhou: ${err}`);
    }
  }, 10 * 60 * 1000); // 10 minutos
});
