import { z } from "zod";
import {
  updateTaskStatus,
  getTaskStatus,
  getAllTasks,
} from "./taskScheduler";
import type { Task, ToolResponse } from "../types";

export const TaskCallbackSchema = z.object({
  taskId:  z.string(),
  success: z.boolean(),
  data:    z.record(z.unknown()).optional(),
  error:   z.string().nullable().optional(),
});

export type TaskCallback = z.infer<typeof TaskCallbackSchema>;

export async function handleTaskCallback(
  callback: TaskCallback
): Promise<ToolResponse> {
  const status: Task["status"] = callback.success ? "done" : "failed";
  await updateTaskStatus(callback.taskId, status);
  return {
    success: true,
    taskId:  callback.taskId,
    data: {
      taskId:    callback.taskId,
      newStatus: status,
      result:    callback.data ?? {},
    },
    error: null,
  };
}

export async function getTaskReport(): Promise<ToolResponse> {
  const tasks = await getAllTasks();
  return {
    success: true,
    taskId:  "report",
    data: {
      summary: {
        total:   tasks.length,
        pending: tasks.filter((t) => t.status === "pending").length,
        running: tasks.filter((t) => t.status === "running").length,
        done:    tasks.filter((t) => t.status === "done").length,
        failed:  tasks.filter((t) => t.status === "failed").length,
      },
      tasks,
    },
    error: null,
  };
}

export async function getSingleTaskReport(
  taskId: string
): Promise<ToolResponse> {
  const task = await getTaskStatus(taskId);
  if (!task) {
    return { success: false, taskId, data: {}, error: `Tarefa ${taskId} não encontrada` };
  }
  return { success: true, taskId, data: { task }, error: null };
}
