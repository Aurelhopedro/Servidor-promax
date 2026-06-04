import axios from "axios";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Task } from "../types.js";
import { withRetry } from "../utils.js";

// ─── Supabase client (null se ENV não configurado) ────────────────────────
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    _supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }
  return _supabase;
}

// ─── Fallback in-memory (dev local sem Supabase) ─────────────────────────
const taskStore = new Map<string, Task>();

// ─── Persistência ─────────────────────────────────────────────────────────
async function saveTask(task: Task): Promise<void> {
  taskStore.set(task.id, task);
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("mcp_tasks").upsert({
    id:         task.id,
    team:       task.team,
    tool:       task.tool,
    payload:    task.payload,
    schedule:   task.schedule,
    priority:   task.priority,
    status:     task.status,
    updated_at: new Date().toISOString(),
  });
}

// ─── API pública ──────────────────────────────────────────────────────────
export async function scheduleTasks(tasks: Task[]): Promise<string[]> {
  const n8nUrl     = process.env.N8N_WEBHOOK_URL;
  const callbackUrl = process.env.MCP_CALLBACK_URL;

  if (!n8nUrl) throw new Error("N8N_WEBHOOK_URL não configurado no .env");

  const scheduledIds: string[] = [];
  const sorted = [...tasks].sort((a, b) => a.priority - b.priority);

  for (const task of sorted) {
    task.status = "running";
    await saveTask(task);

    try {
      await withRetry(async () => {
        await axios.post(n8nUrl, {
          taskId:      task.id,
          team:        task.team,
          tool:        task.tool,
          payload:     task.payload,
          schedule:    task.schedule,
          priority:    task.priority,
          callbackUrl: callbackUrl ?? "",
        });
      });
      scheduledIds.push(task.id);
    } catch {
      task.status = "failed";
      await saveTask(task);
    }
  }

  return scheduledIds;
}

export async function updateTaskStatus(
  taskId: string,
  status: Task["status"]
): Promise<void> {
  const local = taskStore.get(taskId);
  if (local) {
    local.status = status;
    await saveTask(local);
    return;
  }
  // tarefa pode estar no Supabase mas não na memória (após restart Vercel)
  const sb = getSupabase();
  if (sb) {
    await sb
      .from("mcp_tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", taskId);
  }
}

export async function getTaskStatus(taskId: string): Promise<Task | undefined> {
  const local = taskStore.get(taskId);
  if (local) return local;

  const sb = getSupabase();
  if (!sb) return undefined;

  const { data } = await sb
    .from("mcp_tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  return (data as Task) ?? undefined;
}

export async function getAllTasks(): Promise<Task[]> {
  const sb = getSupabase();
  if (!sb) return Array.from(taskStore.values());

  const { data } = await sb
    .from("mcp_tasks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (data as Task[]) ?? [];
}

/** Compatibilidade com código legado */
export function getTaskStore(): Map<string, Task> {
  return taskStore;
}
