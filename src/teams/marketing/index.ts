import type { TeamDefinition } from "../../types";
import { marketingBrevoTools } from "./brevo";
import { marketingHubspotTools } from "./hubspot";
import { marketingNotionTools } from "./notion";

export const marketingTeam: TeamDefinition = {
  name: "marketing",
  description: "EQUIPA 6 — Marketing: Brevo (email), HubSpot (CRM), Notion",
  tools: [...marketingBrevoTools, ...marketingHubspotTools, ...marketingNotionTools],
};
