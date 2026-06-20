import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types";
import { httpGet, httpPost, makeSuccessResponse, makeErrorResponse } from "../../utils";
import { v4 as uuidv4 } from "uuid";

const GITHUB_API = "https://api.github.com";

// account: "principal" usa GITHUB_TOKEN | "machai" usa GITHUB_TOKEN2
function ghHeaders(account: string = "principal"): Record<string, string> {
  const token = account === "machai" ? process.env.GITHUB_TOKEN2 : process.env.GITHUB_TOKEN;
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export const codeGithubCreateRepo: ToolDefinition = {
  name: "code_github_create_repo",
  description: "Criar repositório no GitHub",
  inputSchema: z.object({
    name: z.string(),
    description: z.string().optional(),
    isPrivate: z.boolean().default(false),
    account: z.enum(["principal", "machai"]).default("principal"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        `${GITHUB_API}/user/repos`,
        {
          name: input.name as string,
          description: (input.description as string) || "",
          private: input.isPrivate as boolean,
        },
        ghHeaders(input.account as string)
      );
      return makeSuccessResponse(taskId, { repo: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const codeGithubCreateIssue: ToolDefinition = {
  name: "code_github_create_issue",
  description: "Criar issue num repositório GitHub",
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    title: z.string(),
    body: z.string().optional(),
    labels: z.array(z.string()).optional(),
    account: z.enum(["principal", "machai"]).default("principal"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        `${GITHUB_API}/repos/${input.owner}/${input.repo}/issues`,
        {
          title: input.title as string,
          body: (input.body as string) || "",
          labels: (input.labels as string[]) || [],
        },
        ghHeaders(input.account as string)
      );
      return makeSuccessResponse(taskId, { issue: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const codeGithubListRepos: ToolDefinition = {
  name: "code_github_list_repos",
  description: "Listar repositórios do utilizador autenticado",
  inputSchema: z.object({
    perPage: z.number().default(30),
    page: z.number().default(1),
    account: z.enum(["principal", "machai"]).default("principal"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(
        `${GITHUB_API}/user/repos`,
        { per_page: input.perPage, page: input.page },
        ghHeaders(input.account as string)
      );
      return makeSuccessResponse(taskId, { repos: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const codeGithubTools: ToolDefinition[] = [
  codeGithubCreateRepo,
  codeGithubCreateIssue,
  codeGithubListRepos,
];
