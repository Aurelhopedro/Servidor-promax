import crypto from "crypto";
import type { IncomingMessage, ServerResponse } from "http";

// ─── Tipos ────────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// ─── Configuração ─────────────────────────────────────────────────────────

const RATE_LIMIT_MAX     = parseInt(process.env.RATE_LIMIT_MAX     ?? "60",    10);
const RATE_LIMIT_WINDOW  = parseInt(process.env.RATE_LIMIT_WINDOW  ?? "60000", 10); // ms

// ─── Bearer Token ─────────────────────────────────────────────────────────

/**
 * Valida o Authorization: Bearer <token> usando comparação segura
 * contra timing attacks. Se MCP_API_KEY não estiver definida, o servidor
 * fica em modo dev (sem autenticação) e avisa no arranque.
 */
export function validateBearerToken(req: IncomingMessage): boolean {
  const apiKey = process.env.MCP_API_KEY?.trim();

  if (!apiKey) {
    // Dev mode — sem chave configurada, aceita tudo (aviso já dado no arranque)
    return true;
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7).trim();

  try {
    const tokenBuf  = Buffer.from(token,  "utf8");
    const secretBuf = Buffer.from(apiKey, "utf8");
    if (tokenBuf.length !== secretBuf.length) return false;
    return crypto.timingSafeEqual(tokenBuf, secretBuf);
  } catch {
    return false;
  }
}

// ─── HMAC (callbacks do n8n) ──────────────────────────────────────────────

/**
 * Valida a assinatura HMAC-SHA256 dos webhooks vindos do n8n.
 * O n8n deve enviar o header X-Signature: sha256=<hmac>
 */
export function validateHmacSignature(
  body: string,
  signatureHeader: string | string[] | undefined
): boolean {
  const secret = process.env.N8N_CALLBACK_SECRET?.trim();
  if (!secret) return true; // Não configurado → aceita (dev mode)

  const signature = Array.isArray(signatureHeader)
    ? signatureHeader[0]
    : signatureHeader;

  if (!signature || !signature.startsWith("sha256=")) return false;

  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("hex");

  try {
    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expected,  "utf8");
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

// ─── Rate Limiting (in-memory, por IP) ───────────────────────────────────

const ipMap = new Map<string, RateLimitEntry>();

// Limpeza periódica para não acumular IPs antigos
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipMap.entries()) {
    if (now > entry.resetAt) ipMap.delete(ip);
  }
}, 5 * 60 * 1000);

export function checkRateLimit(req: IncomingMessage): boolean {
  const ip  = getClientIp(req);
  const now = Date.now();
  const entry = ipMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

// ─── Respostas de erro padronizadas ──────────────────────────────────────

export function sendUnauthorized(
  res: ServerResponse,
  message = "Token inválido ou ausente"
): void {
  res.writeHead(401, {
    "Content-Type": "application/json",
    "WWW-Authenticate": 'Bearer realm="mcp-agregador"',
  });
  res.end(JSON.stringify({ error: message }));
}

export function sendForbidden(
  res: ServerResponse,
  message = "Assinatura inválida"
): void {
  res.writeHead(403, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: message }));
}

export function sendTooManyRequests(res: ServerResponse): void {
  res.writeHead(429, {
    "Content-Type": "application/json",
    "Retry-After": String(Math.ceil(RATE_LIMIT_WINDOW / 1000)),
  });
  res.end(JSON.stringify({
    error: "Demasiados pedidos. Aguarda e tenta novamente.",
    retryAfterSeconds: Math.ceil(RATE_LIMIT_WINDOW / 1000),
  }));
}

// ─── Logger de segurança ──────────────────────────────────────────────────

export function logSecurityEvent(
  event: "AUTH_FAIL" | "RATE_LIMIT" | "HMAC_FAIL" | "AUTH_OK",
  req: IncomingMessage,
  extra?: string
): void {
  const ip   = getClientIp(req);
  const path = req.url ?? "/";
  const ts   = new Date().toISOString();
  // Prefixos distintos para facilitar grep nos logs do Render/Railway
  const prefix = event === "AUTH_OK" ? "✅ SEC" : "🚨 SEC";
  console.warn(`${prefix} [${ts}] ${event} ip=${ip} path=${path}${extra ? ` ${extra}` : ""}`);
}

// ─── Utilitário: lê body da request como string ───────────────────────────

export function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end",  () => resolve(body));
    req.on("error", reject);
  });
}
