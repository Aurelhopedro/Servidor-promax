import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

// Ghost Admin API — self-hosted, sem limites
function ghostAdminToken(): string {
  const key = process.env.GHOST_ADMIN_API_KEY || "";
  const [id, secret] = key.split(":");
  if (!id || !secret) return "";

  const iat = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ iat, exp: iat + 300, aud: "/admin/" })).toString("base64url");
  const signature = crypto
    .createHmac("sha256", Buffer.from(secret, "hex"))
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function ghostHeaders(): Record<string, string> {
  return {
    Authorization: `Ghost ${ghostAdminToken()}`,
    "Content-Type": "application/json",
  };
}

function ghostUrl(path: string): string {
  return `${process.env.GHOST_URL}/ghost/api/admin${path}`;
}

export const publishGhostCreatePost: ToolDefinition = {
  name: "publish_article_to_ghost",
  description: "Publicar artigo no Ghost",
  inputSchema: z.object({
    title: z.string(),
    html: z.string(),
    status: z.enum(["published", "draft", "scheduled"]).default("draft"),
    tags: z.array(z.string()).optional(),
    publishedAt: z.string().optional(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const post: Record<string, unknown> = {
        title: input.title,
        html: input.html,
        status: input.status,
      };
      if (input.tags) {
        post.tags = (input.tags as string[]).map((t) => ({ name: t }));
      }
      if (input.publishedAt) {
        post.published_at = input.publishedAt;
      }
      const data = await httpPost(
        ghostUrl("/posts/"),
        { posts: [post] },
        ghostHeaders()
      );
      return makeSuccessResponse(taskId, { post: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const publishGhostGetPosts: ToolDefinition = {
  name: "publish_ghost_get_posts",
  description: "Listar posts do Ghost",
  inputSchema: z.object({
    limit: z.number().default(10),
    status: z.string().default("all"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(
        ghostUrl("/posts/"),
        { limit: input.limit, filter: `status:${input.status}` },
        ghostHeaders()
      );
      return makeSuccessResponse(taskId, { posts: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const publishGhostTools: ToolDefinition[] = [
  publishGhostCreatePost,
  publishGhostGetPosts,
];
