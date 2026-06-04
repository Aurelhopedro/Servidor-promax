import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types";
import { makeSuccessResponse, makeErrorResponse } from "../../utils";
import { v4 as uuidv4 } from "uuid";

interface ScheduledTask {
  id: string;
  name: string;
  cron: string;
  team: string;
  tool: string;
  payload: Record<string, unknown>;
  active: boolean;
  createdAt: string;
}

const agendaStore = new Map<string, ScheduledTask>();

export const schedulingAgendaCreate: ToolDefinition = {
  name: "scheduling_agenda_create",
  description: "Criar entrada na agenda de tarefas",
  inputSchema: z.object({
    name: z.string(),
    cron: z.string(),
    team: z.string(),
    tool: z.string(),
    payload: z.record(z.unknown()),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const entry: ScheduledTask = {
        id: taskId,
        name: input.name as string,
        cron: input.cron as string,
        team: input.team as string,
        tool: input.tool as string,
        payload: input.payload as Record<string, unknown>,
        active: true,
        createdAt: new Date().toISOString(),
      };
      agendaStore.set(taskId, entry);
      return makeSuccessResponse(taskId, { scheduled: entry });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const schedulingAgendaList: ToolDefinition = {
  name: "scheduling_agenda_list",
  description: "Listar todas as tarefas agendadas",
  inputSchema: z.object({
    activeOnly: z.boolean().default(true),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    const all = Array.from(agendaStore.values());
    const filtered = input.activeOnly ? all.filter((t) => t.active) : all;
    return makeSuccessResponse(taskId, { schedules: filtered });
  },
};

export const schedulingAgendaCancel: ToolDefinition = {
  name: "scheduling_agenda_cancel",
  description: "Cancelar tarefa agendada",
  inputSchema: z.object({
    scheduleId: z.string(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    const entry = agendaStore.get(input.scheduleId as string);
    if (!entry) return makeErrorResponse(taskId, "Agendamento não encontrado");
    entry.active = false;
    agendaStore.set(entry.id, entry);
    return makeSuccessResponse(taskId, { cancelled: entry });
  },
};

export const schedulingAgendaTools: ToolDefinition[] = [
  schedulingAgendaCreate,
  schedulingAgendaList,
  schedulingAgendaCancel,
];
