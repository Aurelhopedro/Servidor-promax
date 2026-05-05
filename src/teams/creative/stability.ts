import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Limite gratuito Stability AI: 25 créditos gratuitos na criação de conta
const STABILITY_API = "https://api.stability.ai/v2beta";

function stabilityHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
    Accept: "application/json",
  };
}

export const creativeStabilityGenerateImage: ToolDefinition = {
  name: "creative_stability_generate_image",
  description: "Gerar imagem com Stability AI (Stable Diffusion)",
  inputSchema: z.object({
    prompt: z.string(),
    negativePrompt: z.string().optional(),
    width: z.number().default(1024),
    height: z.number().default(1024),
    steps: z.number().default(30),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        `${STABILITY_API}/stable-image/generate/sd3`,
        {
          prompt: input.prompt,
          negative_prompt: input.negativePrompt || "",
          output_format: "png",
          width: input.width,
          height: input.height,
          steps: input.steps,
        },
        { ...stabilityHeaders(), "Content-Type": "application/json" }
      );
      return makeSuccessResponse(taskId, { image: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const creativeStabilityUpscale: ToolDefinition = {
  name: "creative_stability_upscale",
  description: "Aumentar resolução de imagem com Stability AI",
  inputSchema: z.object({
    imageUrl: z.string().url(),
    width: z.number().default(2048),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        `${STABILITY_API}/stable-image/upscale/creative`,
        {
          image: input.imageUrl,
          output_format: "png",
          width: input.width,
        },
        { ...stabilityHeaders(), "Content-Type": "application/json" }
      );
      return makeSuccessResponse(taskId, { upscaled: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const creativeStabilityTools: ToolDefinition[] = [
  creativeStabilityGenerateImage,
  creativeStabilityUpscale,
];
