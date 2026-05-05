import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Limite gratuito E2B: 100 horas de sandbox/mês
const E2B_API = "https://api.e2b.dev/v1";

function e2bHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.E2B_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export const codeE2bRunCode: ToolDefinition = {
  name: "code_e2b_run_code",
  description: "Executar código num sandbox E2B",
  inputSchema: z.object({
    language: z.enum(["python", "javascript", "typescript", "bash"]),
    code: z.string(),
    timeout: z.number().default(30),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        `${E2B_API}/sandboxes`,
        {
          template: input.language as string,
          code: input.code as string,
          timeout: input.timeout as number,
        },
        e2bHeaders()
      );
      return makeSuccessResponse(taskId, { execution: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const codeE2bTools: ToolDefinition[] = [codeE2bRunCode];
