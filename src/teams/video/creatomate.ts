import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Limite gratuito Creatomate: 5 renders/mês no plano free
const CREATOMATE_API = "https://api.creatomate.com/v1";

function cmHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.CREATOMATE_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export const videoCreatomateRender: ToolDefinition = {
  name: "video_creatomate_render",
  description: "Renderizar vídeo com template Creatomate",
  inputSchema: z.object({
    templateId: z.string(),
    modifications: z.record(z.unknown()).optional(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        `${CREATOMATE_API}/renders`,
        {
          template_id: input.templateId,
          modifications: input.modifications || {},
        },
        cmHeaders()
      );
      return makeSuccessResponse(taskId, { render: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const videoCreatomateGetRender: ToolDefinition = {
  name: "video_creatomate_get_render",
  description: "Obter estado de render Creatomate",
  inputSchema: z.object({
    renderId: z.string(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(
        `${CREATOMATE_API}/renders/${input.renderId}`,
        undefined,
        cmHeaders()
      );
      return makeSuccessResponse(taskId, { render: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const videoCreatomateTools: ToolDefinition[] = [
  videoCreatomateRender,
  videoCreatomateGetRender,
];
