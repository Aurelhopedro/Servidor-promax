import type { TeamDefinition } from "../../types";
import { schedulingN8nTools } from "./n8nScheduler";
import { schedulingQstashTools } from "./qstash";
import { schedulingAgendaTools } from "./agenda";

export const schedulingTeam: TeamDefinition = {
  name: "scheduling",
  description: "EQUIPA 3 — Agendamento: n8n, QStash, Agenda local",
  tools: [...schedulingN8nTools, ...schedulingQstashTools, ...schedulingAgendaTools],
};
