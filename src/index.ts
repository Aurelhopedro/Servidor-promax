#!/usr/bin/env node
import "dotenv/config";
import http from "http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMcpServer, ALL_TEAMS } from "./server";
import {
  validateBearerToken,
  validateHmacSignature,
  checkRateLimit,
  sendUnauthorized,
  sendForbidden,
  sendTooManyRequests,
  logSecurityEvent,
  readBody,
} from "./auth";

// ─── Configuração ─────────────────────────────────────────────────────────

const PORT     = parseInt(process.env.PORT ?? "3000", 10);
const SELF_URL = process.env.RENDER_EXTERNAL_URL ?? `https://servidor-promax.onrender.com`;

// ─── Aviso de segurança no arranque ──────────────────────────────────────

if (!process.env.MCP_API_KEY) {
  console.warn("⚠️  AVISO: MCP_API_KEY não definida — servidor em modo dev (sem autenticação).");
  console.warn("   Define MCP_API_KEY no .env para proteger o servidor em produção.");
}
if (!process.env.N8N_CALLBACK_SECRET) {
  console.warn("⚠️  AVISO: N8N_CALLBACK_SECRET não definida — callbacks do n8n não validados.");
}

// ─── Sessões SSE ──────────────────────────────────────────────────────────

const transports = new Map<string, { transport: SSEServerTransport; timer: NodeJS.Timeout }>();

// ─── Servidor HTTP ────────────────────────────────────────────────────────

