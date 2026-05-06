import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

import type { TeamDefinition, ToolResponse } from "../types.js";
import {
  divideTasks,
  DivideTasksInputSchema,
} from "../orchestrator/taskDivider.js";
import { scheduleTasks } from "../orchestrator/taskScheduler.js";
import {
  handleTaskCallback,
  getTaskReport,
  getSingleTaskReport,
  TaskCallbackSchema,
} from "../orchestrator/taskReporter.js";

import { codeTeam } from "../teams/code/index.js";
import { videoTeam } from "../teams/video/index.js";
import { schedulingTeam } from "../teams/scheduling/index.js";
import { socialTeam } from "../teams/social/index.js";
import { marketTeam } from "../teams/market/index.js";
import { marketingTeam } from "../teams/marketing/index.js";
import { contentTeam } from "../teams/content/index.js";
import { publishingTeam } from "../teams/publishing/index.js";
import { creativeTeam } from "../teams/creative/index.js";

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

function createServer(): McpServer {
  const server = new McpServer({
    name: "mcp-agregador",
    version: "1.0.0",
  });

  server.tool(
    "orchestrate",
    "Recebe 1 mensagem, divide em subtarefas e delega para as equipas via n8n.",
    DivideTasksInputSchema.shape,
    async (input) => {
      const parsed = DivideTasksInputSchema.parse(input);
      const tasks = divideTasks(parsed);
      const scheduledIds = await scheduleTasks(tasks);
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
                message: `${scheduledIds.length}/${tasks.length} tarefas enviadas para n8n`,
              },
              error: null,
            } satisfies ToolResponse),
          },
        ],
      };
    }
  );

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

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, mcp-session-id",
    });
    res.end();
    return;
  }

  // Only POST supported
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed. Use POST." },
        id: null,
      })
    );
    return;
  }

  const server = createServer();

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    res.on("close", () => {
      transport.close();
      server.close();
    });
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        })
      );
    }
  }
}
