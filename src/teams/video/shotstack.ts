import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Limite gratuito Shotstack: sandbox ilimitado, produção paga
const SHOTSTACK_API = "https://api.shotstack.io/stage/render";

function ssHeaders(): Record<string, string> {
  return {
    "x-api-key": process.env.SHOTSTACK_API_KEY || "",
    "Content-Type": "application/json",
  };
}

export const videoShotstackRender: ToolDefinition = {
  name: "video_shotstack_render",
  description: "Renderizar vídeo com Shotstack",
  inputSchema: z.object({
    timeline: z.record(z.unknown()),
    output: z.record(z.unknown()),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        SHOTSTACK_API,
        { timeline: input.timeline, output: input.output },
        ssHeaders()
      );
      return makeSuccessResponse(taskId, { render: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const videoShotstackGetRender: ToolDefinition = {
  name: "video_shotstack_get_render",
  description: "Obter estado de render Shotstack",
  inputSchema: z.object({
    renderId: z.string(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(
        `${SHOTSTACK_API}/${input.renderId}`,
        undefined,
        ssHeaders()
      );
      return makeSuccessResponse(taskId, { render: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const videoShotstackTools: ToolDefinition[] = [
  videoShotstackRender,
  videoShotstackGetRender,
];
