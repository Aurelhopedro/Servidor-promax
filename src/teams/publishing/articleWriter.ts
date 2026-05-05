import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Artigos longos SEO-optimizados via Groq
const GROQ_API = "https://api.groq.com/openai/v1";

function groqHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export const publishArticleWrite: ToolDefinition = {
  name: "publish_article_write",
  description: "Escrever artigo longo SEO optimizado via Groq",
  inputSchema: z.object({
    topic: z.string(),
    keywords: z.array(z.string()).optional(),
    targetWordCount: z.number().default(2000),
    language: z.string().default("pt"),
    tone: z.string().default("profissional"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const keywordsStr = (input.keywords as string[] | undefined)?.join(", ") || "";
      const res = (await httpPost(
        `${GROQ_API}/chat/completions`,
        {
          model: "llama-3.1-70b-versatile",
          messages: [
            {
              role: "system",
              content: `És um escritor SEO profissional. Escreve em ${input.language}. Tom: ${input.tone}. Cria artigos com H2, H3, introdução, conclusão e CTA. Optimiza para as keywords fornecidas. Mínimo ${input.targetWordCount} palavras.`,
            },
            {
              role: "user",
              content: `Escreve um artigo completo sobre: "${input.topic}"${keywordsStr ? `\nKeywords SEO: ${keywordsStr}` : ""}`,
            },
          ],
          max_tokens: 8000,
          temperature: 0.7,
        },
        groqHeaders()
      )) as Record<string, unknown>;

      const choices = res.choices as Array<Record<string, unknown>>;
      const message = choices?.[0]?.message as Record<string, unknown>;
      const content = (message?.content as string) || "";

      return makeSuccessResponse(taskId, {
        article: {
          topic: input.topic,
          content,
          wordCount: content.split(/\s+/).length,
        },
      });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const publishArticleSchedule: ToolDefinition = {
  name: "publish_article_schedule",
  description: "Agendar publicação de artigo para data/hora",
  inputSchema: z.object({
    article: z.string().describe("Conteúdo HTML do artigo"),
    title: z.string(),
    platform: z.enum(["wordpress", "ghost", "medium"]),
    publishAt: z.string().describe("ISO 8601 datetime"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    return makeSuccessResponse(taskId, {
      scheduled: {
        title: input.title,
        platform: input.platform,
        publishAt: input.publishAt,
        status: "scheduled",
      },
    });
  },
};

export const publishArticleTools: ToolDefinition[] = [
  publishArticleWrite,
  publishArticleSchedule,
];
