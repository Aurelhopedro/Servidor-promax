import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// TikTok Content Posting API — Limite: depende da app approval
const TIKTOK_API = "https://open.tiktokapis.com/v2";

function ttHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.TIKTOK_ACCESS_TOKEN || ""}`,
    "Content-Type": "application/json; charset=UTF-8",
  };
}

export const socialTtPostVideo: ToolDefinition = {
  name: "social_tt_post_video",
  description: "Publicar vídeo no TikTok",
  inputSchema: z.object({
    videoUrl: z.string().url(),
    title: z.string().optional(),
    privacyLevel: z.enum(["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"]).default("PUBLIC_TO_EVERYONE"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      // Step 1: Init upload
      const initData = await httpPost(
        `${TIKTOK_API}/post/publish/video/init/`,
        {
          post_info: {
            title: input.title || "",
            privacy_level: input.privacyLevel,
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: input.videoUrl,
          },
        },
        ttHeaders()
      );
      return makeSuccessResponse(taskId, { upload: initData });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const socialTtGetUserInfo: ToolDefinition = {
  name: "social_tt_get_user_info",
  description: "Obter informação do utilizador TikTok",
  inputSchema: z.object({
    fields: z.array(z.string()).default(["display_name", "follower_count", "video_count"]),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(
        `${TIKTOK_API}/user/info/`,
        { fields: (input.fields as string[]).join(",") },
        ttHeaders()
      );
      return makeSuccessResponse(taskId, { user: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const socialTiktokTools: ToolDefinition[] = [
  socialTtPostVideo,
  socialTtGetUserInfo,
];
