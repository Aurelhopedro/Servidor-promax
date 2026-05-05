import { z } from "zod";

export const TaskSchema = z.object({
  id: z.string().uuid(),
  team: z.string(),
  tool: z.string(),
  payload: z.record(z.unknown()),
  schedule: z.string().default("immediate"),
  priority: z.number().min(1).max(5).default(3),
  status: z.enum(["pending", "running", "done", "failed"]).default("pending"),
});

export type Task = z.infer<typeof TaskSchema>;

export interface TaskResult {
  success: boolean;
  taskId: string;
  data: Record<string, unknown>;
  error: string | null;
}

export interface ToolResponse {
  success: boolean;
  taskId: string;
  data: Record<string, unknown>;
  error: string | null;
}

export interface TeamDefinition {
  name: string;
  description: string;
  tools: ToolDefinition[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  execute: (input: Record<string, unknown>) => Promise<ToolResponse>;
}
