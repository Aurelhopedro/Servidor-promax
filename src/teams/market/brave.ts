import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Limite gratuito Brave Search API: 2000 queries/mês
const BRAVE_API = "https://api.search.brave.com/res/v1/web/search";

function braveHeaders(): Record<string, string> {
  return {
    Accept: "application/json",
    "Accept-Encoding": "gzip",
    "X-Subscription-Token": process.env.BRAVE_API_KEY || "",
  };
}

export const marketBraveSearch: ToolDefinition = {
  name: "market_brave_search",
  description: "Pesquisar na web via Brave Search API",
  inputSchema: z.object({
    query: z.string(),
    count: z.number().default(10),
    country: z.string().default("PT"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(
        BRAVE_API,
        { q: input.query, count: input.count, country: input.country },
        braveHeaders()
      );
      return makeSuccessResponse(taskId, { results: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const marketBraveTools: ToolDefinition[] = [marketBraveSearch];
