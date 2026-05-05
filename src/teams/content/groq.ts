import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Limite gratuito Groq: 14400 requests/dia, 6000 tokens/min (depende do modelo)
const GROQ_API = "https://api.groq.com/openai/v1";

function groqHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export const contentGroqGenerate: ToolDefinition = {
  name: "content_groq_generate",
  description: "Gerar texto com Groq (Llama, Mixtral, etc.) — motor IA principal",
  inputSchema: z.object({
    prompt: z.string(),
    model: z.string().default("llama-3.1-70b-versatile"),
    maxTokens: z.number().default(4096),
    temperature: z.number().default(0.7),
    systemPrompt: z.string().optional(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const messages: Array<Record<string, string>> = [];
      if (input.systemPrompt) {
        messages.push({ role: "system", content: input.systemPrompt as string });
      }
      messages.push({ role: "user", content: input.prompt as string });

      const data = await httpPost(
        `${GROQ_API}/chat/completions`,
        {
          model: input.model,
          messages,
          max_tokens: input.maxTokens,
          temperature: input.temperature,
        },
        groqHeaders()
      );
      return makeSuccessResponse(taskId, { generation: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const contentGroqSummarize: ToolDefinition = {
  name: "content_groq_summarize",
  description: "Resumir texto usando Groq",
  inputSchema: z.object({
    text: z.string(),
    maxLength: z.number().default(500),
    language: z.string().default("pt"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        `${GROQ_API}/chat/completions`,
        {
          model: "llama-3.1-70b-versatile",
          messages: [
            {
              role: "system",
              content: `Resume o seguinte texto em ${input.language}, máximo ${input.maxLength} caracteres.`,
            },
            { role: "user", content: input.text },
          ],
          max_tokens: 1024,
          temperature: 0.3,
        },
        groqHeaders()
      );
      return makeSuccessResponse(taskId, { summary: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const contentGroqTools: ToolDefinition[] = [
  contentGroqGenerate,
  contentGroqSummarize,
];
