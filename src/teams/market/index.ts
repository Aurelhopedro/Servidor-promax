import type { TeamDefinition } from "../../types";
import { marketSerpTools } from "./serpapi";
import { marketBraveTools } from "./brave";
import { marketTavilyTools } from "./tavily";

export const marketTeam: TeamDefinition = {
  name: "market",
  description: "EQUIPA 5 — Mercado: SerpAPI, Brave Search, Tavily",
  tools: [...marketSerpTools, ...marketBraveTools, ...marketTavilyTools],
};
