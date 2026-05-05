import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// n8n self-hosted: sem limites de execução

export const schedulingN8nSend: ToolDefinition = {
  name: "scheduling_n8n_send_task",
  description: "Enviar tarefa para n8n via webhook para execução imediata",
  inputSchema: z.object({
    team: z.string(),
    tool: z.string(),
    payload: z.record(z.unknown()),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const n8nUrl = process.env.N8N_WEBHOOK_URL;
      if (!n8nUrl) throw new Error("N8N_WEBHOOK_URL não configurado");
      const data = await httpPost(n8nUrl, {
        taskId,
        team: input.team,
        tool: input.tool,
        payload: input.payload,
        callbackUrl: process.env.MCP_CALLBACK_URL || "",
      });
      return makeSuccessResponse(taskId, { n8nResponse: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const schedulingN8nScheduleCron: ToolDefinition = {
  name: "scheduling_n8n_schedule_cron",
  description: "Agendar tarefa no n8n com expressão cron",
  inputSchema: z.object({
    team: z.string(),
    tool: z.string(),
    payload: z.record(z.unknown()),
    cron: z.string().describe("Expressão cron (ex: '0 9 * * *' para 9h diário)"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const n8nUrl = process.env.N8N_WEBHOOK_URL;
      if (!n8nUrl) throw new Error("N8N_WEBHOOK_URL não configurado");
      const data = await httpPost(n8nUrl, {
        taskId,
        team: input.team,
        tool: input.tool,
        payload: input.payload,
        schedule: input.cron,
        callbackUrl: process.env.MCP_CALLBACK_URL || "",
      });
      return makeSuccessResponse(taskId, { scheduled: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const schedulingN8nTools: ToolDefinition[] = [
  schedulingN8nSend,
  schedulingN8nScheduleCron,
];
