import type { TeamDefinition } from "../../types.js";
import { creativeStabilityTools } from "./stability.js";
import { creativeElevenlabsTools } from "./elevenlabs.js";
import { creativeReplicateTools } from "./replicate.js";

export const creativeTeam: TeamDefinition = {
  name: "creative",
  description: "EQUIPA 9 — Criativo: Stability AI (imagens), ElevenLabs (voz), Replicate (modelos)",
  tools: [...creativeStabilityTools, ...creativeElevenlabsTools, ...creativeReplicateTools],
};
