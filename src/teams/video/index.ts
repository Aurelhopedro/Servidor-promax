import type { TeamDefinition } from "../../types";
import { videoCreatomateTools } from "./creatomate";
import { videoShotstackTools } from "./shotstack";
import { videoCloudinaryTools } from "./cloudinary";

export const videoTeam: TeamDefinition = {
  name: "video",
  description: "EQUIPA 2 — Vídeo: Creatomate, Shotstack, Cloudinary",
  tools: [...videoCreatomateTools, ...videoShotstackTools, ...videoCloudinaryTools],
};
