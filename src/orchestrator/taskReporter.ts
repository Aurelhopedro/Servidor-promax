import { z } from "zod";
import { updateTaskStatus, getTaskStatus, getAllTasks } from "./taskScheduler.js";
import type { Task, ToolResponse } from "../types.js";

export const TaskCallbackSchema = z.object({
  taskId: z.string(),
  success: z.boolean(),
  data: z.record(z.unknown()).optional(),
  error: z.string().nullable().optional(),
});

export type TaskCallback = z.infer<typeof TaskCallbackSchema>;

export function handleTaskCallback(callback: TaskCallback): ToolResponse {
  const status: Task["status"] = callback.success ? "done" : "failed";
  updateTaskStatus(callback.taskId, status);

  return {
    success: true,
    taskId: callback.taskId,
    data: {
      taskId: callback.taskId,
      newStatus: status,
      result: callback.data || {},
    },
    error: null,
  };
}

export function getTaskReport(): ToolResponse {
  const tasks = getAllTasks();
  const summary = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    running: tasks.filter((t) => t.status === "running").length,
    done: tasks.filter((t) => t.status === "done").length,
    failed: tasks.filter((t) => t.status === "failed").length,
  };

  return {
    success: true,
    taskId: "report",
    data: { summary, tasks },
    error: null,
  };
}

export function getSingleTaskReport(taskId: string): ToolResponse {
  const task = getTaskStatus(taskId);
  if (!task) {
    return {
      success: false,
      taskId,
      data: {},
      error: `Tarefa ${taskId} não encontrada`,
    };
  }

  return {
    success: true,
    taskId,
    data: { task },
    error: null,
  };
}
