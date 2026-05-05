import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import type { Task } from "../types.js";

const VALID_TEAMS = [
  "code",
  "video",
  "scheduling",
  "social",
  "market",
  "marketing",
  "content",
  "publishing",
  "creative",
] as const;

export const DivideTasksInputSchema = z.object({
  message: z.string().describe("Mensagem original do utilizador"),
  tasks: z
    .array(
      z.object({
        team: z.enum(VALID_TEAMS).describe("Equipa que executa"),
        tool: z.string().describe("Ferramenta específica"),
        payload: z.record(z.unknown()).describe("Dados necessários"),
        schedule: z
          .string()
          .default("immediate")
          .describe("'immediate' ou cron expression"),
        priority: z
          .number()
          .min(1)
          .max(5)
          .default(3)
          .describe("Prioridade de 1 (máxima) a 5 (mínima)"),
      })
    )
    .describe("Lista de subtarefas identificadas pelo Claude"),
});

export type DivideTasksInput = z.infer<typeof DivideTasksInputSchema>;

export function divideTasks(input: DivideTasksInput): Task[] {
  return input.tasks.map((t) => ({
    id: uuidv4(),
    team: t.team,
    tool: t.tool,
    payload: t.payload,
    schedule: t.schedule,
    priority: t.priority,
    status: "pending" as const,
  }));
}
