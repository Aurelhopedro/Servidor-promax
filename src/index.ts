#!/usr/bin/env node
import "dotenv/config";
import http from "http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMcpServer, ALL_TEAMS } from "./server";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const SELF_URL = process.env.RENDER_EXTERNAL_URL ?? `https://servidor-promax.onrender.com`;

const transports = new Map<string, { transport: SSEServerTransport; timer: NodeJS.Timeout }>();

const httpServer = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,mcp-session-id");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  // OAuth metadata — necessário para Claude conectar como conector personalizado
  if (url.pathname === "/.well-known/oauth-authorization-server") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      issuer: SELF_URL,
      authorization_endpoint: `${SELF_URL}/oauth/authorize`,
      token_endpoint: `${SELF_URL}/oauth/token`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
    }));
    return;
  }

  // OAuth authorize — redireciona com code imediatamente (sem login)
  if (url.pathname === "/oauth/authorize") {
    const redirectUri = url.searchParams.get("redirect_uri") ?? "";
    const state = url.searchParams.get("state") ?? "";
    const code = "mcp-auth-code-" + Date.now();
    const redirect = `${redirectUri}?code=${code}&state=${state}`;
    res.writeHead(302, { Location: redirect });
    res.end();
    return;
  }

  // OAuth token — devolve token fixo
  if (url.pathname === "/oauth/token" && req.method === "POST") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      access_token: "mcp-static-token",
      token_type: "Bearer",
      expires_in: 86400,
    }));
    return;
  }

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
    const server = createMcpServer();
    const transport = new SSEServerTransport("/message", res);
    const sessionId = transport.sessionId;
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
      await fetch(`${SELF_URL}/health`);
      console.log(`🏓 Ping OK — ${new Date().toISOString()}`);
    } catch (err) {
      console.warn(`⚠️ Ping falhou: ${err}`);
    }
  }, 10 * 60 * 1000);
});
