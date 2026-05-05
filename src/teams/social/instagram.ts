import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Instagram Graph API via Meta — mesmos limites do Meta Graph API
const META_API = "https://graph.facebook.com/v19.0";

function metaParams(): Record<string, string> {
  return { access_token: process.env.META_ACCESS_TOKEN || "" };
}

export const socialIgPostImage: ToolDefinition = {
  name: "social_ig_post_image",
  description: "Publicar imagem no Instagram",
  inputSchema: z.object({
    imageUrl: z.string().url(),
    caption: z.string().optional(),
    igUserId: z.string(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      // Step 1: Create media container
      const container = await httpPost(`${META_API}/${input.igUserId}/media`, {
        image_url: input.imageUrl,
        caption: input.caption || "",
        ...metaParams(),
      }) as Record<string, unknown>;
      // Step 2: Publish
      const data = await httpPost(`${META_API}/${input.igUserId}/media_publish`, {
        creation_id: container.id,
        ...metaParams(),
      });
      return makeSuccessResponse(taskId, { post: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const socialIgPostReel: ToolDefinition = {
  name: "social_ig_post_reel",
  description: "Publicar Reel no Instagram",
  inputSchema: z.object({
    videoUrl: z.string().url(),
    caption: z.string().optional(),
    igUserId: z.string(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const container = await httpPost(`${META_API}/${input.igUserId}/media`, {
        video_url: input.videoUrl,
        caption: input.caption || "",
        media_type: "REELS",
        ...metaParams(),
      }) as Record<string, unknown>;
      const data = await httpPost(`${META_API}/${input.igUserId}/media_publish`, {
        creation_id: container.id,
        ...metaParams(),
      });
      return makeSuccessResponse(taskId, { reel: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const socialIgGetInsights: ToolDefinition = {
  name: "social_ig_get_insights",
  description: "Obter insights do perfil Instagram",
  inputSchema: z.object({
    igUserId: z.string(),
    metrics: z.array(z.string()).default(["impressions", "reach", "follower_count"]),
    period: z.enum(["day", "week", "month"]).default("day"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(`${META_API}/${input.igUserId}/insights`, {
        metric: (input.metrics as string[]).join(","),
        period: input.period,
        ...metaParams(),
      });
      return makeSuccessResponse(taskId, { insights: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const socialInstagramTools: ToolDefinition[] = [
  socialIgPostImage,
  socialIgPostReel,
  socialIgGetInsights,
];
