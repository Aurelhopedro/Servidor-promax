import axios from "axios";
import type { Task } from "../types.js";
import { withRetry } from "../utils.js";

const taskStore = new Map<string, Task>();

export function getTaskStore(): Map<string, Task> {
  return taskStore;
}

export async function scheduleTasks(tasks: Task[]): Promise<string[]> {
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  const callbackUrl = process.env.MCP_CALLBACK_URL;

  if (!n8nUrl) {
    throw new Error("N8N_WEBHOOK_URL não configurado no .env");
  }

  const scheduledIds: string[] = [];

  const sorted = [...tasks].sort((a, b) => a.priority - b.priority);

  for (const task of sorted) {
    task.status = "running";
    taskStore.set(task.id, task);

    try {
      await withRetry(async () => {
        await axios.post(n8nUrl, {
          taskId: task.id,
          team: task.team,
          tool: task.tool,
          payload: task.payload,
          schedule: task.schedule,
          priority: task.priority,
          callbackUrl: callbackUrl || "",
        });
      });
      scheduledIds.push(task.id);
    } catch (err) {
      task.status = "failed";
      taskStore.set(task.id, task);
    }
  }

  return scheduledIds;
}

export function updateTaskStatus(
  taskId: string,
  status: Task["status"]
): void {
  const task = taskStore.get(taskId);
  if (task) {
    task.status = status;
    taskStore.set(taskId, task);
  }
}

export function getTaskStatus(taskId: string): Task | undefined {
  return taskStore.get(taskId);
}

export function getAllTasks(): Task[] {
  return Array.from(taskStore.values());
}
