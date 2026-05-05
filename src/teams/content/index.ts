import type { TeamDefinition } from "../../types.js";
import { contentGroqTools } from "./groq.js";
import { contentMistralTools } from "./mistral.js";
import { contentWordpressTools } from "./wordpress.js";

export const contentTeam: TeamDefinition = {
  name: "content",
  description: "EQUIPA 7 — Conteúdo/Texto: Groq (motor IA principal), Mistral, WordPress",
  tools: [...contentGroqTools, ...contentMistralTools, ...contentWordpressTools],
};
