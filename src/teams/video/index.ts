import type { TeamDefinition } from "../../types.js";
import { videoCreatomateTools } from "./creatomate.js";
import { videoShotstackTools } from "./shotstack.js";
import { videoCloudinaryTools } from "./cloudinary.js";

export const videoTeam: TeamDefinition = {
  name: "video",
  description: "EQUIPA 2 — Vídeo: Creatomate, Shotstack, Cloudinary",
  tools: [...videoCreatomateTools, ...videoShotstackTools, ...videoCloudinaryTools],
};
