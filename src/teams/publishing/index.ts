import type { TeamDefinition } from "../../types.js";
import { publishBookTools } from "./bookGenerator.js";
import { publishArticleTools } from "./articleWriter.js";
import { publishGhostTools } from "./ghostPublisher.js";
import { publishMediumTools } from "./mediumPublisher.js";
import { publishKindleTools } from "./kindleFormatter.js";

export const publishingTeam: TeamDefinition = {
  name: "publishing",
  description:
    "EQUIPA 8 — Livros & Artigos: Gera livros capítulo a capítulo, artigos SEO, publica no Ghost/Medium, formata ePub/PDF",
  tools: [
    ...publishBookTools,
    ...publishArticleTools,
    ...publishGhostTools,
    ...publishMediumTools,
    ...publishKindleTools,
  ],
};