const httpServer = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,mcp-session-id,X-Signature");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  // ── Rate Limiting (aplica a todas as rotas) ───────────────────────────
  if (!checkRateLimit(req)) {
    logSecurityEvent("RATE_LIMIT", req);
    sendTooManyRequests(res);
    return;
  }

  // ── OAuth metadata ────────────────────────────────────────────────────
  // Necessário para compatibilidade com clientes MCP que esperam OAuth.
  if (url.pathname === "/.well-known/oauth-authorization-server") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      issuer:                            SELF_URL,
      authorization_endpoint:            `${SELF_URL}/oauth/authorize`,
      token_endpoint:                    `${SELF_URL}/oauth/token`,
      registration_endpoint:             `${SELF_URL}/oauth/register`,
      response_types_supported:          ["code"],
      grant_types_supported:             ["authorization_code"],
      code_challenge_methods_supported:  ["S256"],
    }));
    return;
  }

  // ── OAuth register ────────────────────────────────────────────────────
  if (url.pathname === "/oauth/register" && req.method === "POST") {
    // Regista clientes MCP dinamicamente.
    // A autenticação real é feita via Bearer token no /sse.
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      client_id:          "mcp-agregador-client",
      client_secret:      "not-used",  // Não é usado — auth é via MCP_API_KEY
      client_id_issued_at: Math.floor(Date.now() / 1000),
      grant_types:        ["authorization_code"],
      response_types:     ["code"],
    }));
    return;
  }

  // ── OAuth authorize ───────────────────────────────────────────────────
  if (url.pathname === "/oauth/authorize") {
    const redirectUri = url.searchParams.get("redirect_uri") ?? "";
    const state       = url.searchParams.get("state")        ?? "";
    const code        = crypto.randomUUID();  // código único por pedido
    const redirect    = `${redirectUri}?code=${code}&state=${state}`;
    res.writeHead(302, { Location: redirect });
    res.end();
    return;
  }

  // ── OAuth token ───────────────────────────────────────────────────────
  if (url.pathname === "/oauth/token" && req.method === "POST") {
    // Devolve o MCP_API_KEY como Bearer token para que o cliente
    // o inclua nos pedidos subsequentes ao /sse.
    const apiKey = process.env.MCP_API_KEY ?? "dev-no-auth";
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      access_token: apiKey,
      token_type:   "Bearer",
      expires_in:   86400,
    }));
    return;
  }

  // ── Health check (público — não requer auth) ──────────────────────────
  if (url.pathname === "/" || url.pathname === "/health") {
    const totalTools = ALL_TEAMS.reduce((sum, t) => sum + t.tools.length, 0);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name:    "mcp-agregador",
      status:  "ok",
      teams:   ALL_TEAMS.length,
      tools:   totalTools,
      authEnabled: !!process.env.MCP_API_KEY,
    }));
    return;
  }

  // ── Callback do n8n (endpoint HTTP directo) ───────────────────────────
  // O n8n chama este endpoint quando uma tarefa termina.
  // Protegido por HMAC-SHA256 via header X-Signature.
  if (url.pathname === "/callback" && req.method === "POST") {
    const body = await readBody(req);
    const signature = req.headers["x-signature"];

    if (!validateHmacSignature(body, signature)) {
      logSecurityEvent("HMAC_FAIL", req);
      sendForbidden(res, "Assinatura HMAC inválida");
      return;
    }

    try {
      const payload = JSON.parse(body);
      // Reencaminha para o handler interno como se fosse uma tool call
      const { handleTaskCallback, TaskCallbackSchema } = await import("./orchestrator/taskReporter");
      const parsed = TaskCallbackSchema.parse(payload);
      const result = await handleTaskCallback(parsed);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Payload inválido", detail: String(err) }));
    }
    return;
  }

  // ── A partir daqui: autenticação obrigatória ──────────────────────────

  if (!validateBearerToken(req)) {
    logSecurityEvent("AUTH_FAIL", req, `path=${url.pathname}`);
    sendUnauthorized(res);
    return;
  }

  // ── SSE ───────────────────────────────────────────────────────────────
  if (url.pathname === "/sse") {
    logSecurityEvent("AUTH_OK", req, "SSE connect");
    const server    = createMcpServer();
    const transport = new SSEServerTransport("/message", res);
    const sessionId = transport.sessionId;
    const timer     = setTimeout(() => transports.delete(sessionId), 2 * 60 * 60 * 1000);
    transports.set(sessionId, { transport, timer });
    res.on("close", () => { clearTimeout(timer); transports.delete(sessionId); });
    await server.connect(transport);
    return;
  }

  // ── Messages ──────────────────────────────────────────────────────────
  if (url.pathname === "/message" && req.method === "POST") {
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) {
      res.writeHead(400); res.end(JSON.stringify({ error: "sessionId obrigatório" })); return;
    }
    const entry = transports.get(sessionId);
    if (!entry) {
      res.writeHead(404); res.end(JSON.stringify({ error: "Sessão não encontrada" })); return;
    }
    const body = await readBody(req);
    try {
      await entry.transport.handlePostMessage(req, res, JSON.parse(body));
    } catch {
      res.writeHead(500); res.end(JSON.stringify({ error: "Erro ao processar mensagem" }));
    }
    return;
  }

  res.writeHead(404); res.end(JSON.stringify({ error: "Rota não encontrada" }));
});

// ─── Arranque ─────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  const totalTools = ALL_TEAMS.reduce((sum, t) => sum + t.tools.length, 0);
  console.log(`🚀 MCP servidor na porta ${PORT}`);
  console.log(`   → SSE:      ${SELF_URL}/sse`);
  console.log(`   → Callback: ${SELF_URL}/callback`);
  console.log(`   → Health:   ${SELF_URL}/health`);
  console.log(`   → OAuth:    ${SELF_URL}/.well-known/oauth-authorization-server`);
  console.log(`   → ${ALL_TEAMS.length} equipas, ${totalTools} ferramentas`);
  console.log(`   → Auth:     ${process.env.MCP_API_KEY ? "✅ ACTIVA" : "⚠️  DESACTIVADA (dev)"}`);

  // Anti-hibernação
  setInterval(async () => {
    try {
      await fetch(`${SELF_URL}/health`);
      console.log(`🏓 Ping OK — ${new Date().toISOString()}`);
    } catch (err) {
      console.warn(`⚠️ Ping falhou: ${err}`);
    }
  }, 10 * 60 * 1000);
});
