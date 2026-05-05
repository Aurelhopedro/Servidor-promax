import type { TeamDefinition } from "../../types.js";
import { marketSerpTools } from "./serpapi.js";
import { marketBraveTools } from "./brave.js";
import { marketTavilyTools } from "./tavily.js";

export const marketTeam: TeamDefinition = {
  name: "market",
  description: "EQUIPA 5 — Mercado: SerpAPI, Brave Search, Tavily",
  tools: [...marketSerpTools, ...marketBraveTools, ...marketTavilyTools],
};
