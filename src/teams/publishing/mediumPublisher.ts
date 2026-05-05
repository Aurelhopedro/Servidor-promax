import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Medium API — Limite: sem rate limit documentado, mas usar com moderação
const MEDIUM_API = "https://api.medium.com/v1";

function mediumHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.MEDIUM_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export const publishMediumCreatePost: ToolDefinition = {
  name: "publish_article_to_medium",
  description: "Publicar artigo no Medium via API",
  inputSchema: z.object({
    title: z.string(),
    contentFormat: z.enum(["html", "markdown"]).default("html"),
    content: z.string(),
    tags: z.array(z.string()).max(5).optional(),
    publishStatus: z.enum(["public", "draft", "unlisted"]).default("draft"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      // Get user ID first
      const user = (await httpGet(
        `${MEDIUM_API}/me`,
        undefined,
        mediumHeaders()
      )) as Record<string, unknown>;
      const userData = user.data as Record<string, unknown>;
      const userId = userData.id as string;

      const data = await httpPost(
        `${MEDIUM_API}/users/${userId}/posts`,
        {
          title: input.title,
          contentFormat: input.contentFormat,
          content: input.content,
          tags: input.tags || [],
          publishStatus: input.publishStatus,
        },
        mediumHeaders()
      );
      return makeSuccessResponse(taskId, { post: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const publishMediumTools: ToolDefinition[] = [publishMediumCreatePost];
