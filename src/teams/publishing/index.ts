import type { TeamDefinition } from "../../types";
import { publishBookTools } from "./bookGenerator";
import { publishArticleTools } from "./articleWriter";
import { publishGhostTools } from "./ghostPublisher";
import { publishMediumTools } from "./mediumPublisher";
import { publishKindleTools } from "./kindleFormatter";

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
