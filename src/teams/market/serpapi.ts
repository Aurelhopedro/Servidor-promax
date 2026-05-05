import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Limite gratuito SerpAPI: 100 pesquisas/mês
const SERPAPI_URL = "https://serpapi.com/search.json";

export const marketSerpSearch: ToolDefinition = {
  name: "market_serp_search",
  description: "Pesquisar no Google via SerpAPI",
  inputSchema: z.object({
    query: z.string(),
    location: z.string().optional(),
    num: z.number().default(10),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(SERPAPI_URL, {
        q: input.query,
        location: input.location || "",
        num: input.num,
        api_key: process.env.SERPAPI_KEY,
      });
      return makeSuccessResponse(taskId, { results: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const marketSerpTrends: ToolDefinition = {
  name: "market_serp_trends",
  description: "Obter tendências de pesquisa via SerpAPI Google Trends",
  inputSchema: z.object({
    query: z.string(),
    geo: z.string().default("PT"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet("https://serpapi.com/search.json", {
        engine: "google_trends",
        q: input.query,
        geo: input.geo,
        api_key: process.env.SERPAPI_KEY,
      });
      return makeSuccessResponse(taskId, { trends: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const marketSerpTools: ToolDefinition[] = [
  marketSerpSearch,
  marketSerpTrends,
];
