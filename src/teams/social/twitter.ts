import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Twitter/X API v2 — Limite gratuito: 1500 tweets/mês (write), 10000 reads/mês
const TWITTER_API = "https://api.twitter.com/2";

function twHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN || ""}`,
    "Content-Type": "application/json",
  };
}

export const socialTwPostTweet: ToolDefinition = {
  name: "social_tw_post_tweet",
  description: "Publicar tweet no Twitter/X",
  inputSchema: z.object({
    text: z.string().max(280),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        `${TWITTER_API}/tweets`,
        { text: input.text },
        twHeaders()
      );
      return makeSuccessResponse(taskId, { tweet: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const socialTwGetTimeline: ToolDefinition = {
  name: "social_tw_get_timeline",
  description: "Obter timeline do utilizador Twitter/X",
  inputSchema: z.object({
    userId: z.string(),
    maxResults: z.number().default(10),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(
        `${TWITTER_API}/users/${input.userId}/tweets`,
        { max_results: input.maxResults },
        twHeaders()
      );
      return makeSuccessResponse(taskId, { timeline: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const socialTwitterTools: ToolDefinition[] = [
  socialTwPostTweet,
  socialTwGetTimeline,
];
