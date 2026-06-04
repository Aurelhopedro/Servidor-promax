import type { TeamDefinition } from "../../types";
import { contentGroqTools } from "./groq";
import { contentMistralTools } from "./mistral";
import { contentWordpressTools } from "./wordpress";

export const contentTeam: TeamDefinition = {
  name: "content",
  description: "EQUIPA 7 — Conteúdo/Texto: Groq (motor IA principal), Mistral, WordPress",
  tools: [...contentGroqTools, ...contentMistralTools, ...contentWordpressTools],
};
