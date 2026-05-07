#!/usr/bin/env node
import "dotenv/config";
import http from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

import type { TeamDefinition, ToolResponse } from "./types.js";
import {
  divideTasks,
  DivideTasksInputSchema,
} from "./orchestrator/taskDivider.js";
import { scheduleTasks } from "./orchestrator/taskScheduler.js";
import {
  handleTaskCallback,
  getTaskReport,
  getSingleTaskReport,
  TaskCallbackSchema,
} from "./orchestrator/taskReporter.js";

// Importar todas as equipas
import { codeTeam } from "./teams/code/index.js";
import { videoTeam } from "./teams/video/index.js";
import { schedulingTeam } from "./teams/scheduling/index.js";
import { socialTeam } from "./teams/social/index.js";
import { marketTeam } from "./teams/market/index.js";
import { marketingTeam } from "./teams/marketing/index.js";
import { contentTeam } from "./teams/content/index.js";
import { publishingTeam } from "./teams/publishing/index.js";
import { creativeTeam } from "./teams/creative/index.js";

const ALL_TEAMS: TeamDefinition[] = [
  codeTeam,
  videoTeam,
  schedulingTeam,
  socialTeam,
  marketTeam,
  marketingTeam,
  contentTeam,
  publishingTeam,
  creativeTeam,
];

const PORT = parseInt(process.env.PORT || "3000", 10);

// Mapa de transportes SSE activos por sessão
const transports = new Map<string, SSEServerTransport>();

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "mcp-agregador",
    version: "1.0.0",
  });

  // ─── Orquestrador ────────────────────────────────────────────────────────
  server.tool(
    "orchestrate",
    "Recebe 1 mensagem, divide em subtarefas e delega para as equipas via n8n.",
    DivideTasksInputSchema.shape,
    async (input) => {
      const parsed = DivideTasksInputSchema.parse(input);
      const tasks = divideTasks(parsed);

      let scheduledIds: string[] = [];
      let warning: string | null = null;

      if (!process.env.N8N_WEBHOOK_URL) {
        warning = "N8N_WEBHOOK_URL não configurado — tarefas não enviadas para n8n";
      } else {
        scheduledIds = await scheduleTasks(tasks);
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              taskId: "orchestrate",
              data: {
                totalTasks: tasks.length,
                scheduledTasks: scheduledIds.length,
                taskIds: scheduledIds,
                message: warning || `${scheduledIds.length}/${tasks.length} tarefas enviadas para n8n`,
              },
              error: warning,
            } satisfies ToolResponse),
          },
        ],
      };
    }
  );

  // ─── Callback do n8n ─────────────────────────────────────────────────────
  server.tool(
    "task_callback",
    "Recebe callback do n8n quando uma tarefa termina.",
    TaskCallbackSchema.shape,
    async (input) => {
      const parsed = TaskCallbackSchema.parse(input);
      const result = handleTaskCallback(parsed);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result) }],
      };
    }
  );

  // ─── Relatório de tarefas ─────────────────────────────────────────────────
  server.tool(
    "task_report",
    "Relatório geral de todas as tarefas (pending, running, done, failed)",
    {},
    async () => {
      const result = getTaskReport();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result) }],
      };
    }
  );

  server.tool(
    "task_status",
    "Obter estado de uma tarefa específica pelo ID",
    { taskId: z.string() },
    async (input) => {
      const result = getSingleTaskReport(input.taskId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result) }],
      };
    }
  );

  // ─── Ferramentas de todas as equipas ────────────────────────────────────
  for (const team of ALL_TEAMS) {
    for (const tool of team.tools) {
      server.tool(
        tool.name,
        `[${team.name}] ${tool.description}`,
        (tool.inputSchema as z.ZodObject<z.ZodRawShape>).shape,
        async (input) => {
          const result = await tool.execute(input as Record<string, unknown>);
          return {
            content: [
              { type: "text" as const, text: JSON.stringify(result) },
            ],
          };
        }
      );
    }
  }

  // ─── Listar equipas ──────────────────────────────────────────────────────
  server.tool(
    "list_teams",
    "Lista todas as equipas e ferramentas disponíveis",
    {},
    async () => {
      const teams = ALL_TEAMS.map((t) => ({
        name: t.name,
        description: t.description,
        tools: t.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
        })),
        totalTools: t.tools.length,
      }));
      const totalTools = teams.reduce((sum, t) => sum + t.totalTools, 0);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              taskId: "list_teams",
              data: { teams, totalTeams: teams.length, totalTools },
              error: null,
            } satisfies ToolResponse),
          },
        ],
      };
    }
  );

  return server;
}

// ─── Servidor HTTP ─────────────────────────────────────────────────────────
const httpServer = http.createServer(async (req, res) => {
  // CORS — necessário para Claude.ai
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  // ── Health check ──────────────────────────────────────────────────────────
  if (url.pathname === "/" || url.pathname === "/health") {
    const totalTools = ALL_TEAMS.reduce((sum, t) => sum + t.tools.length, 0);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        name: "mcp-agregador",
        version: "1.0.0",
        status: "ok",
        teams: ALL_TEAMS.length,
        tools: totalTools,
        n8n: !!process.env.N8N_WEBHOOK_URL,
      })
    );
    return;
  }

  // ── SSE — Claude.ai liga aqui para receber eventos ────────────────────────
  if (url.pathname === "/sse") {
    const server = createMcpServer();
    const transport = new SSEServerTransport("/message", res);
    const sessionId = transport.sessionId;
    transports.set(sessionId, transport);

    res.on("close", () => {
      transports.delete(sessionId);
    });

    await server.connect(transport);
    return;
  }

  // ── Messages — Claude.ai envia mensagens aqui ─────────────────────────────
  if (url.pathname === "/message" && req.method === "POST") {
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "sessionId obrigatório" }));
      return;
    }

    const transport = transports.get(sessionId);
    if (!transport) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Sessão não encontrada" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        await transport.handlePostMessage(req, res, JSON.parse(body));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Erro ao processar mensagem" }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Rota não encontrada" }));
});

httpServer.listen(PORT, () => {
  const totalTools = ALL_TEAMS.reduce((sum, t) => sum + t.tools.length, 0);
  console.log(`🚀 MCP Agregador HTTP+SSE iniciado na porta ${PORT}`);
  console.log(`   → Health: http://localhost:${PORT}/health`);
  console.log(`   → SSE:    http://localhost:${PORT}/sse`);
  console.log(`   → ${ALL_TEAMS.length} equipas, ${totalTools} ferramentas`);
  if (!process.env.N8N_WEBHOOK_URL) {
    console.warn("⚠️  N8N_WEBHOOK_URL não configurado — n8n desactivado");
  }
});
