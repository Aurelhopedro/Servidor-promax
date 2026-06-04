import type { TeamDefinition } from "../../types";
import { creativeStabilityTools } from "./stability";
import { creativeElevenlabsTools } from "./elevenlabs";
import { creativeReplicateTools } from "./replicate";

export const creativeTeam: TeamDefinition = {
  name: "creative",
  description: "EQUIPA 9 — Criativo: Stability AI (imagens), ElevenLabs (voz), Replicate (modelos)",
  tools: [...creativeStabilityTools, ...creativeElevenlabsTools, ...creativeReplicateTools],
};
