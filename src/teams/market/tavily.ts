import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Limite gratuito Tavily: 1000 pesquisas/mês
const TAVILY_API = "https://api.tavily.com";

export const marketTavilySearch: ToolDefinition = {
  name: "market_tavily_search",
  description: "Pesquisa web avançada com IA via Tavily",
  inputSchema: z.object({
    query: z.string(),
    searchDepth: z.enum(["basic", "advanced"]).default("basic"),
    maxResults: z.number().default(5),
    includeAnswer: z.boolean().default(true),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(`${TAVILY_API}/search`, {
        api_key: process.env.TAVILY_API_KEY,
        query: input.query,
        search_depth: input.searchDepth,
        max_results: input.maxResults,
        include_answer: input.includeAnswer,
      });
      return makeSuccessResponse(taskId, { results: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const marketTavilyExtract: ToolDefinition = {
  name: "market_tavily_extract",
  description: "Extrair conteúdo de URLs via Tavily",
  inputSchema: z.object({
    urls: z.array(z.string().url()),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(`${TAVILY_API}/extract`, {
        api_key: process.env.TAVILY_API_KEY,
        urls: input.urls,
      });
      return makeSuccessResponse(taskId, { extracted: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const marketTavilyTools: ToolDefinition[] = [
  marketTavilySearch,
  marketTavilyExtract,
];
