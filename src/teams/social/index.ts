import type { TeamDefinition } from "../../types.js";
import { socialFacebookTools } from "./facebook.js";
import { socialInstagramTools } from "./instagram.js";
import { socialTwitterTools } from "./twitter.js";
import { socialLinkedinTools } from "./linkedin.js";
import { socialTiktokTools } from "./tiktok.js";
import { socialYoutubeTools } from "./youtube.js";

export const socialTeam: TeamDefinition = {
  name: "social",
  description:
    "EQUIPA 4 — Redes Sociais: Facebook (16 tools), Instagram, Twitter/X, LinkedIn, TikTok, YouTube",
  tools: [
    ...socialFacebookTools,
    ...socialInstagramTools,
    ...socialTwitterTools,
    ...socialLinkedinTools,
    ...socialTiktokTools,
    ...socialYoutubeTools,
  ],
};
