import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// WordPress REST API — sem limites (self-hosted)

function wpHeaders(): Record<string, string> {
  const auth = Buffer.from(
    `${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`
  ).toString("base64");
  return {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  };
}

function wpUrl(path: string): string {
  return `${process.env.WP_URL}/wp-json/wp/v2${path}`;
}

export const contentWpCreatePost: ToolDefinition = {
  name: "content_wp_create_post",
  description: "Criar post no WordPress",
  inputSchema: z.object({
    title: z.string(),
    content: z.string(),
    status: z.enum(["publish", "draft", "pending"]).default("draft"),
    categories: z.array(z.number()).optional(),
    tags: z.array(z.number()).optional(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        wpUrl("/posts"),
        {
          title: input.title,
          content: input.content,
          status: input.status,
          categories: input.categories || [],
          tags: input.tags || [],
        },
        wpHeaders()
      );
      return makeSuccessResponse(taskId, { post: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const contentWpGetPosts: ToolDefinition = {
  name: "content_wp_get_posts",
  description: "Listar posts do WordPress",
  inputSchema: z.object({
    perPage: z.number().default(10),
    page: z.number().default(1),
    status: z.string().default("publish"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(
        wpUrl("/posts"),
        { per_page: input.perPage, page: input.page, status: input.status },
        wpHeaders()
      );
      return makeSuccessResponse(taskId, { posts: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const contentWordpressTools: ToolDefinition[] = [
  contentWpCreatePost,
  contentWpGetPosts,
];
