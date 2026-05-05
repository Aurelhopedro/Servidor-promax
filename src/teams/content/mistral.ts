import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Limite gratuito Mistral: tier gratuito com rate limits generosos
const MISTRAL_API = "https://api.mistral.ai/v1";

function mistralHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export const contentMistralGenerate: ToolDefinition = {
  name: "content_mistral_generate",
  description: "Gerar texto com Mistral AI",
  inputSchema: z.object({
    prompt: z.string(),
    model: z.string().default("mistral-small-latest"),
    maxTokens: z.number().default(4096),
    temperature: z.number().default(0.7),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        `${MISTRAL_API}/chat/completions`,
        {
          model: input.model,
          messages: [{ role: "user", content: input.prompt }],
          max_tokens: input.maxTokens,
          temperature: input.temperature,
        },
        mistralHeaders()
      );
      return makeSuccessResponse(taskId, { generation: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const contentMistralTools: ToolDefinition[] = [contentMistralGenerate];
