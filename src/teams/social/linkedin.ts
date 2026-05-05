import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// LinkedIn API — Limite: 100 requests/dia por app
const LINKEDIN_API = "https://api.linkedin.com/v2";

function liHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN || ""}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

export const socialLiPostText: ToolDefinition = {
  name: "social_li_post_text",
  description: "Publicar post de texto no LinkedIn",
  inputSchema: z.object({
    authorUrn: z.string().describe("URN do autor (ex: urn:li:person:xxxxx)"),
    text: z.string(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        `${LINKEDIN_API}/ugcPosts`,
        {
          author: input.authorUrn,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: input.text },
              shareMediaCategory: "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
          },
        },
        liHeaders()
      );
      return makeSuccessResponse(taskId, { post: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const socialLiGetProfile: ToolDefinition = {
  name: "social_li_get_profile",
  description: "Obter perfil do utilizador no LinkedIn",
  inputSchema: z.object({}),
  execute: async (): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(`${LINKEDIN_API}/me`, undefined, liHeaders());
      return makeSuccessResponse(taskId, { profile: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const socialLinkedinTools: ToolDefinition[] = [
  socialLiPostText,
  socialLiGetProfile,
];
