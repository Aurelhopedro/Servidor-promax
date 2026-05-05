import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Limite gratuito Notion API: 3 requests/segundo
const NOTION_API = "https://api.notion.com/v1";

function notionHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28",
  };
}

export const marketingNotionCreatePage: ToolDefinition = {
  name: "marketing_notion_create_page",
  description: "Criar página no Notion",
  inputSchema: z.object({
    parentId: z.string().describe("ID da database ou página pai"),
    title: z.string(),
    content: z.string().optional(),
    properties: z.record(z.unknown()).optional(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const children = input.content
        ? [
            {
              object: "block",
              type: "paragraph",
              paragraph: {
                rich_text: [{ type: "text", text: { content: input.content } }],
              },
            },
          ]
        : [];
      const data = await httpPost(
        `${NOTION_API}/pages`,
        {
          parent: { database_id: input.parentId },
          properties: input.properties || {
            title: {
              title: [{ text: { content: input.title } }],
            },
          },
          children,
        },
        notionHeaders()
      );
      return makeSuccessResponse(taskId, { page: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const marketingNotionQueryDb: ToolDefinition = {
  name: "marketing_notion_query_db",
  description: "Consultar database do Notion",
  inputSchema: z.object({
    databaseId: z.string(),
    filter: z.record(z.unknown()).optional(),
    sorts: z.array(z.record(z.unknown())).optional(),
    pageSize: z.number().default(10),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const body: Record<string, unknown> = {
        page_size: input.pageSize,
      };
      if (input.filter) body.filter = input.filter;
      if (input.sorts) body.sorts = input.sorts;
      const data = await httpPost(
        `${NOTION_API}/databases/${input.databaseId}/query`,
        body,
        notionHeaders()
      );
      return makeSuccessResponse(taskId, { results: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const marketingNotionSearch: ToolDefinition = {
  name: "marketing_notion_search",
  description: "Pesquisar no Notion",
  inputSchema: z.object({
    query: z.string(),
    pageSize: z.number().default(10),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        `${NOTION_API}/search`,
        { query: input.query, page_size: input.pageSize },
        notionHeaders()
      );
      return makeSuccessResponse(taskId, { results: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const marketingNotionTools: ToolDefinition[] = [
  marketingNotionCreatePage,
  marketingNotionQueryDb,
  marketingNotionSearch,
];
