import type { TeamDefinition } from "../../types.js";
import { marketingBrevoTools } from "./brevo.js";
import { marketingHubspotTools } from "./hubspot.js";
import { marketingNotionTools } from "./notion.js";

export const marketingTeam: TeamDefinition = {
  name: "marketing",
  description: "EQUIPA 6 — Marketing: Brevo (email), HubSpot (CRM), Notion",
  tools: [...marketingBrevoTools, ...marketingHubspotTools, ...marketingNotionTools],
};
