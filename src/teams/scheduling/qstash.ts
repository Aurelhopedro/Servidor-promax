import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Limite gratuito QStash: 500 mensagens/dia
const QSTASH_API = "https://qstash.upstash.io/v2";

function qsHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export const schedulingQstashPublish: ToolDefinition = {
  name: "scheduling_qstash_publish",
  description: "Publicar mensagem na fila QStash para processamento assíncrono",
  inputSchema: z.object({
    destinationUrl: z.string().url(),
    body: z.record(z.unknown()),
    delay: z.number().optional().describe("Delay em segundos"),
    retries: z.number().default(3),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const headers: Record<string, string> = {
        ...qsHeaders(),
        "Upstash-Forward-Content-Type": "application/json",
      };
      if (input.delay) {
        headers["Upstash-Delay"] = `${input.delay}s`;
      }
      headers["Upstash-Retries"] = String(input.retries ?? 3);

      const data = await httpPost(
        `${QSTASH_API}/publish/${input.destinationUrl}`,
        input.body as Record<string, unknown>,
        headers
      );
      return makeSuccessResponse(taskId, { message: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const schedulingQstashSchedule: ToolDefinition = {
  name: "scheduling_qstash_schedule",
  description: "Agendar mensagem recorrente no QStash com cron",
  inputSchema: z.object({
    destinationUrl: z.string().url(),
    body: z.record(z.unknown()),
    cron: z.string(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const headers: Record<string, string> = {
        ...qsHeaders(),
        "Upstash-Cron": input.cron as string,
      };
      const data = await httpPost(
        `${QSTASH_API}/publish/${input.destinationUrl}`,
        input.body as Record<string, unknown>,
        headers
      );
      return makeSuccessResponse(taskId, { schedule: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const schedulingQstashTools: ToolDefinition[] = [
  schedulingQstashPublish,
  schedulingQstashSchedule,
];
