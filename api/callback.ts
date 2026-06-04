import type { IncomingMessage, ServerResponse } from "http";
import { handleTaskCallback, TaskCallbackSchema } from "../src/orchestrator/taskReporter.js";

export const config = { maxDuration: 30 };

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  if (req.method !== "POST") {
    res.writeHead(405);
    res.end(JSON.stringify({ error: "Método não permitido" }));
    return;
  }

  // Ler body
  let body = "";
  await new Promise<void>((resolve) => {
    req.on("data", (chunk) => (body += chunk));
    req.on("end", resolve);
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400);
    res.end(JSON.stringify({ error: "JSON inválido" }));
    return;
  }

  const result = TaskCallbackSchema.safeParse(parsed);
  if (!result.success) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: "Payload inválido", details: result.error.flatten() }));
    return;
  }

  try {
    const response = await handleTaskCallback(result.data);
    res.writeHead(200);
    res.end(JSON.stringify(response));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: "Erro interno", details: String(err) }));
  }
}
