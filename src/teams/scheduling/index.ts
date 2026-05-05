import type { TeamDefinition } from "../../types.js";
import { schedulingN8nTools } from "./n8nScheduler.js";
import { schedulingQstashTools } from "./qstash.js";
import { schedulingAgendaTools } from "./agenda.js";

export const schedulingTeam: TeamDefinition = {
  name: "scheduling",
  description: "EQUIPA 3 — Agendamento: n8n, QStash, Agenda local",
  tools: [...schedulingN8nTools, ...schedulingQstashTools, ...schedulingAgendaTools],
};
